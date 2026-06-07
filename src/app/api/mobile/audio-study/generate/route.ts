import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { canUseAudioStudyMode, getAudioStudyScriptLimits } from "@/lib/audio-study/access";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { getMobileUserFromBearer } from "@/server/auth/getMobileUserFromBearer";
import { generatePollySpeech, getPollyEnvCheck, logPollyErrorFull } from "@/server/audio/polly";
import { generateAudioStudyScript } from "@/server/audio-study/generateAudioStudyScript";
import { devLog, devWarn } from "@/server/logging";
import { getServerSupabaseAdmin } from "@/server/supabase/admin";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import type { AudioStudyAnalysisInput, AudioStudyScript } from "@/types/audio-study";
import type { Profile, UserLimits } from "@/types/database";
import type { PlanId } from "@/types/plan";

export const runtime = "nodejs";

const AUDIO_STUDY_BUCKET = "audio-study";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
const AUDIO_STUDY_CHUNK_CHAR_LIMIT = 2400;
const FREE_AUDIO_STUDY_LIMIT = 3;
const AUDIO_STUDY_USAGE_FEATURE = "audio_study";
const SUPPORTED_LANGUAGES = ["en", "tr", "es", "fr", "de", "ar"] as const;

type MobileAudioStudyLanguage = (typeof SUPPORTED_LANGUAGES)[number];

type MobileLearnCard = {
  title?: unknown;
  type?: unknown;
  content?: unknown;
};

type MobileAnalysisPayload = {
  title?: unknown;
  summary?: unknown;
  keyPoints?: unknown;
  learnCards?: unknown;
  rawSourceText?: unknown;
  documentKind?: unknown;
  sourceType?: unknown;
};

type MobileGenerateBody = {
  analysisPayload?: MobileAnalysisPayload;
  outputLanguage?: unknown;
  idempotencyKey?: unknown;
  voiceId?: unknown;
};

type FeatureUsageCheck = {
  allowed: boolean;
  used: number;
  limit: number;
};

type AudioStudyQuotaUsage = {
  freeUsed: number;
  freeLimit: number;
  freeRemaining: number;
  isPremium: boolean;
};

type MobileVoiceResolution = {
  voiceId: string;
  voiceFallback: boolean;
};

type StoredAudioResult = {
  audioUrl: string;
  expiresAt?: string;
};

type RecordedAudioStudyGeneration = {
  storagePath: string;
  createdAt?: string;
};

function jsonError(body: Record<string, unknown>, status: number) {
  return NextResponse.json({ ok: false, ...body }, { status });
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isSupportedLanguage(value: unknown): value is MobileAudioStudyLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as MobileAudioStudyLanguage);
}

