import Link from "next/link";
import type { UserPlanLimits } from "@/lib/plan-limits";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type DashboardUsagePanelProps = {
  usage: UserPlanLimits;
};

export function DashboardUsagePanel({ usage }: DashboardUsagePanelProps) {
  const remainingLabel =
    usage.remainingToday == null ? "Unlimited" : String(usage.remainingToday);

  const showUpgrade =
    !usage.isBeta &&
    usage.enforceLimits &&
    usage.remainingToday != null &&
    usage.remainingToday <= 2;

  return (
    <section className="mt-6 rounded-xl border border-white/[0.08] bg-zinc-950/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Usage today
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-white">
              {remainingLabel}
            </span>
            <span className="text-sm text-zinc-500">
              {usage.analysesPerDay == null
                ? "analyses (fair use)"
                : `of ${usage.analysesPerDay} remaining`}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            {usage.dailyAnalysisCount} completed today · {usage.planName}
            {usage.isBeta ? " — full access during beta" : ""}
          </p>
        </div>
        {usage.isBeta ? (
          <Badge variant="accent">Beta</Badge>
        ) : (
          <Badge variant="muted">{usage.planName}</Badge>
        )}
      </div>

      {showUpgrade && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-500/15 bg-violet-950/20 px-3 py-2.5">
          <p className="text-xs text-violet-200/90">
            Need more analyses? Upgrade options are coming soon with larger limits and more modes.
          </p>
          <Button href="/pricing" size="sm" variant="secondary">
            Upgrade options coming soon
          </Button>
        </div>
      )}

      {!usage.isBeta && usage.analysesPerDay != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
            style={{
              width: `${Math.min(
                100,
                (usage.dailyAnalysisCount / usage.analysesPerDay) * 100,
              )}%`,
            }}
          />
        </div>
      )}

      <p className="mt-3 text-[10px] text-zinc-600">
        Free includes 3 analyses per day, 10MB uploads, 5 modes, 5 Learn cards, and your last 3 saved analyses.{" "}
        <Link href="/account" className="text-violet-400/70 hover:text-violet-300">
          Account
        </Link>
      </p>
    </section>
  );
}
