"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { analysisToMindMap } from "@/lib/mindmap/analysisToMindMap";
import type { MindMapGenerationInput } from "@/types/mindmap";
import { MindMapSkeleton } from "./MindMapSkeleton";

const MindMapCanvas = dynamic(
  () => import("./MindMapCanvas").then((m) => m.MindMapCanvas),
  { ssr: false, loading: () => <MindMapSkeleton /> },
);

type MindMapPanelProps = MindMapGenerationInput & {
  /** When false, skip graph build (tab not active). */
  active?: boolean;
};

export function MindMapPanel({
  active = true,
  title,
  summary,
  keyInsights,
  risksOrWarnings,
  actionItems,
  learnCards,
  documentTypeGuess,
  sourceKind,
}: MindMapPanelProps) {
  const result = useMemo(() => {
    if (!active) return null;
    return analysisToMindMap({
      title,
      summary,
      keyInsights,
      risksOrWarnings,
      actionItems,
      learnCards,
      documentTypeGuess,
      sourceKind,
    });
  }, [
    active,
    title,
    summary,
    keyInsights,
    risksOrWarnings,
    actionItems,
    learnCards,
    documentTypeGuess,
    sourceKind,
  ]);

  if (!active) {
    return (
      <p className="py-12 text-center text-sm text-zinc-600">
        Open the Mind Map tab to generate your visual intelligence graph.
      </p>
    );
  }

  if (!result) {
    return <MindMapSkeleton />;
  }

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-zinc-950/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-zinc-400">Mind map unavailable for this analysis.</p>
        <p className="mt-2 text-xs text-zinc-600">
          We could not derive enough concepts to build a graph. Try re-running with richer source
          material.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-mindmap-panel>
      <p className="text-[11px] text-zinc-600">
        Pan, zoom, and drag nodes. Click a node to focus. Profile:{" "}
        <span className="text-zinc-500">{result.graph.profile}</span>
      </p>
      <div className="overflow-hidden rounded-xl border border-violet-500/10 bg-[#08090d]">
        <MindMapCanvas graph={result.graph} />
      </div>
      <p className="text-[10px] text-zinc-700">
        PNG, SVG, and PDF export — coming soon.
      </p>
    </div>
  );
}
