import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import {
  canUseAudioStudyMode,
  getAudioStudyScriptLimits,
} from "@/lib/audio-study/access";
import { normalizePollyVoiceId } from "@/lib/audio-study/pollyVoices";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import {
  buildPollyDataUrl,
  generatePollySpeech,
  getPollyEnvCheck,
  logPollyErrorFull,
} from "@/server/audio/polly";
import {
  AUDIO_STUDY_PROVIDER_BROWSER,
  AUDIO_STUDY_PROVIDER_POLLY,
} from "@/lib/audio-study/provider";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { mergeAnalysisAudioStudy } from "@/server/analyses/mergeAnalysisAudioStudy";
import { generateAudioStudyScript } from "@/server/audio-study/generateAudioStudyScript";
import { createClientIfConfigured } from "@/lib/supabase/server";
import type { AudioStudyAnalysisInput, AudioStudyMetadata } from "@/types/audio-study";
import type { AnalysisResult } from "@/types/text-analysis";
import type { UserLimits } from "@/types/database";

type FeatureUsageCheck = {
  allowed: boolean;
  used: number;
  limit: number;
  resetDaily: boolean;
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyAudioLessonLimit(planId: string): number {
  if (planId === "free") return 3;
  if (planId === "scholar") return 10;
  return 999;
}

async function checkAndPrepareAudioUsage(userId: string, limit: number): Promise<FeatureUsageCheck | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const today = utcToday();
  const { data: row } = await supabase
    .from("user_limits")
    .select("daily_audio_lesson_count, daily_analysis_count, daily_podcast_count, monthly_analysis_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  const last = typeof row?.last_reset_date === "string" ? row.last_reset_date.slice(0, 10) : today;
  const resetDaily = last !== today;
  const used = resetDaily ? 0 : (row?.daily_audio_lesson_count ?? 0);

  return {
    allowed: limit === 999 ? true : used < limit,
    used,
    limit,
    resetDaily,
  };
}

async function incrementAudioUsage(userId: string): Promise<void> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return;

  const today = utcToday();
  const now = new Date().toISOString();
  const { data: row } = await supabase
    .from("user_limits")
    .select("daily_analysis_count, daily_audio_lesson_count, daily_podcast_count, monthly_analysis_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    await supabase.from("user_limits").upsert({
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
  const nextAudioCount = resetDaily ? 1 : (row.daily_audio_lesson_count ?? 0) + 1;

  await supabase
    .from("user_limits")
    .update({
      daily_audio_lesson_count: nextAudioCount,
      daily_analysis_count: resetDaily ? 0 : (row.daily_analysis_count ?? 0),
      daily_podcast_count: resetDaily ? 0 : (row.daily_podcast_count ?? 0),
      monthly_analysis_count: row.monthly_analysis_count ?? 0,
      last_reset_date: today,
      updated_at: now,
    } satisfies Partial<UserLimits>)
    .eq("user_id", userId);
}

type GenerateBody = {
  analysisId?: string;
  analysisPayload?: Partial<AnalysisResult> & AudioStudyAnalysisInput;
  regenerate?: boolean;
  voiceId?: string;
  synthesizeOnly?: boolean;
  /** When re-synthesizing audio for an existing lesson (e.g. voice change). */
  script?: string;
  title?: string;
  durationEstimate?: string;
  sections?: AudioStudyMetadata["sections"];
};

function buildInputFromRow(
  row: Awaited<ReturnType<typeof getAnalysisById>>,
): AudioStudyAnalysisInput | null {
  if (!row?.summary) return null;
  return {
    title: row.summary.title ?? row.title ?? "Analysis",
    summary: row.summary.summary,
    keyInsights: row.summary.keyInsights ?? [],
    risksOrWarnings: row.summary.risksOrWarnings ?? [],
    actionItems: row.summary.actionItems ?? [],
    learnCards: (row.learn_cards ?? []).map((c) => ({
      title: c.title,
      type: c.type,
      content: c.content,
    })),
    sourceType: row.source_kind,
    intelligenceMode: row.intelligence_mode,
    sourceLabel: row.source_label,
  };
}

function buildInputFromPayload(
  payload: GenerateBody["analysisPayload"],
): AudioStudyAnalysisInput | null {
  if (!payload?.summary) return null;
  return {
    title: payload.title ?? "Analysis",
    summary: payload.summary,
    keyInsights: payload.keyInsights ?? [],
    risksOrWarnings: payload.risksOrWarnings ?? [],
    actionItems: payload.actionItems ?? [],
    learnCards: (payload.learnCards ?? []).map((c) => ({
      title: c.title,
      type: c.type,
      content: c.content,
    })),
    quizThemes: payload.quizThemes,
    sourceType: payload.sourceType,
    intelligenceMode: payload.intelligenceMode,
    sourceLabel: payload.sourceLabel,
  };
}

type PollyAudioPayload = {
  audioBase64: string;
  audioMime: string;
  audioUrl: string;
  provider: typeof AUDIO_STUDY_PROVIDER_POLLY;
  fallback: false;
};

/** Maximum characters per Polly chunk (safe limit below AWS 3000 limit). */
const AUDIO_STUDY_CHUNK_CHAR_LIMIT = 2400;

/**
 * Split text into chunks that are safe for AWS Polly.
 * Splits at paragraph/sentence boundaries when possible.
 */
function chunkTextForPolly(text: string): string[] {
  if (text.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
    return [text];
  }

  const chunks: string[] = [];
  let current = "";

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If adding this paragraph keeps us under limit, append it
    const joined = current ? `${current}\n\n${trimmed}` : trimmed;
    if (joined.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
      current = joined;
      continue;
    }

    // If current has content, save it and start new
    if (current) {
      chunks.push(current);
      current = "";
    }

    // If single paragraph is too long, split by sentences
    if (trimmed.length > AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (!sentence) continue;

        // If sentence itself is too long, hard-split it
        if (sentence.length > AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
          if (current) {
            chunks.push(current);
            current = "";
          }
          for (let offset = 0; offset < sentence.length; offset += AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
            chunks.push(sentence.slice(offset, offset + AUDIO_STUDY_CHUNK_CHAR_LIMIT));
          }
          continue;
        }

        const nextJoined = current ? `${current} ${sentence}` : sentence;
        if (nextJoined.length <= AUDIO_STUDY_CHUNK_CHAR_LIMIT) {
          current = nextJoined;
        } else {
          chunks.push(current);
          current = sentence;
        }
      }
    } else {
      current = trimmed;
    }
  }

  if (current) {
    chunks.push(current);
  }

  // Clean up whitespace in chunks
  return chunks.map((c) => c.replace(/\s+/g, " ").trim()).filter((c) => c.length > 0);
}

