"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MindMapSkeleton } from "@/components/mindmap/MindMapSkeleton";

const MindMapPanel = dynamic(
  () => import("@/components/mindmap/MindMapPanel").then((m) => m.MindMapPanel),
  { ssr: false, loading: () => <MindMapSkeleton /> },
);
import { AnalysisResultView } from "@/components/upload/AnalysisResultView";
import { LearnSection } from "@/components/upload/LearnSection";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";

type WorkspaceTab = "summary" | "learn" | "mindmap";

type SavedAnalysisWorkspaceProps = {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  providerUsed: string;
  fallbackUsed: boolean;
  documentTypeGuess?: string | null;
  sourceKind?: string | null;
  showProviderMeta?: boolean;
  entitlementPlanId?: PlanId;
};

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "learn", label: "Learn" },
  { id: "mindmap", label: "Mind Map" },
];

export function SavedAnalysisWorkspace({
  result,
  modeId,
  providerUsed,
  fallbackUsed,
  documentTypeGuess,
  sourceKind,
  showProviderMeta = true,
  entitlementPlanId = "free",
}: SavedAnalysisWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("summary");

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/60">
      <div className="border-b border-white/[0.06] px-2 pt-2 sm:px-3">
        <div
          className="flex gap-1 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Analysis views"
        >
          {TABS.map((t) => (
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
      </div>
    </div>
  );
}
