import Link from "next/link";
import { learnDashboardHref } from "@/lib/learn/paths";
import type { PracticeAnalysisSummary } from "@/server/learn/getPracticeAnalysesSummary";

type LearnOverviewPanelProps = {
  practiceSets: PracticeAnalysisSummary[];
};

export function LearnOverviewPanel({ practiceSets }: LearnOverviewPanelProps) {
  if (practiceSets.length === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-5">
        <h2 className="text-sm font-semibold text-white">Recent practice sets</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Open a saved analysis and create a practice set, or use{" "}
          <span className="text-zinc-400">Practice this analysis</span> after your next upload.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex text-xs font-medium text-violet-400/90 hover:text-violet-300"
        >
          Browse saved analyses →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-5">
      <h2 className="text-sm font-semibold text-white">Recent practice sets</h2>
      <p className="mt-1 text-xs text-zinc-500">Continue practicing a specific analysis.</p>
      <ul className="mt-4 divide-y divide-white/[0.05]">
        {practiceSets.map((item) => (
          <li key={item.analysisId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{item.title}</p>
              {item.sourceLabel ? (
                <p className="mt-0.5 truncate text-[10px] text-zinc-600">{item.sourceLabel}</p>
              ) : null}
              <p className="mt-1 text-[10px] text-zinc-600">
                {item.cardCount} cards · {item.dueCount} due
              </p>
            </div>
            <Link
              href={learnDashboardHref(item.analysisId)}
              className="shrink-0 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-200 transition-colors hover:bg-violet-500/15"
            >
              Practice
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
