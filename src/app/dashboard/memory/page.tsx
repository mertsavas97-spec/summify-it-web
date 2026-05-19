import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MemoryReviewClient } from "@/components/memory/MemoryReviewClient";
import { Badge } from "@/components/ui/Badge";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getDueReviewItems } from "@/server/memory/getDueReviewItems";
import { getMemoryStats } from "@/server/memory/getMemoryStats";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";

export const metadata: Metadata = createPageMetadata({
  title: "Memory review",
  description: "Review private spaced repetition cards from your saved Summify analyses.",
  path: "/dashboard/memory",
  noIndex: true,
});

export default async function MemoryPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not_configured&next=/dashboard/memory");
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect("/login?next=/dashboard/memory");
  }

  await ensureProfileForUser();

  const [profile, limits, savedCount, dueItems] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
    getDueReviewItems(user.id),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN);
  const planUsage = getUserPlanLimits(profile?.plan, limits);
  const stats = await getMemoryStats(user.id, planUsage.dailyReviewTarget);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={limits?.daily_analysis_count ?? 0}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <main className="mx-auto max-w-4xl">
          <Link
            href="/dashboard"
            className="inline-flex text-xs text-zinc-500 transition-colors hover:text-violet-300"
          >
            ← Back to dashboard
          </Link>

          <header className="mt-5 mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-5 sm:p-6">
            <Badge variant="accent">Private memory</Badge>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Spaced repetition</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                  Review cards generated from saved analyses, Learn cards, and key insights.
                  Reminder hooks are prepared for later email and digest infrastructure.
                </p>
                {stats.retention.comebackPrompt ? (
                  <p className="mt-3 max-w-2xl rounded-lg border border-violet-500/15 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                    {stats.retention.comebackPrompt.title}{" "}
                    <span className="text-violet-200/70">{stats.retention.comebackPrompt.body}</span>
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Due" value={stats.dueToday} />
                <MiniStat label="Streak" value={stats.reviewStreak} />
                <MiniStat label="Mastery" value={stats.retention.mastery.score} suffix="%" />
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-7">
              {stats.retention.weeklyActivity.map((day) => (
                <div
                  key={day.date}
                  className={`rounded-lg border px-2 py-2 text-center ${
                    day.goalComplete
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : day.reviewed > 0
                        ? "border-violet-400/20 bg-violet-400/10"
                        : "border-white/[0.06] bg-white/[0.025]"
                  }`}
                >
                  <p className="text-[10px] text-zinc-600">{day.label}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-white">{day.reviewed}</p>
                </div>
              ))}
            </div>
          </header>

          <MemoryReviewClient
            initialItems={dueItems}
            stats={stats}
            dailyTarget={planUsage.dailyReviewTarget}
          />
        </main>
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="min-w-16 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums text-white">
        {value}
        {suffix}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
    </div>
  );
}
