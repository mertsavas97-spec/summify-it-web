"use client";

import { useCallback, useMemo, useState } from "react";
import { AnalysisPracticeSession } from "@/components/learn/AnalysisPracticeSession";
import { AnalysisQuizSession } from "@/components/learn/AnalysisQuizSession";
import { LearningPhaseNav } from "@/components/learn/LearningPhaseNav";
import { generateAnalysisQuiz } from "@/lib/learn/generateAnalysisQuiz";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { buildPracticeSessionCardsFromLearn } from "@/lib/learn/practiceSessionTypes";
import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import type { AnalysisResult, LearnCardOutput } from "@/types/text-analysis";
import type { PlanId } from "@/types/plan";

type AnalysisLearningPathProps = {
  analysisId: string;
  documentTitle: string;
  modeLabel: string;
  sourceKindLabel: string;
  learnCards: LearnCardOutput[];
  entitlementPlanId?: PlanId;
  isPaidActive?: boolean;
  intelligenceModeId?: string;
  sourceType?: string | null;
  practicePersisted?: boolean;
  hasLearnCards?: boolean;
  autoStart?: boolean;
  analysisContent: Pick<
    AnalysisResult,
    "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems"
  >;
};

export function AnalysisLearningPath({
  analysisId,
  documentTitle,
  modeLabel,
  sourceKindLabel,
  learnCards,
  entitlementPlanId = "free",
  isPaidActive = false,
  intelligenceModeId = "general-summary",
  sourceType = null,
  practicePersisted = true,
  hasLearnCards = true,
  autoStart = false,
  analysisContent,
}: AnalysisLearningPathProps) {
  const [learnComplete, setLearnComplete] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const [reviewAgainCount, setReviewAgainCount] = useState(0);
  const [retentionSummary, setRetentionSummary] = useState<PracticeRetentionSummary | null>(
    null,
  );
  const [sessionKey, setSessionKey] = useState(0);

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

  const quizQuestions = useMemo(
    () =>
      generateAnalysisQuiz({
        title: analysisContent.title,
        summary: analysisContent.summary,
        keyInsights: analysisContent.keyInsights,
        risksOrWarnings: analysisContent.risksOrWarnings,
        actionItems: analysisContent.actionItems,
        learnCards: cardAccess.accessibleCards.map((c) => ({
          cardId: c.cardId,
          type: c.type,
          title: c.title,
          content: c.content,
          isLockedPreview: c.isLockedPreview,
          sourceTrace: c.sourceTrace,
          recallDifficulty: c.recallDifficulty,
        })),
        maxQuestions: cardAccess.isLimited ? 5 : 6,
      }),
    [analysisContent, cardAccess.accessibleCards, cardAccess.isLimited],
  );

  const audioInput = useMemo(
    () =>
      buildAudioStudyInputFromResult(
        { ...analysisContent, learnCards },
        {
          sourceType,
          intelligenceMode: intelligenceModeId,
          sourceLabel: sourceKindLabel,
          quizThemes: quizQuestions.map((q) => q.theme).filter(Boolean) as string[],
        },
      ),
    [
      analysisContent,
      learnCards,
      sourceType,
      intelligenceModeId,
      sourceKindLabel,
      quizQuestions,
    ],
  );

  const handleLearnComplete = useCallback((summary: PracticeRetentionSummary) => {
    setRetentionSummary(summary);
    setGotItCount(summary.cardStates.reduce((n, s) => n + s.gotItCount, 0));
    setReviewAgainCount(summary.cardStates.reduce((n, s) => n + s.reviewAgainCount, 0));
    setLearnComplete(true);
  }, []);

  const restartLearn = useCallback(() => {
    setLearnComplete(false);
    setQuizActive(false);
    setRetentionSummary(null);
    setGotItCount(0);
    setReviewAgainCount(0);
    setSessionKey((k) => k + 1);
  }, []);

  if (quizActive && learnComplete) {
    return (
      <div data-learning-path="quiz">
        <LearningPhaseNav learnComplete quizActive />
        <AnalysisQuizSession
          analysisId={analysisId}
          documentTitle={documentTitle}
          questions={quizQuestions}
          retentionSummary={retentionSummary}
          gotItCount={gotItCount}
          reviewAgainCount={reviewAgainCount}
          lockedQuizCount={cardAccess.lockedCount}
          entitlementPlanId={entitlementPlanId}
          isPaidActive={isPaidActive}
          audioStudyInput={audioInput}
          onRestartLearn={restartLearn}
        />
      </div>
    );
  }

  return (
    <div data-learning-path="learn">
      <LearningPhaseNav learnComplete={learnComplete} quizActive={false} />
      <AnalysisPracticeSession
        key={sessionKey}
        analysisId={analysisId}
        documentTitle={documentTitle}
        modeLabel={modeLabel}
        sourceKindLabel={sourceKindLabel}
        cards={practiceCards}
        cardAccess={cardAccess}
        hasLearnCards={hasLearnCards}
        practicePersisted={practicePersisted}
        entitlementPlanId={entitlementPlanId}
        onLearnComplete={handleLearnComplete}
        onStartQuiz={() => setQuizActive(true)}
        learnComplete={learnComplete}
        autoStart={autoStart}
        showQuizUnlockHint
        isPaidActive={isPaidActive}
        audioStudyInput={audioInput}
      />
    </div>
  );
}
