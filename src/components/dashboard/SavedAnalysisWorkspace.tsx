"use client";

import { useMemo, useState } from "react";
import { PodcastPlayer } from "@/components/podcast/PodcastPlayer";
import {
  countPodcastAnalysisCandidates,
  PodcastWorkspaceCtas,
} from "@/components/podcast/PodcastWorkspaceCtas";
import { getIntelligenceModeById } from "@/config/modes";
import { LearningExperiencesResults } from "@/components/upload/LearningExperiencesResults";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionMetadata,
} from "@/lib/podcast/podcast-types";
import type { PodcastSourceProfile } from "@/lib/podcast/eligibility";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";
import type { AnalysisResult } from "@/types/text-analysis";

type SavedAnalysisWorkspaceProps = {
  analysisId: string;
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
  documentTypeGuess?: string | null;
  sourceKind?: string | null;
  sourceLabel?: string | null;
  showProviderMeta?: boolean;
  entitlementPlanId?: PlanId;
  metadata?: SavedAnalysisMetadata | null;
  podcastDiscussion?: PodcastDiscussionMetadata;
};

function mapSourceKind(sourceKind?: string | null): PodcastSourceProfile["sourceKind"] {
  if (
    sourceKind === "youtube" ||
    sourceKind === "url" ||
    sourceKind === "file" ||
    sourceKind === "presentation" ||
    sourceKind === "text"
  ) {
    return sourceKind === "text" ? "pasted-text" : sourceKind;
  }
  return null;
}

function SavedPodcastPanel({
  analysisId,
  podcastDiscussion,
}: {
  analysisId: string;
  podcastDiscussion: PodcastDiscussionMetadata;
}) {
  const [podcastAudio, setPodcastAudio] = useState<PodcastDiscussionAudio | null>(null);
  const [podcastCached, setPodcastCached] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastRegenerating, setPodcastRegenerating] = useState(false);
  const [podcastError, setPodcastError] = useState<string | null>(null);

  async function generatePodcastAudio(regenerate = false) {
    setPodcastError(null);
    if (regenerate) {
      setPodcastRegenerating(true);
    } else {
      setPodcastLoading(true);
    }

    try {
      const res = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          regenerate,
          densityMode: podcastDiscussion.densityMode ?? "quick",
        }),
      });

      const data = (await res.json()) as {
        audio?: PodcastDiscussionAudio;
        cached?: boolean;
        error?: string;
      };

      if (!res.ok || !data.audio) {
        throw new Error(data.error ?? "Podcast audio could not be generated.");
      }

      setPodcastAudio(data.audio);
      setPodcastCached(Boolean(data.cached));
    } catch (err) {
      setPodcastError(err instanceof Error ? err.message : "Podcast audio could not be generated.");
    } finally {
      setPodcastLoading(false);
      setPodcastRegenerating(false);
    }
  }

  if (podcastAudio) {
    return (
      <PodcastPlayer
        podcast={podcastDiscussion}
        audio={podcastAudio}
        cached={podcastCached}
        regenerating={podcastRegenerating}
        onRegenerate={() => void generatePodcastAudio(true)}
      />
    );
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-zinc-950/50 p-4">
      <p className="text-sm font-medium text-zinc-200">{podcastDiscussion.title}</p>
      <p className="mt-1 text-xs text-zinc-500">
        ~{podcastDiscussion.estimatedDurationMinutes} min · {podcastDiscussion.totalWordCount} words
      </p>
      <div className="mt-4 rounded-lg border border-white/[0.08] bg-zinc-950/50 p-3">
        <p className="text-xs text-zinc-300">
          This saved analysis includes the podcast script. Audio is generated on demand.
        </p>
        {podcastError ? (
          <p className="mt-2 rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-100">
            {podcastError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={podcastLoading}
          onClick={() => void generatePodcastAudio(false)}
          className="mt-3 inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          {podcastLoading ? "Generating audio..." : "Generate audio"}
        </button>
      </div>
    </section>
  );
}

export function SavedAnalysisWorkspace({
  analysisId,
  result,
  modeId,
  providerUsed,
  fallbackUsed,
  documentTypeGuess,
  sourceKind,
  sourceLabel,
  entitlementPlanId = "free",
  metadata,
  podcastDiscussion,
}: SavedAnalysisWorkspaceProps) {
  const isPaidActive = entitlementPlanId !== "free";
  const [experience, setExperience] = useState<"summary-learn" | "audio" | "podcast">("summary-learn");
  const modeLabel = getIntelligenceModeById(modeId)?.label ?? modeId;
  const sourceKindLabel =
    sourceKind === "youtube"
      ? "YouTube"
      : sourceKind === "presentation"
        ? "Presentation"
        : sourceKind === "url"
          ? "Article"
          : "Document";

  const sourceProfile = useMemo<PodcastSourceProfile>(
    () => ({
      sourceKind: mapSourceKind(sourceKind),
      estimatedPages: metadata?.estimatedPages ?? null,
      extractedCharacterCount: metadata?.extractedCharacterCount ?? null,
      youtubeDurationMinutes: metadata?.youtubeDurationMinutes ?? null,
      meaningfulAnalysisCandidateCount: countPodcastAnalysisCandidates(result),
    }),
    [metadata, result, sourceKind],
  );

  const mediaProps = {
    entitlementPlanId,
    isPaidActive,
    hasSource: true,
    hasAnalysis: true,
    sourceProfile,
    analysisId,
    analysisResult: result,
    sourceType: sourceKind,
    sourceLabel: sourceLabel ?? null,
    intelligenceMode: modeId,
    documentType: documentTypeGuess,
  };

  return (
    <LearningExperiencesResults
      initialExperience={experience}
      result={result}
      modeId={modeId}
      providerUsed={providerUsed}
      fallbackUsed={fallbackUsed}
      entitlementPlanId={entitlementPlanId}
      isPaidActive={isPaidActive}
      sourceType={sourceKind}
      sourceLabel={sourceLabel}
      modeLabel={modeLabel}
      sourceKindLabel={sourceKindLabel}
      savedAnalysisId={analysisId}
      extractedCharacters={metadata?.extractedCharacterCount ?? null}
      estimatedPages={metadata?.estimatedPages ?? null}
      slideCount={null}
      sourceQuality={null}
      sourceQualityNote={null}
      audioContent={<PodcastWorkspaceCtas {...mediaProps} view="audio" />}
      podcastContent={
        podcastDiscussion ? (
          <SavedPodcastPanel analysisId={analysisId} podcastDiscussion={podcastDiscussion} />
        ) : (
          <PodcastWorkspaceCtas {...mediaProps} view="podcast" />
        )
      }
      onTryAudio={() => setExperience("audio")}
      onTryPodcast={() => setExperience("podcast")}
    />
  );
}