function getMeaningfulString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeLearnCards(value: unknown): NonNullable<AudioStudyAnalysisInput["learnCards"]> {
  if (!Array.isArray(value)) return [];
  return (value as MobileLearnCard[])
    .map((card) => {
      const title = getMeaningfulString(card?.title) ?? "Study point";
      const type = getMeaningfulString(card?.type) ?? "note";
      const content = getMeaningfulString(card?.content);
      if (!content) return null;
      return { title, type, content };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null)
    .slice(0, 12);
}

function hasMeaningfulAnalysisPayload(payload: MobileAnalysisPayload | undefined): boolean {
  if (!payload) return false;
  return (
    normalizeStringArray(payload.summary).length > 0 ||
    normalizeStringArray(payload.keyPoints).length > 0 ||
    normalizeLearnCards(payload.learnCards).length > 0 ||
    Boolean(getMeaningfulString(payload.rawSourceText))
  );
}

function buildMobileAnalysisInput(payload: MobileAnalysisPayload): AudioStudyAnalysisInput | null {
  if (!hasMeaningfulAnalysisPayload(payload)) return null;

  const summaryParts = normalizeStringArray(payload.summary);
  const keyPoints = normalizeStringArray(payload.keyPoints);
  const learnCards = normalizeLearnCards(payload.learnCards);
  const rawSourceText = getMeaningfulString(payload.rawSourceText);

  const fallbackSummary = [
    ...keyPoints.slice(0, 8),
    ...learnCards.slice(0, 8).map((card) => `${card.title}: ${card.content}`),
    rawSourceText?.slice(0, 4000),
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n");

  const summary = summaryParts.join("\n") || fallbackSummary;
  if (!summary.trim()) return null;

  return {
    title: getMeaningfulString(payload.title) ?? "Audio Study",
    summary,
    keyInsights: keyPoints,
    learnCards,
    sourceType: getMeaningfulString(payload.sourceType) ?? getMeaningfulString(payload.documentKind),
    sourceLabel: getMeaningfulString(payload.documentKind),
  };
}

function resolveMobilePollyVoice(
  outputLanguage: MobileAudioStudyLanguage,
  requestedVoiceId?: unknown,
): MobileVoiceResolution {
  const supportedByLanguage: Record<MobileAudioStudyLanguage, string[]> = {
    en: ["Matthew", "Joanna", "Danielle", "Ruth"],
    tr: ["Filiz"],
    es: ["Lupe", "Lucia"],
    fr: ["Lea", "Celine"],
    de: ["Vicki", "Daniel"],
    ar: ["Zeina"],
  };
  const requested = getMeaningfulString(requestedVoiceId);
  const allowed = supportedByLanguage[outputLanguage];
  if (requested && allowed.includes(requested)) {
    return { voiceId: requested, voiceFallback: false };
  }
  return { voiceId: allowed[0], voiceFallback: Boolean(requested) };
}

function sanitizeStorageSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || randomUUID();
}

function buildStoragePath(userId: string, outputLanguage: MobileAudioStudyLanguage, key: string): string {
  return `audio-study/${userId}/${outputLanguage}/${sanitizeStorageSegment(key)}.mp3`;
}

function buildQuotaUsage(freeUsed: number, isPremium: boolean): AudioStudyQuotaUsage {
  return {
    freeUsed,
    freeLimit: FREE_AUDIO_STUDY_LIMIT,
    freeRemaining: Math.max(FREE_AUDIO_STUDY_LIMIT - freeUsed, 0),
    isPremium,
  };
}

function createGuestAudioStudyUserId(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const fingerprint = [forwardedFor, realIp, userAgent, acceptLanguage].join("|");
  const hash = createHash("sha256").update(fingerprint || randomUUID()).digest("hex").slice(0, 16);
  return `guest-${hash}`;
}

function isMissingAudioStudyUsageTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /audio_study_generations|relation .* does not exist|schema cache/i.test(error.message ?? "")
  );
}

function assertAudioStudyUsageTable(error: { code?: string; message?: string } | null): asserts error is null {
  if (!error) return;
  if (isMissingAudioStudyUsageTableError(error)) {
    throw new Error(
      "Audio Study quota table is not configured. Run the public.audio_study_generations migration.",
    );
  }
  throw new Error(error.message || "Audio Study quota query failed.");
}

function chunkTextForPolly(text: string): string[] {
  if (text.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) return [text];
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of text.split(/\n\n+/)) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    const joined = current ? `${current}\n\n${trimmed}` : trimmed;
    if (joined.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
      current = joined;
      continue;
    }
    if (current) chunks.push(current);
    current = "";
    for (const sentence of trimmed.split(/(?<=[.!?])\s+/)) {
      if (!sentence) continue;
      if (sentence.length > AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
        for (let offset = 0; offset < sentence.length; offset += AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
          chunks.push(sentence.slice(offset, offset + AUDIO_STUDY_CHUNK_CHAR_LIMIT));
        }
        continue;
      }
      const next = current ? `${current} ${sentence}` : sentence;
      if (next.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) current = next;
      else {
        chunks.push(current);
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.map((chunk) => chunk.replace(/\s+/g, " ").trim()).filter(Boolean);
}

async function synthesizePollyMp3(scriptText: string, voiceId: string): Promise<Buffer> {
  const envCheck = getPollyEnvCheck();
  if (!envCheck.envConfigured || !envCheck.canInitializeClient) {
    throw new Error("Polly is not configured for mobile audio study.");
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunkTextForPolly(scriptText)) {
    const result = await generatePollySpeech({ text: chunk, voiceId, outputFormat: "mp3" });
    buffers.push(result.audio);
  }

  if (buffers.length === 0) throw new Error("Polly returned no audio chunks.");
  return Buffer.concat(buffers);
}

async function getProfileByUserId(admin: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) {
    devWarn("[mobile-audio-study] profile_read_failed", { userId, message: error?.message ?? "not_found" });
    return null;
  }
  return data as Profile;
}

function getDailyAudioLessonLimit(planId: PlanId): number {
  if (planId === "free") return 3;
  if (planId === "scholar") return 10;
  return 999;
}

