"use client";

import { pipelineStages } from "@/data/pipelineStages";
import type { PipelineStage, PipelineStageStatus } from "@/core/types";

type PipelineStagesProps = {
  activeStage: PipelineStage | null;
  previewOnly?: boolean;
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

export function PipelineStages({
  activeStage,
  previewOnly = true,
}: PipelineStagesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-400">
          Intelligence pipeline
        </p>
        {previewOnly && (
          <span className="rounded border border-amber-500/20 bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-400/90">
            Preview states · not live
          </span>
        )}
      </div>
      <ol className="flex flex-wrap gap-1.5">
        {pipelineStages.map((def, index) => {
          const status = stageStatus(def.stage, activeStage);
          return (
            <li key={def.stage} className="flex items-center gap-1.5">
              <span
                title={def.description}
                className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${statusStyles[status]}`}
              >
                {def.label}
              </span>
              {index < pipelineStages.length - 1 && (
                <span className="text-[10px] text-zinc-700" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