async function synthesizeWithPolly(
  scriptText: string,
  voiceId: string,
): Promise<PollyAudioPayload | null> {
  const envCheck = getPollyEnvCheck();
  if (!envCheck.envConfigured) {
    console.warn("[audio-study] polly_skipped", { reason: "env_not_configured" });
    return null;
  }

  // Chunk the text for safe Polly synthesis
  const chunks = chunkTextForPolly(scriptText);

  if (chunks.length === 0) {
    console.warn("[audio-study] polly_skipped", { reason: "no_chunks" });
    return null;
  }

  console.log("[audio-study] polly_chunking", {
    originalLength: scriptText.length,
    chunkCount: chunks.length,
    maxChunkLength: Math.max(...chunks.map((c) => c.length)),
    voiceId,
  });

  try {
    const audioBuffers: Buffer[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await generatePollySpeech({ text: chunks[i], voiceId });
        audioBuffers.push(result.audio);
        successCount++;
      } catch (chunkError) {
        errorCount++;
        console.warn("[audio-study] chunk_synthesis_failed", {
          chunkIndex: i,
          textLength: chunks[i].length,
          error: chunkError instanceof Error ? chunkError.message : String(chunkError),
        });
      }
    }

    if (audioBuffers.length === 0) {
      console.warn("[audio-study] polly_all_chunks_failed", {
        chunkCount: chunks.length,
        voiceId,
      });
      return null;
    }

    // Log partial failures
    if (errorCount > 0) {
      console.warn("[audio-study] polly_partial_failure", {
        successCount,
        errorCount,
        totalChunks: chunks.length,
      });
    }

    // Concatenate all audio buffers
    const merged = Buffer.concat(audioBuffers);
    const audioBase64 = merged.toString("base64");
    const audioMime = "audio/mpeg";

    return {
      audioBase64,
      audioMime,
      audioUrl: buildPollyDataUrl(audioBase64, audioMime),
      provider: AUDIO_STUDY_PROVIDER_POLLY,
      fallback: false,
    };
  } catch (err) {
    logPollyErrorFull(err, { voiceId, scriptChars: scriptText.length, chunkCount: chunks.length });
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to generate audio lessons." }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  const planId = resolveEntitlementPlanIdFromProfile(profile);

  if (!canUseAudioStudyMode(planId, hasActivePaidEntitlement(profile ?? undefined))) {
    return NextResponse.json(
      { error: "Audio Study Mode is available on Pro, Scholar, and Team plans." },
      { status: 403 },
    );
  }

  const dailyLimit = getDailyAudioLessonLimit(planId);
  const usageCheck = await checkAndPrepareAudioUsage(user.id, dailyLimit);
  if (usageCheck && !usageCheck.allowed) {
    return NextResponse.json(
      {
        error: "daily_limit_reached",
        limit: usageCheck.limit,
        used: usageCheck.used,
      },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as GenerateBody | null;
  const regenerate = Boolean(body?.regenerate);
  const synthesizeOnly = Boolean(body?.synthesizeOnly);
  const voiceId = normalizePollyVoiceId(body?.voiceId);

  let analysisInput: AudioStudyAnalysisInput | null = null;
  let cachedMeta: AudioStudyMetadata | undefined;

  if (body?.analysisId && body.analysisId !== "live-analysis") {
    const row = await getAnalysisById(body.analysisId, user.id);
    if (!row) {
      return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
    }
    analysisInput = buildInputFromRow(row);
    cachedMeta = row.metadata?.audioStudy;
  }

  if (!analysisInput && body?.analysisPayload) {
    analysisInput = buildInputFromPayload(body.analysisPayload);
  }

  if (!analysisInput) {
    return NextResponse.json({ error: "Analysis content is required." }, { status: 400 });
  }

  const limits = getAudioStudyScriptLimits(planId);
  const inlineScript = body?.script?.trim();
  const hadCachedScript =
    !regenerate &&
    Boolean(
      (inlineScript && inlineScript.length > 0) ||
        (cachedMeta?.script && cachedMeta.script.length > 0),
    );

  try {
    let scriptBundle: AudioStudyMetadata;

    if (synthesizeOnly && inlineScript) {
      scriptBundle = {
        title: body?.title ?? cachedMeta?.title ?? "Lesson",
        durationEstimate:
          body?.durationEstimate ?? cachedMeta?.durationEstimate ?? "A few minutes",
        script: inlineScript,
        sections: body?.sections ?? cachedMeta?.sections ?? [],
        voice: voiceId,
        generatedAt: cachedMeta?.generatedAt ?? new Date().toISOString(),
      };
    } else if (hadCachedScript && cachedMeta && !regenerate) {
      scriptBundle = { ...cachedMeta, voice: voiceId };
    } else {
      const generated = await generateAudioStudyScript(analysisInput, limits);
      scriptBundle = {
        ...generated,
        voice: voiceId,
        generatedAt: new Date().toISOString(),
      };
      if (body?.analysisId && body.analysisId !== "live-analysis") {
        await mergeAnalysisAudioStudy(body.analysisId, user.id, scriptBundle);
      }
    }

    const pollyAudio = await synthesizeWithPolly(scriptBundle.script, voiceId);
    const usePolly = pollyAudio !== null;
    const provider = usePolly ? AUDIO_STUDY_PROVIDER_POLLY : AUDIO_STUDY_PROVIDER_BROWSER;
    const playback = usePolly ? "polly" : "browser";

    await trackProductEvent({
      eventType: "audio_study_script_generated",
      userId: user.id,
      sourceType: analysisInput.sourceType ?? null,
      intelligenceMode: analysisInput.intelligenceMode ?? null,
      plan: planId,
      metadata: {
        analysis_id: body?.analysisId ?? null,
        cached: hadCachedScript,
        playback,
        provider,
        voice_id: voiceId,
        polly: usePolly,
        fallback: !usePolly,
      },
      insertViaServiceRole: true,
    });

    await incrementAudioUsage(user.id);

    const usedAfter = usageCheck ? usageCheck.used + 1 : null;

    return NextResponse.json({
      title: scriptBundle.title,
      durationEstimate: scriptBundle.durationEstimate,
      script: scriptBundle.script,
      sections: scriptBundle.sections,
      cached: hadCachedScript && !regenerate,
      voiceId,
      playback,
      provider,
      fallback: !usePolly,
      ...(usePolly && pollyAudio
        ? {
            audioUrl: pollyAudio.audioUrl,
            audioBase64: pollyAudio.audioBase64,
            audioMime: pollyAudio.audioMime,
          }
        : {}),
      usage:
        usageCheck
          ? {
              used: usedAfter,
              limit: usageCheck.limit,
            }
          : undefined,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Lesson script could not be generated right now.";
    return NextResponse.json(
      {
        error: message.includes("GROQ")
          ? "Lesson script generation is not available right now."
          : "Lesson script could not be generated right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