async function checkAndPrepareAudioUsage(
  admin: SupabaseClient,
  userId: string,
  limit: number,
): Promise<FeatureUsageCheck> {
  const today = utcToday();
  const { data: row } = await admin
    .from("user_limits")
    .select("daily_audio_lesson_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();
  const last = typeof row?.last_reset_date === "string" ? row.last_reset_date.slice(0, 10) : today;
  const used = last !== today ? 0 : (row?.daily_audio_lesson_count ?? 0);
  return { allowed: limit === 999 || used < limit, used, limit };
}

async function incrementAudioUsage(admin: SupabaseClient, userId: string): Promise<void> {
  const today = utcToday();
  const now = new Date().toISOString();
  const { data: row } = await admin
    .from("user_limits")
    .select("daily_analysis_count, daily_audio_lesson_count, daily_podcast_count, monthly_analysis_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    await admin.from("user_limits").upsert({
      user_id: userId,
      daily_analysis_count: 0,
      daily_audio_lesson_count: 1,
      daily_podcast_count: 0,
      monthly_analysis_count: 0,
      last_reset_date: today,
      updated_at: now,
    });
    return;
  }

  const last = typeof row.last_reset_date === "string" ? row.last_reset_date.slice(0, 10) : today;
  const resetDaily = last !== today;
  await admin
    .from("user_limits")
    .update({
      daily_audio_lesson_count: resetDaily ? 1 : (row.daily_audio_lesson_count ?? 0) + 1,
      daily_analysis_count: resetDaily ? 0 : (row.daily_analysis_count ?? 0),
      daily_podcast_count: resetDaily ? 0 : (row.daily_podcast_count ?? 0),
      monthly_analysis_count: row.monthly_analysis_count ?? 0,
      last_reset_date: today,
      updated_at: now,
    } satisfies Partial<UserLimits>)
    .eq("user_id", userId);
}

async function getFreeAudioStudyUsage(
  admin: SupabaseClient,
  userId: string,
  isPremium: boolean,
): Promise<AudioStudyQuotaUsage> {
  if (isPremium) return buildQuotaUsage(0, true);

  const { count, error } = await admin
    .from("audio_study_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", AUDIO_STUDY_USAGE_FEATURE);

  assertAudioStudyUsageTable(error);
  return buildQuotaUsage(count ?? 0, false);
}

async function getRecordedAudioStudyGeneration(
  admin: SupabaseClient,
  userId: string,
  idempotencyKey: string,
): Promise<RecordedAudioStudyGeneration | null> {
  const { data, error } = await admin
    .from("audio_study_generations")
    .select("storage_path, created_at")
    .eq("user_id", userId)
    .eq("feature", AUDIO_STUDY_USAGE_FEATURE)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  assertAudioStudyUsageTable(error);

  const storagePath = typeof data?.storage_path === "string" ? data.storage_path : null;
  if (!storagePath) return null;
  return {
    storagePath,
    createdAt: typeof data?.created_at === "string" ? data.created_at : undefined,
  };
}

async function recordAudioStudyGeneration(
  admin: SupabaseClient,
  userId: string,
  idempotencyKey: string,
  storagePath: string,
): Promise<boolean> {
  const { error } = await admin.from("audio_study_generations").insert({
    user_id: userId,
    feature: AUDIO_STUDY_USAGE_FEATURE,
    idempotency_key: idempotencyKey,
    storage_path: storagePath,
  });

  if (!error) return true;

  if (error.code === "23505") return false;
  assertAudioStudyUsageTable(error);
  return false;
}

