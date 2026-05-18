"use client";

import { useEffect, useState } from "react";
import {
  getLoadingStages,
  LOADING_STAGE_INTERVAL_MS,
  type LoadingStageGroup,
} from "@/lib/loading-stages";

type IntelligenceLoadingStagesProps = {
  active: boolean;
  group?: LoadingStageGroup;
  /** Override default stage labels (e.g. YouTube pipeline). */
  stages?: readonly string[];
  className?: string;
};

export function IntelligenceLoadingStages({
  active,
  group = "analyze",
  stages: stagesOverride,
  className = "",
}: IntelligenceLoadingStagesProps) {
  const stages = stagesOverride ?? getLoadingStages(group);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, stages.length - 1));
    }, LOADING_STAGE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [active, stages.length]);

  if (!active) return null;

  const currentLabel = stages[index];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border border-violet-500/20 bg-violet-950/25 px-3 py-2.5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/40 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-violet-200 transition-opacity duration-300">
            {currentLabel}
          </p>
          <ul className="mt-1.5 flex gap-1">
            {stages.map((stage, i) => (
              <li
                key={stage}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= index ? "bg-violet-400/70" : "bg-zinc-700"
                }`}
                aria-hidden
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
