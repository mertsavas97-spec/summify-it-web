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
  pending: "border-white/[0.06] bg-zinc-950/40 text-zinc-600",
  active: "border-violet-500/40 bg-violet-950/30 text-violet-200",
  complete: "border-emerald-500/25 bg-emerald-950/20 text-emerald-400/90",
  skipped: "border-white/[0.04] bg-transparent text-zinc-700",
};

export function PipelineStages({ activeStage }: PipelineStagesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-400">Intelligence pipeline</p>
        <p className="text-[11px] text-zinc-500 sm:hidden">Extract → Clean → Profile → Analyze → Learn</p>
      </div>
      <ol className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-2">
        {pipelineStages.map((def, index) => {
          const status = stageStatus(def.stage, activeStage);
          return (
            <li key={def.stage} className="min-w-0">
              <span
                title={def.description}
                className={`flex h-8 w-full min-w-0 items-center justify-center rounded-md border px-2 text-[10px] font-medium leading-none transition-colors ${statusStyles[status]}`}
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
