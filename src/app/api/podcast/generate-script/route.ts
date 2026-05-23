import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { canUsePodcastDiscussionMode } from "@/lib/podcast/access";
import { resolvePodcastEligibility, type PodcastSourceProfile } from "@/lib/podcast/eligibility";
import { generatePodcastDiscussionScript } from "@/lib/podcast/generate-podcast-script";
import type {
  PodcastDiscussionAnalysisInput,
  PodcastDiscussionMetadata,
  PodcastQuizQuestionInput,
} from "@/lib/podcast/podcast-types";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { mergeAnalysisPodcastDiscussion } from "@/server/analyses/mergeAnalysisPodcastDiscussion";
import { trackProductEvent } from "@/server/usage/trackProductEvent";
import type { AnalysisResult } from "@/types/text-analysis";

type PodcastGenerateBody = {
  analysisId?: string;
  regenerate?: boolean;
  sourceProfile?: PodcastSourceProfile;
  analysisPayload?: Partial<AnalysisResult> & {
    sourceType?: string | null;
    sourceLabel?: string | null;
    intelligenceMode?: string | null;
    documentType?: string | null;
    quizQuestions?: PodcastQuizQuestionInput[];
  };
};

function oralQuizQuestions(
  row: NonNullable<Awaited<ReturnType<typeof getAnalysisById>>>,
): PodcastQuizQuestionInput[] {
  const oralQuiz = row.metadata?.multiFormatLearn?.formats.find(
    (format) => format.type === "oral_quiz",
  );
  if (!oralQuiz) return [];
  return oralQuiz.items.slice(0, 8).map((item) => ({
    question: item.label,
    theme: item.detail ?? null,
  }));
}

function buildInputFromRow(
  row: Awaited<ReturnType<typeof getAnalysisById>>,
): PodcastDiscussionAnalysisInput | null {
  if (!row?.summary?.summary) return null;
  return {
    title: row.summary.title ?? row.title ?? "Analysis",
    summary: row.summary.summary,
    keyInsights: row.summary.keyInsights ?? [],
    learnCards: row.learn_cards ?? [],
    quizQuestions: oralQuizQuestions(row),
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

function meaningfulAnalysisCount(input: PodcastDiscussionAnalysisInput): number {
  const insights = input.keyInsights.filter((item) => item.trim().length >= 12).length;
  const cards = (input.learnCards ?? []).filter(
    (card) =>
      !card.isLockedPreview &&
      (card.title.trim().length >= 12 || card.content.trim().length >= 12),
  ).length;
  return insights + cards;
}

function resolveRouteEligibility(
  input: PodcastDiscussionAnalysisInput,
  sourceProfile?: PodcastSourceProfile,
) {
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
    meaningfulAnalysisCandidateCount: meaningfulAnalysisCount(input),
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
      {
        success: false,
        error: "Podcast Mode is available on Pro, Scholar, and Team plans.",
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as PodcastGenerateBody | null;
  const regenerate = Boolean(body?.regenerate);

  let analysisInput: PodcastDiscussionAnalysisInput | null = null;
  let cachedPodcast: PodcastDiscussionMetadata | undefined;

  if (body?.analysisId && body.analysisId !== "live-analysis") {
    const row = await getAnalysisById(body.analysisId, user.id);
    if (!row) {
      return NextResponse.json(
        { success: false, error: "Analysis not found." },
        { status: 404 },
      );
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

  const eligibility = resolveRouteEligibility(analysisInput, body?.sourceProfile);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { success: false, error: eligibility.reason, eligibility },
      { status: 409 },
    );
  }

  if (cachedPodcast && !regenerate) {
    return NextResponse.json({
      success: true,
      podcast: cachedPodcast,
      cached: true,
    });
  }

  try {
    const podcast: PodcastDiscussionMetadata = {
      ...(await generatePodcastDiscussionScript(analysisInput)),
      generatedAt: new Date().toISOString(),
    };

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

    return NextResponse.json({
      success: true,
      podcast,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Podcast script generation failed.";
    return NextResponse.json(
      {
        success: false,
        error: /configured|GROQ|Gemini/i.test(message)
          ? "Podcast script generation is not available right now."
          : "Podcast script could not be generated right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
