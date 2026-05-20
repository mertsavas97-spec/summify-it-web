"use client";

import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";

type PracticeCompletionRetentionProps = {
  summary: PracticeRetentionSummary;
};

export function PracticeCompletionRetention({ summary }: PracticeCompletionRetentionProps) {
  return (
    <div className="mx-auto mt-5 max-w-md space-y-4 text-left">
      <p className="text-center text-xs leading-relaxed text-zinc-500">{summary.suggestedNextStep}</p>

      {summary.strongConcepts.length > 0 ? (
        <RetentionGroup title="Strong concepts" tone="emerald">
          {summary.strongConcepts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </RetentionGroup>
      ) : null}

      {summary.weakConcepts.length > 0 ? (
        <RetentionGroup title="Needs review" tone="amber">
          {summary.weakConcepts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </RetentionGroup>
      ) : null}

      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-600 sm:grid-cols-4">
        <MiniStat label="Strong" value={summary.strongCount} />
        <MiniStat label="Developing" value={summary.developingCount} />
        <MiniStat label="Stable" value={summary.stableCount} />
        <MiniStat label="Weak" value={summary.weakCount} />
      </div>

      {summary.hardestRetrievalType ? (
        <p className="text-center text-[10px] text-zinc-600">
          Hardest area: <span className="text-zinc-400">{summary.hardestRetrievalType}</span>
        </p>
      ) : null}
    </div>
  );
}

function RetentionGroup({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "emerald" | "amber";
  children: React.ReactNode;
}) {
  const border = tone === "emerald" ? "border-emerald-500/15" : "border-amber-500/15";
  const label = tone === "emerald" ? "text-emerald-300/80" : "text-amber-300/80";
  const text = tone === "emerald" ? "text-emerald-100/85" : "text-amber-100/85";

  return (
    <div className={`rounded-lg border ${border} bg-zinc-950/40 px-3 py-2.5`}>
      <p className={`text-[10px] font-medium uppercase tracking-wider ${label}`}>{title}</p>
      <ul className={`mt-1.5 space-y-1 text-xs leading-snug ${text}`}>{children}</ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center">
      <p className="font-semibold tabular-nums text-zinc-300">{value}</p>
      <p className="uppercase tracking-wider">{label}</p>
    </div>
  );
}
