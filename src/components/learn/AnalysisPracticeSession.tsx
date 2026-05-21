"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { LearnMemoryAnchorPanel } from "@/components/learn/LearnMemoryAnchorPanel";
import { PracticeCompletionRetention } from "@/components/learn/PracticeCompletionRetention";
import { LearnSourceTracePanel } from "@/components/learn/LearnSourceTracePanel";
import { PracticeProgressionBadges } from "@/components/learn/PracticeProgressionBadges";
import { learnPracticeStartHref } from "@/lib/learn/paths";
import {
  loadPracticeRetentionHint,
  savePracticeRetentionSummary,
} from "@/lib/learn/practiceRetentionStorage";
import {
  buildPracticeRetentionSummary,
  isReviewItemId,
  mapOutcomeToReviewRating,
  orderWeakCardsForReview,
  recordOutcomeForCard,
} from "@/lib/learn/practiceRetentionSession";
import {
  type PracticeCardOutcome,
  type PracticeSessionCard,
  estimatePracticeMinutes,
  sortPracticeSessionCards,
} from "@/lib/learn/practiceSessionTypes";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import {
  getPracticeCardAccessForPlan,
  type PracticeCardAccess,
} from "@/lib/learn/practiceCardAccess";
import { PracticeProUpsell } from "@/components/learn/PracticeProUpsell";
import type { PlanId } from "@/types/plan";
import type { CardRetentionState, PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import { Button } from "@/components/ui/Button";

type SessionPhase = "pre" | "active" | "complete" | "weak" | "locked_complete";

type AnalysisPracticeSessionProps = {
  analysisId: string;
  documentTitle: string;
  sourceLabel?: string | null;
  modeLabel: string;
  sourceKindLabel: string;
  cards: PracticeSessionCard[];
  /** When omitted, derived from cards length + plan. */
  cardAccess?: PracticeCardAccess;
  hasLearnCards: boolean;
  autoStart?: boolean;
  /** When false, practice runs from in-memory cards (live analysis) without workspace save. */
  practicePersisted?: boolean;
  entitlementPlanId?: PlanId;
};

type OutcomeMap = Record<string, PracticeCardOutcome>;

export function AnalysisPracticeSession({
  analysisId,
  documentTitle,
  sourceLabel,
  modeLabel,
  sourceKindLabel,
  cards: initialCards,
  cardAccess: cardAccessInput,
  hasLearnCards,
  autoStart = false,
  practicePersisted = true,
  entitlementPlanId = "free",
}: AnalysisPracticeSessionProps) {
  const router = useRouter();
  const sortedCards = useMemo(() => sortPracticeSessionCards(initialCards), [initialCards]);
  const access = useMemo(
    () =>
      cardAccessInput ??
      getPracticeCardAccessForPlan(
        entitlementPlanId,
        sortedCards.map((c) => ({
          type: "concept",
          title: c.prompt,
          content: c.answer,
          cardId: c.id,
        })),
      ),
    [cardAccessInput, entitlementPlanId, sortedCards],
  );
  const accessibleCards = sortedCards;

  const [phase, setPhase] = useState<SessionPhase>(
    () => (autoStart && accessibleCards.length > 0 ? "active" : "pre"),
  );
  const [deck, setDeck] = useState<PracticeSessionCard[]>(() => [...accessibleCards]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [outcomes, setOutcomes] = useState<OutcomeMap>({});
  const [retentionStates, setRetentionStates] = useState<Record<string, CardRetentionState>>({});
  const [retentionSummary, setRetentionSummary] = useState<PracticeRetentionSummary | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = deck[index] ?? null;
  const sessionCardCount = access.accessibleCount;
  const estimatedTime = estimatePracticeMinutes(sessionCardCount);

  const passGotIt = useMemo(
    () => Object.values(outcomes).filter((o) => o === "got_it").length,
    [outcomes],
  );
  const passReviewAgain = useMemo(
    () => Object.values(outcomes).filter((o) => o === "review_again").length,
    [outcomes],
  );
  const passSkipped = useMemo(
    () => Object.values(outcomes).filter((o) => o === "skipped").length,
    [outcomes],
  );

  const progressPct =
    deck.length > 0 ? Math.round((index / deck.length) * 100) : 0;

  const syncReviewToServer = useCallback(
    async (cardId: string, outcome: PracticeCardOutcome) => {
      const rating = mapOutcomeToReviewRating(outcome);
      if (!rating || !isReviewItemId(cardId)) return;
      try {
        const response = await fetch("/api/memory/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ itemId: cardId, rating, sessionId }),
        });
        const payload = (await response.json()) as { sessionId?: string };
        if (payload.sessionId) setSessionId(payload.sessionId);
      } catch {
        /* non-blocking */
      }
    },
    [sessionId],
  );

  const startSession = useCallback(
    (cardsToUse: PracticeSessionCard[] = accessibleCards, resetOutcomes = true) => {
      setDeck(cardsToUse);
      setIndex(0);
      setRevealed(false);
      if (resetOutcomes) {
        setOutcomes({});
        setRetentionStates({});
        setRetentionSummary(null);
        setSessionId(null);
        if (cardsToUse.length > 0) {
          trackProductEventClient({
            eventType: "learn_started",
            sourceType: "practice",
            metadata: { card_count: cardsToUse.length },
          });
        }
      }
      setError(null);
      setPhase(cardsToUse.length > 0 ? "active" : "pre");
    },
    [accessibleCards],
  );

  function finishSession(nextOutcomes: OutcomeMap, nextStates: Record<string, CardRetentionState>) {
    const summary = buildPracticeRetentionSummary({
      analysisId,
      cards: accessibleCards,
      outcomes: nextOutcomes,
      states: Object.values(nextStates),
    });
    setRetentionSummary(summary);
    savePracticeRetentionSummary(summary);
    trackProductEventClient({
      eventType: "learn_completed",
      sourceType: "practice",
      metadata: { card_count: accessibleCards.length },
    });
    if (process.env.NODE_ENV === "development") {
      console.debug("[learn.retention]", {
        sessionReviewedCount: summary.sessionReviewedCount,
        weakCount: summary.weakCount,
        developingCount: summary.developingCount,
        stableCount: summary.stableCount,
        strongCount: summary.strongCount,
        hardestRetrievalType: summary.hardestRetrievalType,
        suggestedReviewCount: summary.suggestedReviewCount,
      });
    }
    setPhase("complete");
  }

  function markOutcome(outcome: PracticeCardOutcome) {
    if (!active) return;

    const nextState = recordOutcomeForCard(active, outcome, retentionStates, analysisId);
    const nextStates = { ...retentionStates, [active.id]: nextState };
    const nextOutcomes = { ...outcomes, [active.id]: outcome };

    setRetentionStates(nextStates);
    setOutcomes(nextOutcomes);
    setRevealed(false);
    void syncReviewToServer(active.id, outcome);

    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= deck.length) {
      if (access.isLimited) {
        setPhase("locked_complete");
      } else {
        finishSession(nextOutcomes, nextStates);
      }
    }
  }

  async function createPracticeSet(startAfter = false) {
    if (!practicePersisted) {
      if (accessibleCards.length > 0) startSession(accessibleCards, true);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const retentionHint = loadPracticeRetentionHint(analysisId);
      const response = await fetch(`/api/analyses/${analysisId}/memory`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retentionHint ? { retentionHint } : {}),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Couldn't create a practice set. Try again.");
      }
      if (startAfter) {
        router.push(learnPracticeStartHref(analysisId));
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create a practice set. Try again.");
    } finally {
      setPending(false);
    }
  }

  function restartSession(cardsToUse: PracticeSessionCard[] = accessibleCards) {
    startSession(cardsToUse);
  }

  function startWeakReview() {
    const weakIds =
      retentionSummary?.cardStates
        .filter((s) => s.retentionStrength === "weak" || s.reviewAgainCount > 0)
        .map((s) => s.cardId) ??
      accessibleCards.filter((c) => outcomes[c.id] === "review_again").map((c) => c.id);

    const weakDeck = orderWeakCardsForReview(accessibleCards, retentionStates, weakIds);
    if (weakDeck.length === 0) return;
    setPhase("weak");
    startSession(weakDeck, true);
  }

  if (access.totalCount === 0 || sessionCardCount === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 text-center">
        <h2 className="text-sm font-semibold text-zinc-200">No practice cards yet</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
          {hasLearnCards
            ? "Generate a practice set from this analysis to start reviewing."
            : "This analysis has no Learn cards yet. Open the analysis and run with Learn output, then create a practice set."}
        </p>
        {hasLearnCards ? (
          <Button
            type="button"
            className="mt-5"
            size="sm"
            disabled={pending}
            onClick={() => void createPracticeSet(practicePersisted ? false : true)}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            {practicePersisted ? "Create practice set" : "Start practice"}
          </Button>
        ) : (
          <Button href={`/dashboard/${analysisId}`} className="mt-5" size="sm" variant="secondary">
            Back to analysis
          </Button>
        )}
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </section>
    );
  }

  if (phase === "locked_complete") {
    return (
      <PracticeProUpsell
        lockedCount={access.lockedCount}
        variant="continuation"
        analysisId={analysisId}
        onFinishSession={() => finishSession(outcomes, retentionStates)}
      />
    );
  }

  if (phase === "pre") {
    return (
      <>
        <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/25 via-zinc-950/80 to-zinc-950/95 p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
          Practice session
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Ready to practice</h2>
        <p className="mt-2 text-sm text-violet-200/90">
          Reviewing: <span className="font-medium text-white">{documentTitle}</span>
        </p>
        {sourceLabel ? <p className="mt-1 truncate text-xs text-zinc-500">{sourceLabel}</p> : null}

        <dl className="mt-5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
          <MetaChip label="Mode" value={modeLabel} />
          <MetaChip label="Cards" value={`${access.accessibleCount} available`} />
          <MetaChip label="Est. time" value={estimatedTime} />
          <MetaChip label="Source" value={sourceKindLabel} />
        </dl>
        {access.isLimited ? (
          <p className="mt-2 text-[11px] font-medium text-violet-300/65">
            +{access.lockedCount} more with Pro
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" size="sm" onClick={() => startSession()}>
            Start practice
          </Button>
          <Button href={`/dashboard/${analysisId}`} size="sm" variant="secondary">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to analysis
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void createPracticeSet(false)}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            Regenerate practice set
          </Button>
        </div>
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </section>
      </>
    );
  }

  if (phase === "complete" && retentionSummary) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-white">Practice complete</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          {retentionSummary.sessionReviewedCount} cards reviewed
          {retentionSummary.cardStates.filter((s) => s.skippedCount > 0).length > 0
            ? ` · ${passSkipped} skipped`
            : ""}
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2 text-left">
          <SummaryStat label="Got it" value={retentionSummary.cardStates.reduce((n, s) => n + s.gotItCount, 0)} />
          <SummaryStat
            label="Review again"
            value={retentionSummary.cardStates.reduce((n, s) => n + s.reviewAgainCount, 0)}
          />
        </div>

        <PracticeCompletionRetention summary={retentionSummary} />

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {retentionSummary.suggestedReviewCount > 0 ? (
            <Button type="button" size="sm" onClick={startWeakReview}>
              Review weak cards
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="secondary" onClick={() => restartSession()}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Restart session
          </Button>
          <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
            Back to analysis
          </Button>
        </div>
      </section>
    );
  }

  if (!active) {
    return null;
  }

  const isWeakPass = phase === "weak";

  return (
    <>
    <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            {isWeakPass ? "Review weak cards" : "Practice session"}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">{documentTitle}</p>
        </div>
        <p className="shrink-0 text-xs tabular-nums text-zinc-500">
          Card {index + 1} of {deck.length}
          {access.isLimited ? (
            <span className="block text-[10px] font-normal text-violet-300/55">
              +{access.lockedCount} locked with Pro
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <span>
          Got it <strong className="text-emerald-300/90">{passGotIt}</strong>
        </span>
        <span className="text-zinc-700">·</span>
        <span>
          Review again <strong className="text-amber-300/90">{passReviewAgain}</strong>
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-violet-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <article
        key={active.id}
        className="mt-6 min-h-[280px] rounded-xl border border-violet-500/15 bg-zinc-950/70 p-4 sm:min-h-[300px] sm:p-5"
      >
        <PracticeProgressionBadges
          recallDifficulty={active.recallDifficulty}
          retrievalType={active.retrievalType}
          cognitiveLevel={active.cognitiveLevel}
        />

        <p className="mt-4 text-lg font-semibold leading-snug text-white sm:text-xl">{active.prompt}</p>

        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
          {revealed ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{active.answer}</p>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-4 py-10 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-zinc-200"
            >
              <Eye className="h-5 w-5" aria-hidden />
              Reveal answer
            </button>
          )}
        </div>

        {revealed ? (
          <>
            <LearnMemoryAnchorPanel anchor={active.memoryAnchor} className="mt-4" />
            <LearnSourceTracePanel trace={active.sourceTrace} className="mt-4" />
          </>
        ) : null}
      </article>

      {revealed ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            className="w-full sm:flex-1"
            onClick={() => markOutcome("got_it")}
          >
            Got it
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:flex-1"
            onClick={() => markOutcome("review_again")}
          >
            Review again
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => markOutcome("skipped")}
          >
            <SkipForward className="h-3.5 w-3.5" aria-hidden />
            Skip
          </Button>
        </div>
      ) : (
        <Button className="mt-4 w-full sm:w-auto" size="sm" variant="secondary" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}

      <div className="mt-4">
        <Link
          href={`/dashboard/${analysisId}`}
          className="text-[11px] text-zinc-500 transition-colors hover:text-violet-300"
        >
          ← Back to analysis
        </Link>
      </div>
    </section>
    </>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-zinc-950/50 px-2 py-1">
      <span className="text-zinc-600">{label}: </span>
      <span className="text-zinc-400">{value}</span>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
    </div>
  );
}
