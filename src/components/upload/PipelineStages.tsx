"use client";

import { pipelineStages } from "@/data/pipelineStages";
import type { PipelineStage, PipelineStageStatus } from "@/core/types";

type PipelineStagesProps = {
  activeStage: PipelineStage | null;
};

function stageStatus(
  stage: PipelineStage,
  activeStage: PipelineStage | null,
): PipelineStageStatus {
  if (!activeStage) return "pending";

  const order = pipelineStages.map((s) => s.stage);
  const activeIndex = order.indexOf(activeStage);
  const stageIndex = order.indexOf(stage);

  if (stageIndex < activeIndex) return "complete";
  if (stageIndex === activeIndex) return "active";
  return "pending";
}

const statusStyles: Record<PipelineStageStatus, string> = {
  pending: "border-white/[0.05] bg-white/[0.02] text-zinc-600",
  active: "border-violet-500/35 bg-violet-500/10 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.12)]",
  complete: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400/80",
  skipped: "border-white/[0.04] bg-transparent text-zinc-700",
};

export function PipelineStages({ activeStage }: PipelineStagesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-400">Pipeline</p>
        <p className="text-[11px] text-zinc-500 sm:hidden">Extract → Clean → Profile → Analyze → Learn</p>
      </div>
      <ol className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-2">
        {pipelineStages.map((def) => {
          const status = stageStatus(def.stage, activeStage);
          return (
            <li key={def.stage} className="min-w-0">
              <span
                title={def.description}
                className={`flex h-8 w-full min-w-0 items-center justify-center rounded-lg border px-2 text-[10px] font-medium leading-none transition-colors ${statusStyles[status]}`}
              >
                {def.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
