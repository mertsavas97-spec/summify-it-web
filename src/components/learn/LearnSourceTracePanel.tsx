"use client";

import { useState } from "react";
import type { LearnSourceTrace } from "@/types/adaptive-learn";

type LearnSourceTracePanelProps = {
  trace?: LearnSourceTrace;
  className?: string;
};

function confidenceLabel(confidence?: LearnSourceTrace["confidence"]): string | null {
  if (confidence === "high") return "Likely source";
  if (confidence === "medium") return "From this analysis";
  if (confidence === "low") return "Possible source";
  return null;
}

export function LearnSourceTracePanel({ trace, className = "" }: LearnSourceTracePanelProps) {
  const [open, setOpen] = useState(false);

  if (!trace?.excerpt && !trace?.sectionTitle) return null;

  const label = confidenceLabel(trace.confidence);
  const locationParts: string[] = [];
  if (trace.pageNumber != null) locationParts.push(`Page ${trace.pageNumber}`);
  if (trace.timestampStart) {
    locationParts.push(
      trace.timestampEnd && trace.timestampEnd !== trace.timestampStart
        ? `${trace.timestampStart}–${trace.timestampEnd}`
        : trace.timestampStart,
    );
  }

  return (
    <div className={`mt-2 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-medium text-zinc-500 transition-colors hover:text-violet-300/90"
        aria-expanded={open}
      >
        {open ? "Hide source" : "View source"}
      </button>
      {open ? (
        <div className="mt-1.5 rounded-md border border-white/[0.06] bg-zinc-950/50 px-2.5 py-2">
          {label ? (
            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">{label}</p>
          ) : null}
          {trace.sectionTitle ? (
            <p className="mt-1 text-[11px] font-medium text-zinc-400">
              From: {trace.sectionTitle}
            </p>
          ) : null}
          {trace.excerpt ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              <span className="text-zinc-600">Source excerpt · </span>
              {trace.excerpt}
            </p>
          ) : (
            <p className="mt-1 text-[11px] italic text-zinc-600">
              No matching excerpt in the saved analysis text.
            </p>
          )}
          {locationParts.length > 0 ? (
            <p className="mt-1.5 text-[10px] tabular-nums text-zinc-600">{locationParts.join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
