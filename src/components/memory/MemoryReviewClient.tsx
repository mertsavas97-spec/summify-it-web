"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, Keyboard, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import { Button } from "@/components/ui/Button";
import type { ReviewItem, ReviewRating } from "@/types/memory";
import type { DifficultConcept, ReviewStats } from "@/types/memory";

type MemoryReviewClientProps = {
  initialItems: ReviewItem[];
  stats: ReviewStats;
  dailyTarget: number;
  /** User-facing session heading (defaults to Learn review). */
  sessionTitle?: string;
  emptyHint?: string;
};

const RATING_META: Record<ReviewRating, { label: string; key: string; className: string }> = {
  again: { label: "Again", key: "1", className: "border-rose-500/25 text-rose-200 hover:bg-rose-500/10" },
  hard: { label: "Hard", key: "2", className: "border-amber-500/25 text-amber-200 hover:bg-amber-500/10" },
  good: { label: "Good", key: "3", className: "border-emerald-500/25 text-emerald-200 hover:bg-emerald-500/10" },
  easy: { label: "Easy", key: "4", className: "border-sky-500/25 text-sky-200 hover:bg-sky-500/10" },
};

export function MemoryReviewClient({
  initialItems,
  stats,
  dailyTarget,
  sessionTitle = "Learn review",
  emptyHint = "Generate a practice set from a saved analysis, or come back when your next review window opens.",
}: MemoryReviewClientProps) {
  const [items] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingCounts, setRatingCounts] = useState<Record<ReviewRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [retentionEstimate, setRetentionEstimate] = useState(stats.retentionEstimate);
  const [streakAfter, setStreakAfter] = useState(stats.retention.streak.current);

  const active = items[index] ?? null;
  const complete = !active;

  const reviewStartedRef = useRef(false);
  const reviewCompletedRef = useRef(false);

  useEffect(() => {
    if (items.length > 0 && !reviewStartedRef.current) {
      reviewStartedRef.current = true;
      trackEvent("review_started", { item_count: items.length });
    }
  }, [items.length]);

  useEffect(() => {
    if (complete && reviewed > 0 && !reviewCompletedRef.current) {
      reviewCompletedRef.current = true;
      trackEvent("review_completed", { reviewed_count: reviewed });
    }
  }, [complete, reviewed]);
  const progress = useMemo(() => {
    if (items.length === 0) return 100;
    return Math.round((reviewed / Math.max(items.length, 1)) * 100);
  }, [items.length, reviewed]);

  const rate = useCallback(async (rating: ReviewRating) => {
    if (!active || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/memory/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: active.id, rating, sessionId }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        sessionId?: string;
        retention?: {
          streakBefore: number;
          streakAfter: number;
          lastReviewDate: string;
          retentionEstimate: number;
        };
        error?: string;
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Could not record review.");
      }
      if (payload.sessionId) setSessionId(payload.sessionId);
      if (payload.retention) {
        setRetentionEstimate(payload.retention.retentionEstimate);
        setStreakAfter(payload.retention.streakAfter);
      }
      setRatingCounts((counts) => ({ ...counts, [rating]: counts[rating] + 1 }));
      setReviewed((count) => count + 1);
      setRevealed(false);
      setIndex((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record review.");
    } finally {
      setPending(false);
    }
  }, [active, pending, sessionId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setRevealed(true);
      }
      if (!revealed) return;
      const rating = (Object.entries(RATING_META).find(([, meta]) => meta.key === event.key)?.[0] ??
        null) as ReviewRating | null;
      if (rating) void rate(rating);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rate, revealed]);

  const dailyProgress = Math.min(100, Math.round(((stats.retention.velocity.today + reviewed) / Math.max(1, dailyTarget)) * 100));
  const sessionDifficult: DifficultConcept[] = stats.difficultConcepts.slice(0, 3);

  if (initialItems.length === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 text-center">
        <ProgressRing value={100} label="Done" />
        <p className="text-sm font-medium text-zinc-200">No cards are due right now.</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-500">{emptyHint}</p>
        <Button href="/dashboard" className="mt-5" size="sm" variant="secondary">
          Back to dashboard
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Practice session
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white">{sessionTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing value={dailyProgress} label="Goal" />
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-zinc-950/60 px-2.5 py-1.5 text-[11px] text-zinc-500">
            <Keyboard className="h-3.5 w-3.5" aria-hidden />
            Space reveal · 1-4 rate
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        <SessionStat label="Streak" value={streakAfter} hint={streakAfter === 1 ? "day" : "days"} />
        <SessionStat label="Mastery" value={`${stats.retention.mastery.score}%`} hint="current" />
        <SessionStat label="Today" value={stats.retention.velocity.today + reviewed} hint={`/${dailyTarget} goal`} />
        <SessionStat label="Due" value={Math.max(0, stats.dueToday - reviewed)} hint="remaining" />
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {complete ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-200 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </div>
          <p className="text-lg font-semibold text-white">Review complete</p>
          <p className="mt-2 text-sm text-zinc-500">
            {reviewed} cards reviewed · {retentionEstimate}% retention estimate · {streakAfter} day streak
          </p>
          <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-4">
            {(Object.keys(RATING_META) as ReviewRating[]).map((rating) => (
              <SessionStat key={rating} label={RATING_META[rating].label} value={ratingCounts[rating]} hint="rated" />
            ))}
          </div>
          {sessionDifficult.length > 0 ? (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-500/15 bg-amber-950/15 p-3 text-left">
              <p className="flex items-center gap-2 text-xs font-medium text-amber-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Concepts to revisit
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sessionDifficult.map((concept) => (
                  <span key={concept.id} className="rounded-lg border border-amber-500/15 px-2 py-1 text-[11px] text-amber-200/85">
                    {concept.title}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <Button href="/dashboard" className="mt-6" size="sm">
            Return to dashboard
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <div
            key={active.id}
            className="min-h-72 rounded-xl border border-violet-500/15 bg-zinc-950/70 p-5 transition-all sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
                {active.source_kind.replace("_", " ")}
              </p>
              <p className="text-xs tabular-nums text-zinc-600">
                {index + 1} / {items.length}
              </p>
            </div>

            <p className="mt-8 text-xl font-semibold leading-snug text-white sm:text-2xl">{active.prompt}</p>

            <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              {revealed ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{active.answer}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-4 py-8 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-zinc-200"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  Reveal answer
                </button>
              )}
            </div>

            {active.context ? <p className="mt-4 text-xs text-zinc-600">{active.context}</p> : null}
          </div>

          {revealed ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {(Object.keys(RATING_META) as ReviewRating[]).map((rating) => {
                const meta = RATING_META[rating];
                return (
                  <button
                    key={rating}
                    type="button"
                    disabled={pending}
                    onClick={() => rate(rating)}
                    className={`rounded-xl border bg-zinc-950/50 px-3 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${meta.className}`}
                  >
                    {meta.label}
                    <span className="ml-2 text-[10px] opacity-60">{meta.key}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Button className="mt-4" size="sm" variant="secondary" onClick={() => setRevealed(true)}>
              Show answer
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}

          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        </div>
      )}
    </section>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="grid h-14 w-14 place-items-center rounded-full"
      style={{
        background: `conic-gradient(rgb(167 139 250) ${clamped}%, rgba(255,255,255,0.08) ${clamped}% 100%)`,
      }}
      aria-label={`${label} ${clamped}%`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-zinc-950 text-center">
        <span className="text-[10px] font-semibold tabular-nums text-zinc-100">{clamped}%</span>
        <span className="-mt-1 text-[8px] uppercase tracking-wider text-zinc-600">{label}</span>
      </div>
    </div>
  );
}

function SessionStat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
      <p className="text-base font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-0.5 text-[10px] text-zinc-600">{hint}</p>
    </div>
  );
}
