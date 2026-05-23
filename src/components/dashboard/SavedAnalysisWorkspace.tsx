"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MindMapSkeleton } from "@/components/mindmap/MindMapSkeleton";
import { PodcastPlayer } from "@/components/podcast/PodcastPlayer";

const MindMapPanel = dynamic(
  () => import("@/components/mindmap/MindMapPanel").then((m) => m.MindMapPanel),
  { ssr: false, loading: () => <MindMapSkeleton /> },
);
import { AnalysisResultView } from "@/components/upload/AnalysisResultView";
import { LearnSection } from "@/components/upload/LearnSection";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionMetadata,
} from "@/lib/podcast/podcast-types";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";

type WorkspaceTab = "summary" | "learn" | "mindmap" | "podcast";

type SavedAnalysisWorkspaceProps = {
  analysisId: string;
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
  documentTypeGuess?: string | null;
  sourceKind?: string | null;
  showProviderMeta?: boolean;
  entitlementPlanId?: PlanId;
  podcastDiscussion?: PodcastDiscussionMetadata;
};

export function SavedAnalysisWorkspace({
  analysisId,
  result,
  modeId,
  providerUsed,
  fallbackUsed,
  documentTypeGuess,
  sourceKind,
  showProviderMeta = true,
  entitlementPlanId = "free",
  podcastDiscussion,
}: SavedAnalysisWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("summary");
  const [podcastAudio, setPodcastAudio] = useState<PodcastDiscussionAudio | null>(null);
  const [podcastCached, setPodcastCached] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastRegenerating, setPodcastRegenerating] = useState(false);
  const [podcastError, setPodcastError] = useState<string | null>(null);

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "learn", label: "Learn" },
    { id: "mindmap", label: "Mind Map" },
    ...(podcastDiscussion ? [{ id: "podcast" as const, label: "Podcast" }] : []),
  ];

  async function generatePodcastAudio(regenerate = false) {
    if (!podcastDiscussion) return;

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
          densityMode: podcastDiscussion.densityMode,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        audio?: PodcastDiscussionAudio;
        cached?: boolean;
      };

      if (!res.ok || !data.success || !data.audio) {
        throw new Error(data.error ?? "Could not generate podcast audio.");
      }

      setPodcastAudio(data.audio);
      setPodcastCached(Boolean(data.cached));
    } catch (error) {
      setPodcastError(error instanceof Error ? error.message : "Could not generate podcast audio.");
    } finally {
      setPodcastLoading(false);
      setPodcastRegenerating(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/60">
      <div className="border-b border-white/[0.06] px-2 pt-2 sm:px-3">
        <div
          className="flex gap-1 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Analysis views"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-violet-500/15 text-violet-200"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5" role="tabpanel">
        {tab === "summary" && (
          <AnalysisResultView
            result={result}
            modeId={modeId}
            providerUsed={providerUsed}
            fallbackUsed={fallbackUsed}
            sections="summary"
            showToolbar={false}
            showHeader={showProviderMeta}
          />
        )}

        {tab === "learn" && (
          result.learnCards.length > 0 ? (
            <LearnSection
              cards={result.learnCards}
              modeId={modeId}
              entitlementPlanId={entitlementPlanId}
            />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-600">
              No Learn cards for this session.
            </p>
          )
        )}

        {tab === "mindmap" ? (
          <MindMapPanel
            active
            title={result.title}
            summary={result.summary}
            keyInsights={result.keyInsights}
            risksOrWarnings={result.risksOrWarnings}
            actionItems={result.actionItems}
            learnCards={result.learnCards}
            documentTypeGuess={documentTypeGuess}
            sourceKind={sourceKind}
          />
        ) : null}

        {tab === "podcast" && podcastDiscussion ? (
          podcastAudio ? (
            <PodcastPlayer
              podcast={podcastDiscussion}
              audio={podcastAudio}
              cached={podcastCached}
              regenerating={podcastRegenerating}
              onRegenerate={() => void generatePodcastAudio(true)}
            />
          ) : (
            <section className="rounded-xl border border-violet-400/20 bg-violet-950/10 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/80">
                Podcast discussion
              </p>
              <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">
                {podcastDiscussion.title}
              </h3>
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
                  {podcastLoading ? "Generating audio..." : "Generate Audio"}
                </button>
              </div>

              <details className="mt-4 rounded-lg border border-white/[0.07] bg-zinc-950/55 px-3 py-2.5">
                <summary className="cursor-pointer text-xs font-medium text-zinc-200">
                  Show script
                </summary>
                <div className="mt-3 space-y-2">
                  {podcastDiscussion.script.map((turn, index) => (
                    <div key={`${turn.speaker}:${index}`} className="rounded-md bg-white/[0.025] px-2.5 py-2">
                      <p className="text-[10px] font-semibold uppercase text-violet-200/75">
                        {turn.speaker === "host" ? "Host" : "Expert"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{turn.text}</p>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )
        ) : null}
      </div>
    </div>
  );
}
