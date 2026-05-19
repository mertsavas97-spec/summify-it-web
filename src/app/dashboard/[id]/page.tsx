import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteAnalysisButton } from "@/components/dashboard/DeleteAnalysisButton";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { AnalysisResultView } from "@/components/upload/AnalysisResultView";
import { Badge } from "@/components/ui/Badge";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import {
  getIntelligenceModeLabel,
  getSourceKindLabel,
} from "@/lib/saved-analysis-labels";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getAnalysisById } from "@/server/analyses/getAnalysisById";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { IntelligenceModeId } from "@/types/modes";
import type { AnalysisResult } from "@/types/text-analysis";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return createPageMetadata({
    title: "Saved analysis",
    description: "Review a saved Summify intelligence session.",
    path: `/dashboard/${id}`,
    noIndex: true,
  });
}

export default async function SavedAnalysisDetailPage({ params }: PageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not_configured&next=/dashboard");
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect(`/login?next=/dashboard`);
  }

  await ensureProfileForUser();

  const { id } = await params;
  const saved = await getAnalysisById(id, user.id);
  if (!saved) {
    notFound();
  }

  const [profile, limits, savedCount] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
  ]);

  const result: AnalysisResult = {
    title: saved.summary.title,
    summary: saved.summary.summary,
    keyInsights: saved.summary.keyInsights ?? [],
    risksOrWarnings: saved.summary.risksOrWarnings ?? [],
    actionItems: saved.summary.actionItems ?? [],
    learnCards: saved.learn_cards ?? [],
  };

  const modeId = (saved.intelligence_mode ?? "executive-brief") as IntelligenceModeId;
  const created = new Date(saved.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const planLabel = formatPlanLabel(profile?.plan ?? "beta");

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={limits?.daily_analysis_count ?? 0}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="inline-flex text-xs text-zinc-500 transition-colors hover:text-violet-300"
          >
            ← Back to dashboard
          </Link>

          <header className="mt-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <Badge variant="muted" className="mb-2">
                  Saved session
                </Badge>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {saved.title ?? result.title}
                </h1>
                {saved.source_label ? (
                  <p className="mt-1 truncate text-sm text-zinc-500">{saved.source_label}</p>
                ) : null}
              </div>
              <DeleteAnalysisButton analysisId={saved.id} redirectTo="/dashboard" size="md" />
            </div>

            <dl className="mt-5 flex flex-wrap gap-2">
              <MetaChip label="Source" value={getSourceKindLabel(saved.source_kind)} />
              <MetaChip label="Mode" value={getIntelligenceModeLabel(saved.intelligence_mode)} />
              <MetaChip label="Created" value={created} />
              {saved.provider_used ? (
                <MetaChip label="Provider" value={saved.provider_used} />
              ) : null}
              {saved.metadata?.fallbackUsed ? (
                <span className="rounded-md border border-amber-500/20 bg-amber-950/30 px-2 py-1 text-[10px] text-amber-300/90">
                  Fallback model used
                </span>
              ) : null}
            </dl>
          </header>

          <div className="mt-8" data-saved-analysis-detail>
            <AnalysisResultView
              result={result}
              modeId={modeId}
              providerUsed={saved.provider_used ?? "unknown"}
              fallbackUsed={saved.metadata?.fallbackUsed ?? false}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-2.5 py-1.5">
      <dt className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium text-zinc-300">{value}</dd>
    </div>
  );
}
