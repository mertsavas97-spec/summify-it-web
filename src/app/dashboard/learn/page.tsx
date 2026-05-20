import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LearnEntitlementNotice } from "@/components/learn/LearnEntitlementNotice";
import { LearnOverviewPanel } from "@/components/learn/LearnOverviewPanel";
import { AnalysisPracticeSession } from "@/components/learn/AnalysisPracticeSession";
import { LearnMultiFormatPanel } from "@/components/learn/LearnMultiFormatPanel";
import { LearnRetentionNotice } from "@/components/learn/LearnRetentionNotice";
import { buildMultiFormatLearnForSavedAnalysis } from "@/server/learn/multiFormatLearning";
import { MemoryReviewClient } from "@/components/memory/MemoryReviewClient";
import {
  enrichReviewItemsAsPracticeCards,
  sortPracticeSessionCards,
} from "@/lib/learn/practiceSessionTypes";
import { getIntelligenceModeLabel, getSourceKindLabel } from "@/lib/saved-analysis-labels";
import { Badge } from "@/components/ui/Badge";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { learnLoginNext } from "@/lib/learn/paths";
import { getUserPlanLimits } from "@/lib/plan-limits";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { getPracticeAnalysesSummary } from "@/server/learn/getPracticeAnalysesSummary";
import { getDueReviewItems } from "@/server/memory/getDueReviewItems";
import { getReviewItemsForAnalysis } from "@/server/memory/getReviewItemsForAnalysis";
import { getMemoryStats } from "@/server/memory/getMemoryStats";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";

export const metadata: Metadata = createPageMetadata({
  title: "Learn",
  description: "Practice and review insights from your saved Summify analyses.",
  path: "/dashboard/learn",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ analysisId?: string; start?: string }>;
};

export default async function LearnPage({ searchParams }: PageProps) {
  const { analysisId, start } = await searchParams;
  const autoStartPractice = start === "1" || start === "true";
  const loginNext = learnLoginNext(analysisId);

  if (!isSupabaseConfigured()) {
    redirect(`/login?error=not_configured&next=${encodeURIComponent(loginNext)}`);
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }

  await ensureProfileForUser();

  const [profile, limits, savedCount] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN, profile);
  const planUsage = getUserPlanLimits(profile?.plan, limits);

  if (!planUsage.memoryEnabled) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DashboardSidebar
          savedCount={savedCount}
          dailyCount={limits?.daily_analysis_count ?? 0}
          planLabel={planLabel}
        />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <main className="mx-auto max-w-4xl">
            <LearnEntitlementNotice planLabel={planLabel} />
          </main>
        </div>
      </div>
    );
  }

  const stats = await getMemoryStats(user.id, planUsage.dailyReviewTarget);

  if (analysisId) {
    const saved = await getAnalysisById(analysisId, user.id);
    if (!saved) {
      return (
        <LearnShell savedCount={savedCount} dailyCount={limits?.daily_analysis_count ?? 0} planLabel={planLabel}>
          <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 text-center">
            <p className="text-sm font-medium text-zinc-200">Analysis not found.</p>
            <p className="mx-auto mt-2 max-w-md text-xs text-zinc-500">
              This practice link may be outdated or the analysis was removed from your workspace.
            </p>
            <Link
              href="/dashboard/learn"
              className="mt-5 inline-flex rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-violet-300 hover:bg-white/[0.04]"
            >
              Open Learn dashboard
            </Link>
          </section>
        </LearnShell>
      );
    }

    const practiceItems = await getReviewItemsForAnalysis(user.id, analysisId);

    const displayTitle = saved.title ?? saved.summary?.title ?? "Untitled analysis";
    const hasLearnCards = (saved.learn_cards?.length ?? 0) > 0;
    const learnCards = saved.learn_cards ?? [];
    const practiceCards = sortPracticeSessionCards(
      enrichReviewItemsAsPracticeCards(practiceItems, learnCards),
    );

    const multiFormatLearn =
      saved.metadata?.multiFormatLearn ??
      (hasLearnCards
        ? buildMultiFormatLearnForSavedAnalysis({
            intelligence_mode: saved.intelligence_mode,
            document_type: saved.document_type,
            summary: saved.summary,
            learn_cards: learnCards,
            metadata: saved.metadata,
          })
        : null);

    return (
      <LearnShell savedCount={savedCount} dailyCount={limits?.daily_analysis_count ?? 0} planLabel={planLabel}>
        <div className="mt-5" id="practice">
          <LearnRetentionNotice analysisId={analysisId} />
          <AnalysisPracticeSession
            analysisId={analysisId}
            documentTitle={displayTitle}
            sourceLabel={saved.source_label}
            modeLabel={getIntelligenceModeLabel(saved.intelligence_mode)}
            sourceKindLabel={getSourceKindLabel(saved.source_kind)}
            cards={practiceCards}
            hasLearnCards={hasLearnCards}
            autoStart={autoStartPractice && practiceCards.length > 0}
          />
          {multiFormatLearn ? (
            <LearnMultiFormatPanel analysisId={analysisId} multiFormat={multiFormatLearn} />
          ) : null}
        </div>
      </LearnShell>
    );
  }

  const [dueItems, practiceSets] = await Promise.all([
    getDueReviewItems(user.id),
    getPracticeAnalysesSummary(user.id),
  ]);

  return (
    <LearnShell savedCount={savedCount} dailyCount={limits?.daily_analysis_count ?? 0} planLabel={planLabel}>
      <header className="mt-5 mb-6 rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-5 sm:p-6">
        <Badge variant="accent">Learn</Badge>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Learn</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Practice and review insights from your analyses.
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

      <div className="mb-6">
        <LearnOverviewPanel practiceSets={practiceSets} />
      </div>

      <MemoryReviewClient
        initialItems={dueItems}
        stats={stats}
        dailyTarget={planUsage.dailyReviewTarget}
        sessionTitle="Learn review"
        emptyHint="Generate a practice set from a saved analysis, or open a specific analysis and choose Practice."
      />
    </LearnShell>
  );
}

function LearnShell({
  children,
  savedCount,
  dailyCount,
  planLabel,
}: {
  children: React.ReactNode;
  savedCount: number;
  dailyCount: number;
  planLabel: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar savedCount={savedCount} dailyCount={dailyCount} planLabel={planLabel} />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <main className="mx-auto max-w-4xl">
          <Link
            href="/dashboard"
            className="inline-flex text-xs text-zinc-500 transition-colors hover:text-violet-300"
          >
            ← Back to dashboard
          </Link>
          {children}
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
