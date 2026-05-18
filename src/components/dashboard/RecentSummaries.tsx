import { recentSummaries } from "@/data/dashboard";
import { Card } from "@/components/ui/Card";

export function RecentSummaries() {
  return (
    <Card compact>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Recent summaries</h2>
        <span className="text-[10px] text-zinc-600">{recentSummaries.length} items</span>
      </div>
      <ul className="mt-3 divide-y divide-white/[0.05]">
        {recentSummaries.map((summary) => (
          <li
            key={summary.id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">
                {summary.title}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                {summary.template} · {summary.pages} pg
              </p>
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
              {summary.date}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
