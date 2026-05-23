import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { canUsePodcastDiscussionMode } from "@/lib/podcast/access";
import { resolvePodcastEligibility, type PodcastSourceProfile } from "@/lib/podcast/eligibility";
import { generatePodcastDiscussionScript } from "@/lib/podcast/generate-podcast-script";
import { resolvePodcastTone } from "@/lib/podcast/resolvePodcastTone";
import type {
  PodcastToneProfile,
  PodcastDiscussionAnalysisInput,
  PodcastDiscussionMetadata,
  PodcastQuizQuestionInput,
} from "@/lib/podcast/podcast-types";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { mergeAnalysisPodcastDiscussion } from "@/server/analyses/mergeAnalysisPodcastDiscussion";
import { generatePodcastDiscussionAudio } from "@/server/podcast/generatePodcastDiscussionAudio";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import { createClientIfConfigured } from "@/lib/supabase/server";
import type { UserLimits } from "@/types/database";
import type { AnalysisResult } from "@/types/text-analysis";

type FeatureUsageCheck = {
  allowed: boolean;
  used: number;
  limit: number;
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyPodcastLimit(planId: string): number {
  if (planId === "free") return 1;
  if (planId === "scholar") return 5;
  return 999;
}

async function checkAndPreparePodcastUsage(userId: string, limit: number): Promise<FeatureUsageCheck | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const today = utcToday();
  const { data: row } = await supabase
    .from("user_limits")
    .select("daily_podcast_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  const last = typeof row?.last_reset_date === "string" ? row.last_reset_date.slice(0, 10) : today;
  const used = last !== today ? 0 : (row?.daily_podcast_count ?? 0);

  return {
    allowed: limit === 999 ? true : used < limit,
    used,
    limit,
  };
}

async function incrementPodcastUsage(userId: string): Promise<void> {
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
      daily_audio_lesson_count: 0,
      daily_podcast_count: 1,
      monthly_analysis_count: 0,
      last_reset_date: today,
      updated_at: now,
    });
    return;
  }

  const last = typeof row.last_reset_date === "string" ? row.last_reset_date.slice(0, 10) : today;
  const resetDaily = last !== today;
  const nextPodcastCount = resetDaily ? 1 : (row.daily_podcast_count ?? 0) + 1;

  await supabase
    .from("user_limits")
    .update({
      daily_podcast_count: nextPodcastCount,
      daily_analysis_count: resetDaily ? 0 : (row.daily_analysis_count ?? 0),
      daily_audio_lesson_count: resetDaily ? 0 : (row.daily_audio_lesson_count ?? 0),
      monthly_analysis_count: row.monthly_analysis_count ?? 0,
      last_reset_date: today,
      updated_at: now,
    } satisfies Partial<UserLimits>)
    .eq("user_id", userId);
}

type PodcastGenerateBody = {
  analysisId?: string;
  regenerate?: boolean;
  densityMode?: "quick" | "standard" | "deep-dive" | "critical" | "debate";
  toneProfile?: PodcastToneProfile;
  sourceProfile?: PodcastSourceProfile;
  analysisPayload?: Partial<AnalysisResult> & {
    sourceType?: string | null;
    sourceLabel?: string | null;
    intelligenceMode?: string | null;
    documentType?: string | null;
    quizQuestions?: PodcastQuizQuestionInput[];
  };
};

function buildInputFromRow(
  row: Awaited<ReturnType<typeof getAnalysisById>>,
): PodcastDiscussionAnalysisInput | null {
  if (!row?.summary?.summary) return null;
  const oralQuiz = row.metadata?.multiFormatLearn?.formats.find(
    (format) => format.type === "oral_quiz",
  );
  return {
    title: row.summary.title ?? row.title ?? "Analysis",
    summary: row.summary.summary,
    keyInsights: row.summary.keyInsights ?? [],
    learnCards: row.learn_cards ?? [],
    quizQuestions: (oralQuiz?.items ?? []).slice(0, 8).map((item) => ({
      question: item.label,
      theme: item.detail ?? null,
    })),
    sourceType: row.source_kind,
    intelligenceMode: row.intelligence_mode,
    sourceMetadata: {
      documentType: row.document_type ?? row.metadata?.documentTypeGuess,
      sourceLabel: row.source_label,
    },
  };
}

