"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Brain, HelpCircle, Layers } from "lucide-react";
import { AnalysisPracticeSession } from "@/components/learn/AnalysisPracticeSession";
import { AnalysisQuizSession } from "@/components/learn/AnalysisQuizSession";
import { generateAnalysisQuiz } from "@/lib/learn/generateAnalysisQuiz";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { buildPracticeSessionCardsFromLearn } from "@/lib/learn/practiceSessionTypes";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";
import { AnalysisResultView } from "./AnalysisResultView";
import { LearnSection } from "./LearnSection";
import { ListeningExperienceSuggestions } from "./ListeningExperienceSuggestions";
import {
  ResultsSectionTabs,
  scrollToResultsSection,
  type ResultsSectionId,
} from "./ResultsSectionTabs";

type SummaryLearnResultsPanelProps = {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  modeLabel: string;
  sourceKindLabel: string;
  providerUsed: string;
  fallbackUsed: boolean;
  uiSectionLabels?: PersonaUiSectionLabels;
  entitlementPlanId: PlanId;
  isPaidActive: boolean;
  sourceType?: string | null;
  sourceLabel?: string | null;
  savedAnalysisId?: string | null;
  onTryAudio?: () => void;
  onTryPodcast?: () => void;
  footerContent?: ReactNode;
};

