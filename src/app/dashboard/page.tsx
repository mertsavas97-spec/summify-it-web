import type { Metadata } from "next";
import { DashboardAnalysesExplorer } from "@/components/dashboard/DashboardAnalysesExplorer";
import { DashboardSignedOut } from "@/components/dashboard/DashboardSignedOut";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getUserAnalyses } from "@/server/analyses/getUserAnalyses";
import { createPageMetadata } from "@/lib/metadata";
import { getMemoryStats } from "@/server/memory/getMemoryStats";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { MemoryDashboardPanel } from "@/components/memory/MemoryDashboardPanel";
import { DashboardUsagePanel } from "@/components/dashboard/DashboardUsagePanel";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import { ClaimGhostSessionOnAuth } from "@/components/auth/ClaimGhostSessionOnAuth";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description: "Your learning command center with sessions, reviews, and weekly progress.",
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

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN, profile);
  const planUsage = getUserPlanLimits(profile?.plan, limits);
  const memoryStats = await getMemoryStats(user.id, planUsage.dailyReviewTarget);

  const latestSession = analyses[0];
  const latestTitle = latestSession?.title ?? latestSession?.summary?.title ?? "Start your first learning session";
  const hasAudio = !!(latestSession?.metadata?.audioStudy || latestSession?.metadata?.podcastDiscussion);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <ClaimGhostSessionOnAuth />
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={limits?.daily_analysis_count ?? 0}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-100/80 via-white to-slate-100 p-5 sm:p-6 dark:border-white/[0.08] dark:from-violet-950/25 dark:via-zinc-900/50 dark:to-zinc-950/80">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="accent" className="mb-2">
                  Learning command center
                </Badge>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  Welcome back, {welcomeName(profile?.email ?? user.email)}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  Focus on what to learn next, what is due for review, and where your study momentum is heading.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href="/upload" size="sm">
                  New session
                </Button>
                <Button href="/account" size="sm" variant="secondary">
                  Account
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-violet-300/40 bg-violet-50 p-4 sm:p-5 dark:border-violet-400/20 dark:bg-violet-950/20">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/75">
                {hasAudio ? "Ready to Listen" : "Continue Learning"}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{latestTitle}</h2>
              {latestSession && (
                <div className="mt-4 flex items-center gap-3">
                  <Button href={`/dashboard/${latestSession.id}`} size="sm">
                    {hasAudio ? "Listen Now" : "Continue Learning"}
                  </Button>
                  {hasAudio && (
                    <span className="flex items-center gap-1.5 text-xs text-violet-300/80">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                      </span>
                      Audio lesson ready
                    </span>
                  )}
                </div>
              )}
            </div>
          </header>

          <MemoryDashboardPanel stats={memoryStats} dailyTarget={planUsage.dailyReviewTarget} />
          <DashboardUsagePanel usage={planUsage} />

          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Recent Learning Sessions</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Pick up where you left off or review past insights.
            </p>
            <DashboardAnalysesExplorer analyses={analyses} />
          </div>

          <section className="mt-10 rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-white/[0.06] dark:bg-zinc-950/40">
            <p className="text-sm font-medium text-slate-800 dark:text-zinc-300">Saved Library</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-600">
              Your full learning history stays searchable and filterable below.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
