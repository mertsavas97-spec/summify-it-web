"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import { buildQuizResult } from "@/lib/learn/buildQuizOutcomeSummary";
import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import type { QuizOptionKey, QuizQuestion, QuizResult } from "@/types/learn-quiz";
import { AudioStudyCard } from "@/components/audio-study/AudioStudyCard";
import type { AudioStudyAnalysisInput } from "@/types/audio-study";
import type { PlanId } from "@/types/plan";
import { Button } from "@/components/ui/Button";
import { LearnSourceTracePanel } from "@/components/learn/LearnSourceTracePanel";
import { QuizCompletionPanel } from "@/components/learn/QuizCompletionPanel";

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
  isPaidActive?: boolean;
  audioStudyInput?: AudioStudyAnalysisInput;
  onRestartLearn?: () => void;
  onStartFocusedLearn?: (weakConcepts: string[]) => void;
  canCreateLearnVersion?: boolean;
  learnCapacityNote?: string | null;
  hideWorkspaceLinks?: boolean;
  initialPhase?: QuizPhase;
};

export function AnalysisQuizSession({
  analysisId,
  documentTitle,
  questions,
  gotItCount,
  reviewAgainCount,
  lockedQuizCount = 0,
  entitlementPlanId,
  isPaidActive = false,
  audioStudyInput,
  onRestartLearn,
  onStartFocusedLearn,
  canCreateLearnVersion = true,
  learnCapacityNote = null,
  hideWorkspaceLinks = false,
  initialPhase = "intro",
}: AnalysisQuizSessionProps) {
  const [phase, setPhase] = useState<QuizPhase>(initialPhase);
  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<QuizOptionKey | null>(null);
  const [answers, setAnswers] = useState<QuizResult["answers"]>([]);
  const trackedStartRef = useRef(initialPhase === "question");

  useEffect(() => {
    if (initialPhase !== "question" || trackedStartRef.current) return;
    trackedStartRef.current = true;
    trackProductEventClient({
      eventType: "quiz_started",
      sourceType: "quiz",
      metadata: {
        analysis_id: analysisId,
        question_count: questions.length,
        plan: entitlementPlanId,
      },
    });
  }, [analysisId, entitlementPlanId, initialPhase, questions.length]);

  const active = questions[index] ?? null;
  const quizResult = useMemo(
    () => buildQuizResult(questions, answers),
    [questions, answers],
  );

  function startQuiz() {
    if (!trackedStartRef.current) {
      trackProductEventClient({
        eventType: "quiz_started",
        sourceType: "quiz",
        metadata: {
          analysis_id: analysisId,
          question_count: questions.length,
          plan: entitlementPlanId,
        },
      });
      trackedStartRef.current = true;
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
          {analysisId === "live-analysis" || hideWorkspaceLinks ? null : (
            <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to analysis
            </Button>
          )}
        </div>
      </section>
    );
  }

  if (phase === "complete") {
    return (
      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4 sm:p-8">
        <QuizCompletionPanel
          documentTitle={documentTitle}
          quizResult={quizResult}
          gotItCount={gotItCount}
          reviewAgainCount={reviewAgainCount}
          onRetakeQuiz={startQuiz}
          onRestartLearn={onRestartLearn}
          onStartFocusedLearn={onStartFocusedLearn}
          canCreateLearnVersion={canCreateLearnVersion}
          learnCapacityNote={learnCapacityNote}
          analysisId={analysisId}
          entitlementPlanId={entitlementPlanId}
          isPaidActive={isPaidActive}
          audioSlot={
            audioStudyInput ? (
              <div className="text-left">
                <AudioStudyCard
                  variant="compact"
                  analysisId={analysisId}
                  entitlementPlanId={entitlementPlanId as PlanId}
                  isPaidActive={isPaidActive}
                  analysisInput={audioStudyInput}
                />
              </div>
            ) : null
          }
          backSlot={
            hideWorkspaceLinks || analysisId === "live-analysis" ? null : (
              <div className="flex justify-center">
                <Button href={`/dashboard/${analysisId}`} size="sm" variant="ghost">
                  Back to analysis
                </Button>
              </div>
            )
          }
        />
      </section>
    );
  }

  if (!active) return null;

  const wasCorrect = selectedKey === active.correctOptionKey;

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-3 sm:p-6">
      <div className="flex min-w-0 items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="shrink-0 font-semibold uppercase tracking-wider text-violet-300/80">
          Quiz
        </span>
        <span className="min-w-0 truncate tabular-nums">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      {phase === "question" ? (
        <>
          <p className="mt-4 break-words text-base font-semibold leading-snug text-white [overflow-wrap:anywhere] sm:text-xl">
            {active.question}
          </p>
          <div className="mt-5 grid min-w-0 gap-2">
            {active.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectOption(opt.key)}
                className="flex min-w-0 items-start gap-2 rounded-xl border border-white/[0.08] bg-zinc-950/70 px-3 py-3 text-left text-sm text-zinc-200 transition-colors hover:border-violet-500/35 hover:bg-violet-950/20 sm:px-4"
              >
                <span className="shrink-0 font-semibold text-violet-300/90">{opt.key}.</span>
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{opt.text}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 min-w-0 space-y-4" data-quiz-feedback>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
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

          <div className="min-w-0 rounded-xl border border-white/[0.07] bg-black/25 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Correct answer
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200 [overflow-wrap:anywhere]">
              <span className="font-semibold text-zinc-50">{active.correctOptionKey}. </span>
              {active.options.find((o) => o.key === active.correctOptionKey)?.text}
            </p>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Explanation
            </p>
            <div
              className="mt-2 max-h-[40vh] overflow-y-auto pr-1 [overflow-wrap:anywhere]"
              data-quiz-explanation
            >
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
                {active.explanation}
              </p>
            </div>
          </div>

          {active.sourceTrace ? (
            <LearnSourceTracePanel trace={active.sourceTrace} className="mt-4" />
          ) : null}

          <div className="sticky bottom-0 mt-2 border-t border-white/[0.06] bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent pb-1 pt-3">
            <Button type="button" size="sm" onClick={goNext} className="w-full sm:w-auto">
              {index + 1 >= questions.length ? "See results" : "Next question"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
