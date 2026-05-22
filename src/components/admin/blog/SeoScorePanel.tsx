"use client";

import type { SeoScoreResult } from "@/lib/blog/seoScore";
import { Check, AlertTriangle, X } from "lucide-react";

type SeoScorePanelProps = {
  result: SeoScoreResult;
};

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <Check className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  return <X className="h-3.5 w-3.5 text-rose-400" />;
}

export function SeoScorePanel({ result }: SeoScorePanelProps) {
  const color =
    result.score >= 80
      ? "text-emerald-300"
      : result.score >= 70
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        SEO score
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>
        {result.score}
        <span className="text-base font-normal text-zinc-600">/100</span>
      </p>
      <ul className="mt-4 max-h-48 space-y-1.5 overflow-y-auto text-xs">
        {result.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-zinc-400">
            <StatusIcon status={check.status} />
            <span>
              {check.label}
              {check.detail ? (
                <span className="block text-[10px] text-zinc-600">{check.detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {result.publishWarnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/20 p-2 text-[11px] text-amber-200/90">
          {result.publishWarnings.map((w) => (
            <p key={w}>⚠ {w}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
