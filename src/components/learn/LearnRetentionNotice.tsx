"use client";

import { useMemo } from "react";
import {
  countNeedsReview,
  loadPracticeRetentionSummary,
} from "@/lib/learn/practiceRetentionStorage";

type LearnRetentionNoticeProps = {
  analysisId: string;
};

export function LearnRetentionNotice({ analysisId }: LearnRetentionNoticeProps) {
  const summary = useMemo(
    () => loadPracticeRetentionSummary(analysisId),
    [analysisId],
  );

  if (!summary || countNeedsReview(summary) === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/15 bg-amber-950/20 px-4 py-3 text-left">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/70">
        Needs review
      </p>
      <p className="mt-1 text-xs text-amber-100/85">
        {countNeedsReview(summary)} concept{countNeedsReview(summary) === 1 ? "" : "s"} from your last
        session — {summary.suggestedNextStep}
      </p>
      {summary.weakConcepts.length > 0 ? (
        <ul className="mt-2 space-y-1 text-[11px] text-amber-200/75">
          {summary.weakConcepts.slice(0, 3).map((concept) => (
            <li key={concept} className="truncate">
              · {concept}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