export function SummaryLearnResultsPanel({
  result,
  modeId,
  modeLabel,
  sourceKindLabel,
  providerUsed,
  fallbackUsed,
  uiSectionLabels,
  entitlementPlanId,
  isPaidActive,
  sourceType,
  sourceLabel,
  savedAnalysisId,
  onTryAudio,
  onTryPodcast,
  footerContent,
}: SummaryLearnResultsPanelProps) {
  const [quizActive, setQuizActive] = useState(false);
  const [learnStarted, setLearnStarted] = useState(false);
  const [activeSection, setActiveSection] = useState<ResultsSectionId>("learn");

  const cardAccess = useMemo(
    () => getPracticeCardAccessForPlan(entitlementPlanId, result.learnCards),
    [entitlementPlanId, result.learnCards],
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
        title: result.title,
        summary: result.summary,
        keyInsights: result.keyInsights,
        risksOrWarnings: result.risksOrWarnings,
        actionItems: result.actionItems,
        learnCards: cardAccess.accessibleCards,
        maxQuestions: cardAccess.isLimited ? 5 : 6,
      }),
    [cardAccess.accessibleCards, cardAccess.isLimited, result],
  );

  const audioStudyInput = useMemo(
    () =>
      buildAudioStudyInputFromResult(result, {
        sourceType,
        intelligenceMode: modeId,
        sourceLabel,
        quizThemes: quizQuestions.map((q) => q.theme).filter(Boolean) as string[],
      }),
    [modeId, quizQuestions, result, sourceLabel, sourceType],
  );

  const analysisId = savedAnalysisId ?? "live-analysis";
  const hasLearn = practiceCards.length > 0;
  const hasInsights = result.keyInsights.length > 0;
  const hasQuiz = quizQuestions.length > 0;
  const flashcardCount = result.learnCards.filter(
    (card) => !card.isLockedPreview && card.type !== "quiz",
  ).length;
  const hasFlashcards = flashcardCount > 0;

  const sectionTabs = useMemo(() => {
    const tabs: ResultsSectionId[] = [];
    if (hasLearn) tabs.push("learn");
    tabs.push("quiz");
    tabs.push("summary");
    if (hasInsights) tabs.push("insights");
    if (hasFlashcards) tabs.push("flashcards");
    return tabs;
  }, [hasFlashcards, hasInsights, hasLearn]);

  function handleNavigate(id: ResultsSectionId) {
    setActiveSection(id);
    scrollToResultsSection(id);
  }

  function handleStartLearn() {
    setLearnStarted(true);
    setActiveSection("learn");
    requestAnimationFrame(() => scrollToResultsSection("learn"));
  }

  function handleStartQuiz() {
    setQuizActive(true);
    setActiveSection("quiz");
    requestAnimationFrame(() => scrollToResultsSection("quiz"));
  }

  return (
    <section className="space-y-4" data-summary-learn-results>
      <ResultsSectionTabs
        sections={sectionTabs}
        activeId={activeSection}
        onNavigate={handleNavigate}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <section
          id="result-section-learn"
          className="scroll-mt-28 rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-950/40 via-[#0f1520]/95 to-zinc-950 p-4 sm:p-5"
        >
          {learnStarted && hasLearn ? (
            <AnalysisPracticeSession
              analysisId={analysisId}
              documentTitle={result.title}
              sourceLabel={sourceLabel}
              modeLabel={modeLabel}
              sourceKindLabel={sourceKindLabel}
              cards={practiceCards}
              cardAccess={cardAccess}
              hasLearnCards
              practicePersisted={Boolean(savedAnalysisId)}
              entitlementPlanId={entitlementPlanId}
              isPaidActive={isPaidActive}
              autoStart
              hideWorkspaceLinks
              audioStudyInput={audioStudyInput}
            />
          ) : (
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15 text-sky-200">
                  <Brain className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
                  Learn ready
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">Practice with cards</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {hasLearn
                    ? `${practiceCards.length} recall prompts — reveal answers one by one.`
                    : "No Learn cards were generated for this analysis."}
                </p>
              </div>
              <button
                type="button"
                disabled={!hasLearn}
                onClick={handleStartLearn}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Learn
              </button>
            </div>
          )}
        </section>

        <section
          id="result-section-quiz"
          className="scroll-mt-28 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/45 via-[#14101f]/90 to-zinc-950 p-4 sm:p-5"
        >
          {quizActive ? (
            <AnalysisQuizSession
              analysisId={analysisId}
              documentTitle={result.title}
              questions={quizQuestions}
              retentionSummary={null}
              gotItCount={0}
              reviewAgainCount={0}
              lockedQuizCount={cardAccess.lockedCount}
              entitlementPlanId={entitlementPlanId}
              isPaidActive={isPaidActive}
              audioStudyInput={audioStudyInput}
              initialPhase="question"
            />
          ) : (
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-200">
                  <HelpCircle className="h-4 w-4" aria-hidden />
                </span>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
                  Quiz ready
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">Test your recall</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {hasQuiz
                    ? `${quizQuestions.length} multiple-choice questions — start anytime.`
                    : "Not enough content to generate a quiz."}
                </p>
              </div>
              <button
                type="button"
                disabled={!hasQuiz}
                onClick={handleStartQuiz}
                className="inline-flex w-full items-center justify-center rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start quiz
              </button>
            </div>
          )}
        </section>
      </div>

      <div
        id="result-section-summary"
        className="scroll-mt-28 rounded-2xl border border-emerald-400/15 bg-[#11141d]/75 p-4 sm:p-5"
      >
        <AnalysisResultView
          result={result}
          modeId={modeId}
          providerUsed={providerUsed}
          fallbackUsed={fallbackUsed}
          uiSectionLabels={uiSectionLabels}
          entitlementPlanId={entitlementPlanId}
          sections="summary"
          embedded
          showHeader={false}
          showToolbar={false}
        />
      </div>

      {hasInsights ? (
        <div
          id="result-section-insights"
          className="scroll-mt-28 rounded-2xl border border-amber-400/15 bg-[#11141d]/75 p-4 sm:p-5"
        >
          <AnalysisResultView
            result={result}
            modeId={modeId}
            providerUsed={providerUsed}
            fallbackUsed={fallbackUsed}
            uiSectionLabels={uiSectionLabels}
            entitlementPlanId={entitlementPlanId}
            sections="insights"
            embedded
            showHeader={false}
            showToolbar={false}
          />
        </div>
      ) : null}

      {hasFlashcards ? (
        <div
          id="result-section-flashcards"
          className="scroll-mt-28 rounded-2xl border border-fuchsia-400/15 bg-[#11141d]/75 p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-fuchsia-300" aria-hidden />
              <h3 className="text-sm font-semibold text-white">Flashcards</h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              {flashcardCount} card{flashcardCount === 1 ? "" : "s"}
            </span>
          </div>
          <LearnSection
            cards={result.learnCards}
            modeId={modeId}
            entitlementPlanId={entitlementPlanId}
          />
        </div>
      ) : null}

      <ListeningExperienceSuggestions onTryAudio={onTryAudio} onTryPodcast={onTryPodcast} />

      {footerContent}
    </section>
  );
}
