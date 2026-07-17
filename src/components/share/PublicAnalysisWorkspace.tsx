"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MindMapSkeleton } from "@/components/mindmap/MindMapSkeleton";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { LearnCardItem } from "@/components/upload/LearnCardItem";
import type { MindMapGenerationInput } from "@/types/mindmap";
import type { AnalysisResult, LearnCardOutput } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import { getModeResultSectionLabels } from "@/lib/mode-result-presentation";

const MindMapPanel = dynamic(
  () => import("@/components/mindmap/MindMapPanel").then((m) => m.MindMapPanel),
  { ssr: false, loading: () => <MindMapSkeleton /> },
);

type Tab = "summary" | "learn" | "mindmap";

type PublicAnalysisWorkspaceProps = {
  result: AnalysisResult;
  mindMapInput: MindMapGenerationInput;
  modeId?: IntelligenceModeId | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "learn", label: "Learn" },
  { id: "mindmap", label: "Mind Map" },
];

export function PublicAnalysisWorkspace({
  result,
  mindMapInput,
  modeId,
}: PublicAnalysisWorkspaceProps) {
  const [tab, setTab] = useState<Tab>("summary");
  const labels = modeId
    ? getModeResultSectionLabels(modeId)
    : {
        summary: "Summary",
        keyInsights: "Key insights",
        risks: "Risks & warnings",
        actions: "Action items",
      };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/60">
      <div className="border-b border-white/[0.06] px-2 pt-2 sm:px-3">
        <div className="flex gap-1 overflow-x-auto pb-2" role="tablist">
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
          <div className="divide-y divide-white/[0.04]">
            <CollapsibleSection title={labels.summary} defaultOpen>
              <p className="max-w-prose text-sm leading-[1.7] text-zinc-300">{result.summary}</p>
            </CollapsibleSection>
            <CollapsibleSection title={labels.keyInsights} count={result.keyInsights.length} defaultOpen>
              <InsightList items={result.keyInsights} />
            </CollapsibleSection>
            {result.risksOrWarnings.length > 0 ? (
              <CollapsibleSection title={labels.risks} count={result.risksOrWarnings.length}>
                <InsightList items={result.risksOrWarnings} />
              </CollapsibleSection>
            ) : null}
            {result.actionItems.length > 0 ? (
              <CollapsibleSection title={labels.actions} count={result.actionItems.length}>
                <InsightList items={result.actionItems} />
              </CollapsibleSection>
            ) : null}
          </div>
        )}

        {tab === "learn" &&
          (result.learnCards.length > 0 ? (
            <ul className="space-y-3">
              {result.learnCards.map((card: LearnCardOutput, index) => (
                <li key={`${card.type}-${card.title}-${index}`}>
                  <LearnCardItem card={card} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-600">No Learn cards in this share.</p>
          ))}

        {tab === "mindmap" ? <MindMapPanel active {...mindMapInput} /> : null}
      </div>
    </div>
  );
}

function InsightList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-prose space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