async function createSignedAudioUrl(admin: SupabaseClient, path: string): Promise<StoredAudioResult> {
  const { data, error } = await admin.storage
    .from(AUDIO_STUDY_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Unable to create signed URL.");
  return {
    audioUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  };
}

async function getExistingStoredAudio(
  admin: SupabaseClient,
  path: string,
): Promise<StoredAudioResult | null> {
  const { data } = await admin.storage.from(AUDIO_STUDY_BUCKET).list(path.split("/").slice(0, -1).join("/"), {
    search: path.split("/").pop(),
    limit: 1,
  });
  if (!data?.some((item) => item.name === path.split("/").pop())) return null;
  return createSignedAudioUrl(admin, path);
}

async function storeAudio(admin: SupabaseClient, path: string, audio: Buffer): Promise<StoredAudioResult> {
  const { error } = await admin.storage.from(AUDIO_STUDY_BUCKET).upload(path, audio, {
    contentType: "audio/mpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return createSignedAudioUrl(admin, path);
}

function withLanguageInstruction(input: AudioStudyAnalysisInput, outputLanguage: MobileAudioStudyLanguage) {
  const labels: Record<MobileAudioStudyLanguage, string> = {
    en: "English",
    tr: "Turkish",
    es: "Spanish",
    fr: "French",
    de: "German",
    ar: "Arabic",
  };
  if (outputLanguage === "en") return input;
  return {
    ...input,
    summary: `MOBILE OUTPUT LANGUAGE OVERRIDE: Write the entire audio study script and every section in ${labels[outputLanguage]}.\n\n${input.summary}`,
  };
}

function responseAudioStudy(
  script: AudioStudyScript,
  stored: StoredAudioResult,
  voice: MobileVoiceResolution,
  outputLanguage: MobileAudioStudyLanguage,
  createdAt: string,
) {
  return {
    title: script.title,
    durationEstimate: script.durationEstimate,
    sections: script.sections,
    audioUrl: stored.audioUrl,
    audioMime: "audio/mpeg",
    provider: "aws-polly",
    voiceId: voice.voiceId,
    voiceFallback: voice.voiceFallback,
    outputLanguage,
    createdAt,
    ...(stored.expiresAt ? { expiresAt: stored.expiresAt } : {}),
  };
}

// This route is mobile-only and must not be used by the existing web Audio Study UI.
export async function POST(request: Request) {
  const auth = await getMobileUserFromBearer(request.headers.get("authorization"));
  const isGuest = !auth.ok;
  const guestUserId = isGuest ? createGuestAudioStudyUserId(request) : null;

  if (isGuest) {
    devLog("[mobile-audio-study] audio_study_guest_request_allowed", { userId: guestUserId });
  }

  if (!auth.ok && !guestUserId) {
    return jsonError({ error: "unauthorized", code: auth.code }, 401);
  }

  const body = (await request.json().catch(() => null)) as MobileGenerateBody | null;
  if (!body?.analysisPayload || !hasMeaningfulAnalysisPayload(body.analysisPayload)) {
    return jsonError({ error: "analysis_payload_required" }, 400);
  }

  const outputLanguage = isSupportedLanguage(body.outputLanguage) ? body.outputLanguage : "en";
  const analysisInput = buildMobileAnalysisInput(body.analysisPayload);
  if (!analysisInput) return jsonError({ error: "analysis_payload_required" }, 400);

  const idempotencyKey = getMeaningfulString(body.idempotencyKey);
  const storageKey = idempotencyKey ?? randomUUID();
  const userId = auth.ok ? auth.user.id : guestUserId!;
  const storagePath = buildStoragePath(userId, outputLanguage, storageKey);
  const voice = resolveMobilePollyVoice(outputLanguage, body.voiceId);
  const createdAt = new Date().toISOString();

  try {
    const admin = getServerSupabaseAdmin();
    const profile = auth.ok ? await getProfileByUserId(admin, userId) : null;
    const planId = resolveEntitlementPlanIdFromProfile(profile);
    const isPremium = canUseAudioStudyMode(planId, hasActivePaidEntitlement(profile));
    const quotaUsage = await getFreeAudioStudyUsage(admin, userId, isPremium);

    devLog("[mobile-audio-study] mobile_audio_free_quota_checked", {
      userId,
      freeUsed: quotaUsage.freeUsed,
      freeLimit: quotaUsage.freeLimit,
      freeRemaining: quotaUsage.freeRemaining,
      isPremium,
    });

    if (idempotencyKey) {
      const recorded = isPremium ? null : await getRecordedAudioStudyGeneration(admin, userId, idempotencyKey);
      const existing = recorded
        ? await createSignedAudioUrl(admin, recorded.storagePath)
        : await getExistingStoredAudio(admin, storagePath);

      if (existing) {
        if (!isPremium && !recorded && quotaUsage.freeUsed < FREE_AUDIO_STUDY_LIMIT) {
          const recordedMissingUsage = await recordAudioStudyGeneration(
            admin,
            userId,
            idempotencyKey,
            storagePath,
          );
          if (recordedMissingUsage) {
            devLog("[mobile-audio-study] mobile_audio_usage_recorded", {
              userId,
              recoveredIdempotentUsage: true,
            });
          }
        }

        const currentUsage = isPremium
          ? quotaUsage
          : await getFreeAudioStudyUsage(admin, userId, false);

        devLog("[mobile-audio-study] mobile_audio_idempotent_hit", {
          userId,
          outputLanguage,
          recorded: Boolean(recorded),
        });

        return NextResponse.json({
          ok: true,
          audioStudy: responseAudioStudy(
            {
              title: analysisInput.title,
              durationEstimate: "existing generated audio",
              script: "",
              sections: [],
            },
            existing,
            voice,
            outputLanguage,
            recorded?.createdAt ?? createdAt,
          ),
          usage: currentUsage,
        });
      }
    }

    if (!isPremium && quotaUsage.freeUsed >= FREE_AUDIO_STUDY_LIMIT) {
      devLog("[mobile-audio-study] mobile_audio_free_quota_exhausted", {
        userId,
        freeUsed: quotaUsage.freeUsed,
        freeLimit: quotaUsage.freeLimit,
      });
      return jsonError(
        {
          error: "audio_study_free_limit_reached",
          code: "audio_study_free_limit_reached",
          usage: buildQuotaUsage(FREE_AUDIO_STUDY_LIMIT, false),
        },
        403,
      );
    }

    if (!isPremium) {
      devLog("[mobile-audio-study] mobile_audio_free_quota_allowed", {
        userId,
        freeUsed: quotaUsage.freeUsed,
        freeLimit: quotaUsage.freeLimit,
        freeRemaining: quotaUsage.freeRemaining,
      });
    }

    const dailyLimit = getDailyAudioLessonLimit(planId);
    const usageCheck = await checkAndPrepareAudioUsage(admin, userId, dailyLimit);
    if (!usageCheck.allowed) {
      return jsonError({ error: "daily_limit_reached", used: usageCheck.used, limit: usageCheck.limit }, 429);
    }

    const script = await generateAudioStudyScript(
      withLanguageInstruction(analysisInput, outputLanguage),
      getAudioStudyScriptLimits(planId),
    );
    if (isGuest) {
      devLog("[mobile-audio-study] audio_study_guest_generation_started", {
        userId,
        outputLanguage,
        idempotent: Boolean(idempotencyKey),
      });
    }

    const audio = await synthesizePollyMp3(script.script, voice.voiceId);
    const stored = await storeAudio(admin, storagePath, audio);
    let responseUsage = quotaUsage;

    if (!isPremium) {
      const recorded = await recordAudioStudyGeneration(admin, userId, storageKey, storagePath);
      if (recorded) {
        devLog("[mobile-audio-study] mobile_audio_usage_recorded", {
          userId,
        });
      }
      responseUsage = await getFreeAudioStudyUsage(admin, userId, false);
    }

    await incrementAudioUsage(admin, userId);

    await trackProductEvent({
      eventType: "audio_study_script_generated",
      userId,
      sourceType: analysisInput.sourceType ?? null,
      intelligenceMode: analysisInput.intelligenceMode ?? null,
      plan: planId,
      metadata: {
        mobile: true,
        provider: "aws-polly",
        voice_id: voice.voiceId,
        voice_fallback: voice.voiceFallback,
        output_language: outputLanguage,
        idempotent: Boolean(idempotencyKey),
      },
      insertViaServiceRole: true,
    });

    return NextResponse.json({
      ok: true,
      audioStudy: responseAudioStudy(script, stored, voice, outputLanguage, createdAt),
      usage: responseUsage,
    });
  } catch (error) {
    const stackFirstLine = error instanceof Error ? error.stack?.split("\n").find(Boolean) ?? null : null;
    devWarn("[mobile-audio-study] generation_failed", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : "unknown_error",
      stackFirstLine,
      isGuest,
      userId,
      idempotencyKey,
      storagePath,
      outputLanguage,
      voiceId: voice.voiceId,
      pollyConfigured: getPollyEnvCheck().envConfigured && getPollyEnvCheck().canInitializeClient,
      supabaseBucket: AUDIO_STUDY_BUCKET,
      uploadAttempted: false,
      signedUrlAttempted: false,
    });
    devWarn("[mobile-audio-study] generation_failed", {
      userId,
      outputLanguage,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    logPollyErrorFull(error, { route: "mobile_audio_study", outputLanguage, voiceId: voice.voiceId });
    return jsonError({ error: "audio_generation_failed" }, 500);
  }
}
