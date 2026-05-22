"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AnalysisLearningPath } from "@/components/learn/AnalysisLearningPath";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buildPracticeSessionCardsFromLearn } from "@/lib/learn/practiceSessionTypes";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { learnDashboardHref, learnPracticeStartHref } from "@/lib/learn/paths";
import type { AnalysisResult, LearnCardOutput } from "@/types/text-analysis";
import type { PlanId } from "@/types/plan";

type PracticeAnalysisCtaProps = {
  savedAnalysisId?: string | null;
  savedToWorkspace?: boolean;
  learnCards?: LearnCardOutput[];
  documentTitle?: string;
  modeLabel?: string;
  sourceKindLabel?: string;
  entitlementPlanId?: PlanId;
  analysisContent?: Pick<
    AnalysisResult,
    "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems"
  >;
};

const supabaseConfigured = isSupabaseConfigured();

export function PracticeAnalysisCta({
  savedAnalysisId,
  savedToWorkspace,
  learnCards = [],
  documentTitle = "This analysis",
  modeLabel = "Analysis",
  sourceKindLabel = "Document",
  entitlementPlanId = "free",
  analysisContent,
}: PracticeAnalysisCtaProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cardAccess = useMemo(
    () => getPracticeCardAccessForPlan(entitlementPlanId, learnCards),
    [entitlementPlanId, learnCards],
  );

  const practiceCards = useMemo(
    () =>
      cardAccess.accessibleCount > 0
        ? buildPracticeSessionCardsFromLearn(cardAccess.accessibleCards)
        : [],
    [cardAccess.accessibleCards, cardAccess.accessibleCount],
  );

  const canPracticeLive = practiceCards.length > 0;

  useEffect(() => {
    if (!supabaseConfigured) return;

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePractice() {
    if (!savedAnalysisId || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/analyses/${savedAnalysisId}/memory`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setMessage(data.error ?? "Couldn't create a practice set. Try again.");
        return;
      }

      router.push(learnPracticeStartHref(savedAnalysisId));
    } catch {
      setMessage("Couldn't create a practice set. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  if (canPracticeLive) {
    const sessionId = savedAnalysisId ?? "live-analysis";

    return (
      <div className="space-y-3" data-workspace-practice-session>
        {!user && savedAnalysisId ? (
          <p className="text-xs text-zinc-500">
            <Link href="/login?next=/upload" className="text-violet-400/80 hover:text-violet-300">
              Sign in
            </Link>{" "}
            to save practice progress to your Learn dashboard.
          </p>
        ) : savedToWorkspace === false ? (
          <p className="text-xs text-zinc-500">
            Saving to your workspace unlocks spaced review on the Learn dashboard.
          </p>
        ) : null}

        <AnalysisLearningPath
          analysisId={sessionId}
          documentTitle={documentTitle}
          modeLabel={modeLabel}
          sourceKindLabel={sourceKindLabel}
          learnCards={learnCards}
          entitlementPlanId={entitlementPlanId}
          hasLearnCards
          practicePersisted={Boolean(savedAnalysisId)}
          analysisContent={
            analysisContent ?? {
              title: documentTitle,
              summary: "",
              keyInsights: [],
              risksOrWarnings: [],
              actionItems: [],
            }
          }
        />
      </div>
    );
  }

  if (!savedAnalysisId) {
    if (savedToWorkspace === undefined) {
      return (
        <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
          Preparing your analysis…
        </p>
      );
    }

    return (
      <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
        No practice cards were generated for this analysis. Try another mode or a longer
        document.
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-zinc-950/60 px-4 py-4"
      data-workspace-practice-cta
    >
      <p className="text-sm font-medium text-zinc-200">Practice from this saved analysis</p>
      <p className="mt-1 text-xs text-zinc-500">
        Create a practice set from your Learn cards to start reviewing.
      </p>
      {message ? <p className="mt-2 text-xs text-amber-200/90">{message}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handlePractice()}
          className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-violet-500/15 transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? "Preparing session…" : "Create practice set"}
        </button>
        <Link
          href={learnDashboardHref(savedAnalysisId)}
          className="text-[11px] text-zinc-500 transition-colors hover:text-violet-300/90"
        >
          Open Learn →
        </Link>
      </div>
    </div>
  );
}
