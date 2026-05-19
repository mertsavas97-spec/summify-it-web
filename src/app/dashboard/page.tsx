import type { Metadata } from "next";
import { DashboardAnalysesExplorer } from "@/components/dashboard/DashboardAnalysesExplorer";
import { DashboardSignedOut } from "@/components/dashboard/DashboardSignedOut";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { DashboardUsagePanel } from "@/components/dashboard/DashboardUsagePanel";
import { MemoryDashboardPanel } from "@/components/memory/MemoryDashboardPanel";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getUserAnalyses } from "@/server/analyses/getUserAnalyses";
import { getMemoryStats } from "@/server/memory/getMemoryStats";
import { createPageMetadata } from "@/lib/metadata";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description: "Your saved Summify analyses and workspace history.",
  path: "/dashboard",
  noIndex: true,
});

function welcomeName(email: string | null | undefined): string {
  if (!email) return "there";
  const local = email.split("@")[0]?.trim();
  if (!local) return "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function DashboardPage() {
  const user = await getOptionalUser();

  if (!user) {
    return <DashboardSignedOut />;
  }

  await ensureProfileForUser();

  const [profile, limits, savedCount, analyses] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
    getUserAnalyses(user.id, 48),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN);
  const daily = limits?.daily_analysis_count ?? 0;
  const monthly = limits?.monthly_analysis_count ?? 0;
  const planUsage = getUserPlanLimits(profile?.plan, limits);
  const memoryStats = await getMemoryStats(user.id, planUsage.dailyReviewTarget);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={daily}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/25 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="accent" className="mb-2">
                  Public beta workspace
                </Badge>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Welcome back, {welcomeName(profile?.email ?? user.email)}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
                  Your saved intelligence sessions live here. Reopen summaries, Learn cards, and
                  metadata anytime — no raw files stored.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href="/upload" size="sm">
                  New summary
                </Button>
                <Button href="/account" size="sm" variant="secondary">
                  Account
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DashboardStatCard label="Saved" value={savedCount} hint="In your library" />
              <DashboardStatCard label="Today" value={daily} hint="Analyses run" />
              <DashboardStatCard label="This month" value={monthly} hint="Running total" />
              <DashboardStatCard label="Plan" value={planLabel} />
            </div>
          </header>

          <DashboardUsagePanel usage={planUsage} />
          <MemoryDashboardPanel stats={memoryStats} dailyTarget={planUsage.dailyReviewTarget} />

          <div className="mt-10">
            <h2 className="text-sm font-semibold text-zinc-200">Recent analyses</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Search and filter your saved sessions. Only you can access these results.
            </p>
            <DashboardAnalysesExplorer analyses={analyses} />
          </div>

          <section className="mt-10 rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-3.5">
            <p className="text-sm font-medium text-zinc-400">Collections</p>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              Coming soon — group analyses by course, client, or project.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
