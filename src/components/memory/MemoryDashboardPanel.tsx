import { Brain, Flame, Gauge, RotateCcw, Target } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { ReviewStats } from "@/types/memory";

type MemoryDashboardPanelProps = {
  stats: ReviewStats;
  dailyTarget: number;
};

export function MemoryDashboardPanel({ stats, dailyTarget }: MemoryDashboardPanelProps) {
  const retention = stats.retentionEstimate > 0 ? `${stats.retentionEstimate}%` : "New";
  const goal = stats.retention.dailyGoals[0];
  const goalPct = goal ? Math.round((goal.completed / Math.max(1, goal.target)) * 100) : 0;
  const weeklyMax = Math.max(1, ...stats.retention.weeklyActivity.map((day) => day.reviewed));

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Memory layer
          </p>
          <h2 className="mt-1 text-base font-semibold text-white">Continue reviewing</h2>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-zinc-500">
            Private spaced repetition from your saved analyses. No public share pages include review data.
          </p>
          {stats.retention.comebackPrompt ? (
            <p className="mt-2 max-w-lg text-xs font-medium text-violet-200">
              {stats.retention.comebackPrompt.title}:{" "}
              <span className="font-normal text-zinc-500">{stats.retention.comebackPrompt.body}</span>
            </p>
          ) : null}
        </div>
        <Button href="/dashboard/memory" size="sm">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Review now
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MemoryMetric
          icon={<Brain className="h-4 w-4" aria-hidden />}
          label="Due today"
          value={stats.dueToday}
          hint={`${stats.overdue} ready now`}
        />
        <MemoryMetric
          icon={<Flame className="h-4 w-4" aria-hidden />}
          label="Review streak"
          value={stats.reviewStreak}
          hint={stats.reviewStreak === 1 ? "day" : "days"}
        />
        <MemoryMetric
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          label="Mastery"
          value={`${stats.retention.mastery.score}%`}
          hint={`${stats.retention.mastery.consistencyComponent}% consistency`}
        />
        <MemoryMetric
          icon={<RotateCcw className="h-4 w-4" aria-hidden />}
          label="Retention"
          value={retention}
          hint={`${stats.cardsReviewed}/${dailyTarget} daily target`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <Target className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              Daily goal
            </p>
            <p className="text-[11px] tabular-nums text-zinc-500">{goalPct}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-violet-400" style={{ width: `${Math.min(100, goalPct)}%` }} />
          </div>
          <div className="mt-3 space-y-1.5">
            {stats.retention.dailyGoals.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-[11px]">
                <span className={item.complete ? "text-zinc-300" : "text-zinc-500"}>{item.label}</span>
                <span className="tabular-nums text-zinc-600">
                  {item.completed}/{item.target}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-zinc-300">Weekly activity</p>
            <p className="text-[11px] text-zinc-600">
              {stats.retention.velocity.sevenDayAverage} cards/day · {stats.retention.velocity.trend}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-7 items-end gap-2">
            {stats.retention.weeklyActivity.map((day) => (
              <div key={day.date} className="text-center">
                <div className="flex h-16 items-end rounded-md bg-white/[0.025] px-1">
                  <div
                    className={`w-full rounded-sm ${day.goalComplete ? "bg-emerald-400/80" : "bg-violet-400/70"}`}
                    style={{ height: `${Math.max(8, (day.reviewed / weeklyMax) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">{day.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.difficultConcepts.length > 0 ? (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="text-xs font-medium text-zinc-300">Difficult concepts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.difficultConcepts.map((concept) => (
              <span
                key={concept.id}
                className="rounded-lg border border-amber-500/15 bg-amber-950/20 px-2.5 py-1 text-[11px] text-amber-200/85"
              >
                {concept.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MemoryMetric({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-violet-300/80">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}