function buildInputFromPayload(
  payload: PodcastGenerateBody["analysisPayload"],
  sourceProfile?: PodcastSourceProfile,
): PodcastDiscussionAnalysisInput | null {
  if (!payload?.summary) return null;
  return {
    title: payload.title ?? "Analysis",
    summary: payload.summary,
    keyInsights: payload.keyInsights ?? [],
    learnCards: payload.learnCards ?? [],
    quizQuestions: payload.quizQuestions ?? [],
    sourceType: payload.sourceType,
    intelligenceMode: payload.intelligenceMode,
    sourceMetadata: {
      documentType: payload.documentType,
      sourceLabel: payload.sourceLabel,
      estimatedPages: sourceProfile?.estimatedPages,
      extractedCharacterCount: sourceProfile?.extractedCharacterCount,
      youtubeDurationMinutes: sourceProfile?.youtubeDurationMinutes,
      transcriptCharacterCount: sourceProfile?.transcriptCharacterCount,
    },
  };
}

function routeEligibility(
  input: PodcastDiscussionAnalysisInput,
  sourceProfile?: PodcastSourceProfile,
) {
  const analysisCandidates =
    input.keyInsights.filter((item) => item.trim().length >= 12).length +
    (input.learnCards ?? []).filter(
      (card) =>
        !card.isLockedPreview &&
        (card.title.trim().length >= 12 || card.content.trim().length >= 12),
    ).length;

  return resolvePodcastEligibility({
    ...sourceProfile,
    sourceKind:
      sourceProfile?.sourceKind ??
      (input.sourceType === "youtube"
        ? "youtube"
        : input.sourceType === "url"
          ? "url"
          : input.sourceType === "presentation"
            ? "presentation"
            : input.sourceType === "file"
              ? "file"
              : null),
    meaningfulAnalysisCandidateCount: analysisCandidates,
  });
}

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Sign in to generate podcast discussions." },
      { status: 401 },
    );
  }

  const profile = await getProfile(user.id);
  const planId = resolveEntitlementPlanIdFromProfile(profile);
  if (!canUsePodcastDiscussionMode(planId, hasActivePaidEntitlement(profile ?? undefined))) {
    return NextResponse.json(
      { success: false, error: "Podcast Mode is available on Pro, Scholar, and Team plans." },
      { status: 403 },
    );
  }

  const dailyLimit = getDailyPodcastLimit(planId);
  const usageCheck = await checkAndPreparePodcastUsage(user.id, dailyLimit);
  if (usageCheck && !usageCheck.allowed) {
    return NextResponse.json(
      { error: "daily_limit_reached", limit: usageCheck.limit, used: usageCheck.used },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as PodcastGenerateBody | null;
  const regenerate = Boolean(body?.regenerate);
  let analysisInput: PodcastDiscussionAnalysisInput | null = null;
  let cachedPodcast: PodcastDiscussionMetadata | undefined;

  if (body?.analysisId && body.analysisId !== "live-analysis") {
    const row = await getAnalysisById(body.analysisId, user.id);
    if (!row) {
      return NextResponse.json({ success: false, error: "Analysis not found." }, { status: 404 });
    }
    analysisInput = buildInputFromRow(row);
    cachedPodcast = row.metadata?.podcastDiscussion;
  }
  if (!analysisInput && body?.analysisPayload) {
    analysisInput = buildInputFromPayload(body.analysisPayload, body.sourceProfile);
  }
  if (!analysisInput) {
    return NextResponse.json(
      { success: false, error: "Analysis content is required." },
      { status: 400 },
    );
  }

  const eligibility = routeEligibility(analysisInput, body?.sourceProfile);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { success: false, error: eligibility.reason, eligibility },
      { status: 409 },
    );
  }

  // Determine effective density mode (user selection or auto-detect)
  const effectiveDensityMode = body?.densityMode;
  const effectiveToneProfile: PodcastToneProfile =
    body?.toneProfile ?? resolvePodcastTone(analysisInput.sourceMetadata?.documentType);

  // Check if cached podcast matches the requested density mode
  const cacheMatchesDensity = cachedPodcast && (
    !effectiveDensityMode ||
    cachedPodcast.densityMode === effectiveDensityMode
  );
  const cacheMatchesTone = cachedPodcast && (
    !effectiveToneProfile ||
    (cachedPodcast.toneProfile ?? "casual") === effectiveToneProfile
  );
  const cacheMatchesVariant = Boolean(cacheMatchesDensity && cacheMatchesTone);

  try {
    let scriptCached = Boolean(cacheMatchesVariant && !regenerate);
    let podcast = cacheMatchesVariant ? cachedPodcast : undefined;
    if (!podcast || regenerate) {
      try {
        podcast = {
          ...(await generatePodcastDiscussionScript(analysisInput, effectiveDensityMode, effectiveToneProfile)),
          generatedAt: new Date().toISOString(),
        };
      } catch (scriptError) {
        console.error("[podcast] script_generation_failed", {
          error: scriptError instanceof Error ? scriptError.message : String(scriptError),
          stack: scriptError instanceof Error ? scriptError.stack : undefined,
          analysisId: body?.analysisId,
          sourceType: analysisInput.sourceType,
          sourceMetadata: analysisInput.sourceMetadata,
          inputTitle: analysisInput.title,
          keyInsightsCount: analysisInput.keyInsights.length,
          learnCardsCount: (analysisInput.learnCards ?? []).length,
        });
        throw scriptError;
      }

      scriptCached = false;
      if (body?.analysisId && body.analysisId !== "live-analysis") {
        await mergeAnalysisPodcastDiscussion(body.analysisId, user.id, podcast);
      }
      await trackProductEvent({
        eventType: regenerate ? "podcast_script_regenerated" : "podcast_script_generated",
        userId: user.id,
        sourceType: analysisInput.sourceType ?? null,
        intelligenceMode: analysisInput.intelligenceMode ?? null,
        plan: planId,
        metadata: {
          analysis_id: body?.analysisId ?? null,
          word_count: podcast.totalWordCount,
          duration_minutes: podcast.estimatedDurationMinutes,
          cached: false,
        },
        insertViaServiceRole: true,
      });
    }

    try {
      const audio = await generatePodcastDiscussionAudio(podcast);
      await trackProductEvent({
        eventType: regenerate ? "podcast_audio_regenerated" : "podcast_audio_generated",
        userId: user.id,
        sourceType: analysisInput.sourceType ?? null,
        intelligenceMode: analysisInput.intelligenceMode ?? null,
        plan: planId,
        metadata: {
          analysis_id: body?.analysisId ?? null,
          word_count: podcast.totalWordCount,
          duration_minutes: podcast.estimatedDurationMinutes,
          voice_host: audio.voices[0]?.voiceId ?? null,
          voice_expert: audio.voices[1]?.voiceId ?? null,
          chunk_count: audio.audioBase64.length,
          cached: scriptCached,
        },
        insertViaServiceRole: true,
      });
      await incrementPodcastUsage(user.id);
      return NextResponse.json({
        success: true,
        podcast,
        audio,
        cached: scriptCached,
        usage: usageCheck
          ? {
              used: usageCheck.used + 1,
              limit: usageCheck.limit,
            }
          : undefined,
      });
    } catch (audioError) {
      console.error("[podcast] audio_generation_failed", {
        error: audioError instanceof Error ? audioError.message : String(audioError),
        stack: audioError instanceof Error ? audioError.stack : undefined,
        analysisId: body?.analysisId,
        podcastTitle: podcast.title,
        totalWordCount: podcast.totalWordCount,
        scriptLength: podcast.script.length,
      });
      await trackProductEvent({
        eventType: "podcast_audio_failed",
        userId: user.id,
        sourceType: analysisInput.sourceType ?? null,
        intelligenceMode: analysisInput.intelligenceMode ?? null,
        plan: planId,
        success: false,
        failureStage: "audio_generation",
        metadata: {
          analysis_id: body?.analysisId ?? null,
          word_count: podcast.totalWordCount,
          error: audioError instanceof Error ? audioError.message : "Unknown error",
        },
        insertViaServiceRole: true,
      });
      throw audioError;
    }
  } catch (error) {
    console.error("[podcast] generation_pipeline_failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      analysisId: body?.analysisId,
      userId: user.id,
      sourceType: analysisInput?.sourceType,
    });
    const message = error instanceof Error ? error.message : "Podcast generation failed.";
    return NextResponse.json(
      {
        success: false,
        error: /configured|GROQ|Gemini/i.test(message)
          ? "Podcast discussion generation is not available right now."
          : "Podcast discussion could not be generated right now. Please try again.",
        debugMessage: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
