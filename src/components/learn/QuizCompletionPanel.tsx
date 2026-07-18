"use client";

import { Brain, CheckCircle2, RotateCcw, Target, Sparkles } from "lucide-react";
import type { QuizResult } from "@/types/learn-quiz";
import { Button } from "@/components/ui/Button";

type QuizCompletionPanelProps = {
  documentTitle: string;
  quizResult: QuizResult;
  gotItCount: number;
  reviewAgainCount: number;
  onRetakeQuiz: () => void;
  onStartFocusedLearn?: (weakConcepts: string[]) => void;
  onRestartLearn?: () => void;
  canCreateLearnVersion?: boolean;
  learnCapacityNote?: string | null;
  analysisId: string;
  entitlementPlanId: string;
  isPaidActive?: boolean;
  audioSlot?: React.ReactNode;
  backSlot?: React.ReactNode;
};

function scoreTone(score: number): string {
  if (score >= 80) return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (score >= 50) return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-rose-400/30 bg-rose-500/15 text-rose-100";
}

export function QuizCompletionPanel({
  documentTitle,
  quizResult,
  gotItCount,
  reviewAgainCount,
  onRetakeQuiz,
  onStartFocusedLearn,
  onRestartLearn,
  canCreateLearnVersion = true,
  learnCapacityNote,
  audioSlot,
  backSlot,
}: QuizCompletionPanelProps) {
  const hasWeak = quizResult.weakConcepts.length > 0;

  return (
    <div className="min-w-0 space-y-5" data-quiz-completion>
      <div className="text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${scoreTone(quizResult.scorePercent)}`}
        >
          <span className="text-xl font-semibold tabular-nums">{quizResult.scorePercent}%</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Learning path complete</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
          Quiz finished for{" "}
          <span className="text-zinc-200">
            {documentTitle.length > 72 ? `${documentTitle.slice(0, 69)}…` : documentTitle}
          </span>
          . Here’s what you know well — and what to review next.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Quiz correct" value={`${quizResult.correctCount}/${quizResult.totalQuestions}`} />
        <Stat label="Quiz missed" value={String(quizResult.incorrectCount)} />
        <Stat label="Got it (Learn)" value={String(gotItCount)} />
        <Stat label="Review again" value={String(reviewAgainCount)} />
      </div>

      <p className="text-center text-xs leading-relaxed text-zinc-500">
        {quizResult.learningOutcomeSummary}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <TopicPanel
          tone="strong"
          title="Understood well"
          empty="No strong themes yet — retake after another Learn pass."
          items={quizResult.strongConcepts}
          icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
        />
        <TopicPanel
          tone="weak"
          title="Needs another pass"
          empty="Nice — no weak themes from this quiz."
          items={quizResult.weakConcepts}
          icon={<Target className="h-3.5 w-3.5" aria-hidden />}
        />
      </div>

      <section className="rounded-2xl border border-sky-400/20 bg-sky-950/20 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15 text-sky-200">
            <Brain className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
              Next Learn session
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">
              {hasWeak ? "Review weak topics in a new Learn version" : "Start another Learn version"}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              {canCreateLearnVersion
                ? hasWeak
                  ? "We’ll open a new Learn tab (keeping earlier versions) and prioritize the topics you missed."
                  : "Create another Learn pass with a fresh card order. Learn 1 stays available in its tab."
                : learnCapacityNote ??
                  "This source doesn’t have enough depth for another Learn version."}
            </p>
            {hasWeak && canCreateLearnVersion ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {quizResult.weakConcepts.slice(0, 4).map((theme) => (
                  <li
                    key={theme}
                    className="max-w-full truncate rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100/90"
                  >
                    {theme}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {canCreateLearnVersion && onStartFocusedLearn ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onStartFocusedLearn(quizResult.weakConcepts)}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {hasWeak ? "New Learn on weak topics" : "New Learn version"}
                </Button>
              ) : null}
              {onRestartLearn ? (
                <Button type="button" size="sm" variant="secondary" onClick={onRestartLearn}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Restart current Learn
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={onRetakeQuiz}>
                Retake quiz
              </Button>
            </div>
          </div>
        </div>
      </section>

      {audioSlot}
      {backSlot}
    </div>
  );
}

function TopicPanel({
  title,
  items,
  empty,
  tone,
  icon,
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "strong" | "weak";
  icon: React.ReactNode;
}) {
  const shell =
    tone === "strong"
      ? "border-emerald-500/15 bg-emerald-950/20"
      : "border-amber-500/15 bg-amber-950/15";
  const label =
    tone === "strong" ? "text-emerald-300/80" : "text-amber-300/80";

  return (
    <div className={`min-w-0 rounded-xl border px-3.5 py-3 ${shell}`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${label}`}>
        {icon}
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="break-words text-xs leading-relaxed text-zinc-300 [overflow-wrap:anywhere]"
            >
              · {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{empty}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
