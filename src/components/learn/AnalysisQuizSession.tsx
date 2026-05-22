"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import {
  buildCombinedLearningSummary,
  buildQuizResult,
} from "@/lib/learn/buildQuizOutcomeSummary";
import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import type { QuizOptionKey, QuizQuestion, QuizResult } from "@/types/learn-quiz";
import { Button } from "@/components/ui/Button";
import { LearnSourceTracePanel } from "@/components/learn/LearnSourceTracePanel";

type QuizPhase = "intro" | "question" | "feedback" | "complete";

type AnalysisQuizSessionProps = {
  analysisId: string;
  documentTitle: string;
  questions: QuizQuestion[];
  retentionSummary?: PracticeRetentionSummary | null;
  gotItCount: number;
  reviewAgainCount: number;
  lockedQuizCount?: number;
  entitlementPlanId: string;
  onRestartLearn?: () => void;
};

export function AnalysisQuizSession({
  analysisId,
  documentTitle,
  questions,
  retentionSummary,
  gotItCount,
  reviewAgainCount,
  lockedQuizCount = 0,
  entitlementPlanId,
  onRestartLearn,
}: AnalysisQuizSessionProps) {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<QuizOptionKey | null>(null);
  const [answers, setAnswers] = useState<QuizResult["answers"]>([]);
  const [trackedStart, setTrackedStart] = useState(false);

  const active = questions[index] ?? null;
  const quizResult = useMemo(
    () => buildQuizResult(questions, answers),
    [questions, answers],
  );

  const combinedSummary = useMemo(
    () =>
      buildCombinedLearningSummary({
        documentTitle,
        quizResult,
        retentionSummary,
        gotItCount,
        reviewAgainCount,
      }),
    [documentTitle, quizResult, retentionSummary, gotItCount, reviewAgainCount],
  );

  function startQuiz() {
    if (!trackedStart) {
      trackProductEventClient({
        eventType: "quiz_started",
        sourceType: "quiz",
        metadata: {
          analysis_id: analysisId,
          question_count: questions.length,
          plan: entitlementPlanId,
        },
      });
      setTrackedStart(true);
    }
    setPhase("question");
    setIndex(0);
    setSelectedKey(null);
    setAnswers([]);
  }

  function selectOption(key: QuizOptionKey) {
    if (!active || phase !== "question") return;
    const correct = key === active.correctOptionKey;
    setSelectedKey(key);
    setAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== active.id),
      { questionId: active.id, selectedKey: key, correct },
    ]);
    setPhase("feedback");
  }

  function goNext() {
    if (index + 1 >= questions.length) {
      setAnswers((prev) => {
        const result = buildQuizResult(questions, prev);
        trackProductEventClient({
          eventType: "quiz_completed",
          sourceType: "quiz",
          metadata: {
            analysis_id: analysisId,
            question_count: questions.length,
            score_percent: result.scorePercent,
            plan: entitlementPlanId,
          },
        });
        return prev;
      });
      setPhase("complete");
      return;
    }
    setIndex((i) => i + 1);
    setSelectedKey(null);
    setPhase("question");
  }

  if (questions.length === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 text-center">
        <p className="text-sm text-zinc-400">Not enough Learn content to generate a quiz yet.</p>
        <Button href={`/dashboard/${analysisId}`} size="sm" variant="secondary" className="mt-4">
          Back to analysis
        </Button>
      </section>
    );
  }

  if (phase === "intro") {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-zinc-950/80 to-zinc-950/95 p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
          Final phase · Quiz
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Ready for the quiz</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {questions.length} multiple-choice questions based on your Learn cards and analysis —
          one question at a time with explanations.
        </p>
        {lockedQuizCount > 0 ? (
          <p className="mt-2 text-[11px] text-violet-300/70">
            Unlock the full quiz with Pro (+{lockedQuizCount} more Learn cards in this analysis).
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" size="sm" onClick={startQuiz}>
            Start Quiz
          </Button>
          {onRestartLearn ? (
            <Button type="button" size="sm" variant="secondary" onClick={onRestartLearn}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Restart session
            </Button>
          ) : null}
          <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to analysis
          </Button>
        </div>
      </section>
    );
  }

  if (phase === "complete") {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/25 bg-violet-400/10 text-violet-200">
            <span className="text-xl font-semibold tabular-nums">{quizResult.scorePercent}%</span>
          </div>
          <h2 className="text-lg font-semibold text-white">Learning path complete</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
            {combinedSummary}
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-left">
          <Stat label="Quiz correct" value={`${quizResult.correctCount}/${quizResult.totalQuestions}`} />
          <Stat label="Quiz missed" value={String(quizResult.incorrectCount)} />
          <Stat label="Got it (Learn)" value={String(gotItCount)} />
          <Stat label="Review again" value={String(reviewAgainCount)} />
        </div>

        {quizResult.strongConcepts.length > 0 ? (
          <div className="mx-auto mt-5 max-w-lg rounded-xl border border-emerald-500/15 bg-emerald-950/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
              Understood well
            </p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
              {quizResult.strongConcepts.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {quizResult.weakConcepts.length > 0 ? (
          <div className="mx-auto mt-3 max-w-lg rounded-xl border border-amber-500/15 bg-amber-950/15 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
              Review next
            </p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
              {quizResult.weakConcepts.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mx-auto mt-5 max-w-md text-center text-xs text-zinc-500">
          Summify helped you extract structured intelligence from the source. Revisit weak themes in
          Learn, then run the quiz again after a break.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button type="button" size="sm" variant="secondary" onClick={startQuiz}>
            Retake quiz
          </Button>
          {onRestartLearn ? (
            <Button type="button" size="sm" variant="ghost" onClick={onRestartLearn}>
              Restart Learn session
            </Button>
          ) : null}
          <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
            Back to analysis
          </Button>
        </div>
      </section>
    );
  }

  if (!active) return null;

  const wasCorrect = selectedKey === active.correctOptionKey;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="font-semibold uppercase tracking-wider text-violet-300/80">Quiz</span>
        <span>
          Question {index + 1} of {questions.length}
        </span>
      </div>

      {phase === "question" ? (
        <>
          <p className="mt-4 text-lg font-semibold leading-snug text-white sm:text-xl">
            {active.question}
          </p>
          <div className="mt-5 grid gap-2">
            {active.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectOption(opt.key)}
                className="rounded-xl border border-white/[0.08] bg-zinc-950/70 px-4 py-3 text-left text-sm text-zinc-200 transition-colors hover:border-violet-500/35 hover:bg-violet-950/20"
              >
                <span className="mr-2 font-semibold text-violet-300/90">{opt.key}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              wasCorrect
                ? "border-emerald-500/25 bg-emerald-950/25 text-emerald-200"
                : "border-rose-500/25 bg-rose-950/20 text-rose-200"
            }`}
          >
            {wasCorrect ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {wasCorrect ? "Correct" : "Not quite"}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            <span className="font-medium text-zinc-100">Answer {active.correctOptionKey}: </span>
            {active.options.find((o) => o.key === active.correctOptionKey)?.text}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{active.explanation}</p>
          {active.sourceTrace ? (
            <LearnSourceTracePanel trace={active.sourceTrace} className="mt-4" />
          ) : null}
          <div className="mt-6">
            <Button type="button" size="sm" onClick={goNext}>
              {index + 1 >= questions.length ? "See results" : "Next question"}
            </Button>
          </div>
        </>
      )}
    </section>
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
