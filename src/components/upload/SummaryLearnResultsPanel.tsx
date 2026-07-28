"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCcw,
} from "lucide-react";
import { AnalysisPracticeSession } from "@/components/learn/AnalysisPracticeSession";
import { AnalysisQuizSession } from "@/components/learn/AnalysisQuizSession";
import { generateAnalysisQuiz } from "@/lib/learn/generateAnalysisQuiz";
import {
  assessLearnSessionCapacity,
  canCreateLearnVersion,
  MAX_LEARN_SESSION_VERSIONS,
} from "@/lib/learn/learnSessionCapacity";
import { orderPracticeCardsForVersion } from "@/lib/learn/orderPracticeCardsForVersion";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { buildPracticeSessionCardsFromLearn } from "@/lib/learn/practiceSessionTypes";
import type { PracticeRetentionSummary } from "@/lib/learn/retentionTypes";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import type { DocumentProfileMetadata } from "@/types/intelligence";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";
import { AnalysisResultView } from "./AnalysisResultView";
import { LearnSection } from "./LearnSection";
import {
  ResultsSectionTabs,
  scrollToResultsSection,
  type ResultsSectionId,
} from "./ResultsSectionTabs";

type LearnVersionRecord = {
  version: number;
  focusThemes: string[];
  remountKey: number;
};

type LearnVersionStats = {
  gotItCount: number;
  reviewAgainCount: number;
  summary: PracticeRetentionSummary | null;
};

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
  extractedCharacters?: number | null;
  estimatedPages?: number | null;
  slideCount?: number | null;
  sourceQuality?: DocumentProfileMetadata["sourceQuality"] | null;
  sourceQualityNote?: string | null;
  footerContent?: ReactNode;
};

function SessionModuleToolbar({
  title,
  tone,
  collapsed,
  onToggleCollapse,
  onRestart,
  restartLabel,
}: {
  title: string;
  tone: "sky" | "violet";
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRestart?: () => void;
  restartLabel?: string;
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-400/25 bg-sky-500/15 text-sky-50 hover:bg-sky-500/25"
      : "border-violet-400/25 bg-violet-500/15 text-violet-50 hover:bg-violet-500/25";

  return (
    <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
      <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {title}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        {onRestart ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRestart();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${toneClass}`}
            title={restartLabel ?? "Restart"}
            aria-label={restartLabel ?? "Restart"}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Restart
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleCollapse();
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${toneClass}`}
          title={collapsed ? "Show module" : "Hide module"}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show module" : "Hide module"}
        >
          {collapsed ? (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>
    </div>
  );
}

function LearnVersionTabs({
  versions,
  activeVersion,
  canAdd,
  capacityNote,
  maxVersions,
  collapsed,
  onSelect,
  onAdd,
  onRestart,
  onToggleCollapse,
}: {
  versions: LearnVersionRecord[];
  activeVersion: number;
  canAdd: boolean;
  capacityNote: string | null;
  maxVersions: number;
  collapsed: boolean;
  onSelect: (version: number) => void;
  onAdd: () => void;
  onRestart: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="mb-3 min-w-0 space-y-2" data-learn-version-tabs>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {versions.map((entry) => {
          const active = entry.version === activeVersion;
          return (
            <button
              key={entry.version}
              type="button"
              onClick={() => onSelect(entry.version)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? "border-sky-400/35 bg-sky-500/20 text-sky-50"
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-sky-400/20 hover:text-sky-100"
              }`}
              aria-pressed={active}
            >
              Learn {entry.version}
              {entry.focusThemes.length > 0 ? (
                <span className="ml-1 text-[9px] text-amber-200/80">· focus</span>
              ) : null}
            </button>
          );
        })}
        {canAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-sky-400/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-100 transition-colors hover:bg-sky-500/15"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Learn {versions.length + 1}
          </button>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="hidden text-[10px] tabular-nums text-zinc-600 sm:inline">
            {versions.length}/{Math.min(maxVersions, MAX_LEARN_SESSION_VERSIONS)}
          </span>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-medium text-sky-50 transition-colors hover:bg-sky-500/25"
            title="Restart this Learn version"
            aria-label="Restart this Learn version"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Restart
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-medium text-sky-50 transition-colors hover:bg-sky-500/25"
            title={collapsed ? "Show Learn session" : "Hide Learn session"}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show Learn session" : "Hide Learn session"}
          >
            {collapsed ? (
              <Eye className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
            )}
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>
      {capacityNote && versions.length >= maxVersions ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{capacityNote}</p>
      ) : null}
    </div>
  );
}

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
  extractedCharacters = null,
  estimatedPages = null,
  slideCount = null,
  sourceQuality = null,
  sourceQualityNote = null,
  footerContent,
}: SummaryLearnResultsPanelProps) {
  const [quizActive, setQuizActive] = useState(false);
  const [learnStarted, setLearnStarted] = useState(false);
  const [learnCollapsed, setLearnCollapsed] = useState(false);
  const [quizCollapsed, setQuizCollapsed] = useState(false);
  const [quizSessionKey, setQuizSessionKey] = useState(0);
  const [activeSection, setActiveSection] = useState<ResultsSectionId>("summary");
  const [learnVersions, setLearnVersions] = useState<LearnVersionRecord[]>([
    { version: 1, focusThemes: [], remountKey: 0 },
  ]);
  const [activeLearnVersion, setActiveLearnVersion] = useState(1);
  const [learnStatsByVersion, setLearnStatsByVersion] = useState<
    Record<number, LearnVersionStats>
  >({});

  const cardAccess = useMemo(
    () => getPracticeCardAccessForPlan(entitlementPlanId, result.learnCards),
    [entitlementPlanId, result.learnCards],
  );

  const basePracticeCards = useMemo(
    () =>
      cardAccess.accessibleCount > 0
        ? buildPracticeSessionCardsFromLearn(cardAccess.accessibleCards)
        : [],
    [cardAccess.accessibleCards, cardAccess.accessibleCount],
  );

  const capacity = useMemo(
    () =>
      assessLearnSessionCapacity({
        extractedCharacters,
        estimatedPages,
        slideCount,
        sourceQuality,
        sourceQualityNote,
        learnCardCount: basePracticeCards.length,
      }),
    [
      basePracticeCards.length,
      estimatedPages,
      extractedCharacters,
      slideCount,
      sourceQuality,
      sourceQualityNote,
    ],
  );

  const canAddLearnVersion = canCreateLearnVersion(capacity, learnVersions.length);

  const activeVersionRecord =
    learnVersions.find((entry) => entry.version === activeLearnVersion) ?? learnVersions[0];

  const practiceCards = useMemo(
    () =>
      orderPracticeCardsForVersion(basePracticeCards, {
        version: activeVersionRecord.version,
        focusThemes: activeVersionRecord.focusThemes,
      }),
    [activeVersionRecord.focusThemes, activeVersionRecord.version, basePracticeCards],
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
        variantSeed: `learn-v${activeLearnVersion}-quiz-${quizSessionKey}`,
        intelligenceModeId: modeId,
      }),
    [
      activeLearnVersion,
      cardAccess.accessibleCards,
      cardAccess.isLimited,
      quizSessionKey,
      result,
      modeId,
    ],
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
  const hasLearn = basePracticeCards.length > 0;
  const hasInsights = result.keyInsights.length > 0;
  const hasQuiz = quizQuestions.length > 0;
  const flashcardCount = result.learnCards.filter(
    (card) => !card.isLockedPreview && card.type !== "quiz",
  ).length;
  const hasFlashcards = flashcardCount > 0;
  const activeLearnStats = learnStatsByVersion[activeLearnVersion];

  const sectionTabs = useMemo(() => {
    const tabs: ResultsSectionId[] = ["summary"];
    if (hasInsights) tabs.push("insights");
    if (hasFlashcards) tabs.push("flashcards");
    return tabs;
  }, [hasFlashcards, hasInsights]);

  const practiceTabs = useMemo((): ResultsSectionId[] => {
    const tabs: ResultsSectionId[] = [];
    if (hasLearn) tabs.push("learn");
    tabs.push("quiz");
    return tabs;
  }, [hasLearn]);

  const readingTabs = useMemo(
    () =>
      sectionTabs.filter(
        (id) => id === "summary" || id === "insights" || id === "flashcards",
      ),
    [sectionTabs],
  );

  function handleNavigate(id: ResultsSectionId) {
    setActiveSection(id);
    if (id === "learn") setLearnCollapsed(false);
    if (id === "quiz") setQuizCollapsed(false);
    scrollToResultsSection(id);
  }

  function focusLearnSection() {
    setLearnCollapsed(false);
    setLearnStarted(true);
    setActiveSection("learn");
    requestAnimationFrame(() => scrollToResultsSection("learn"));
  }

  function handleStartLearn(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    focusLearnSection();
  }

  function handleStartQuiz(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    setQuizCollapsed(false);
    setQuizActive(true);
    setActiveSection("quiz");
    requestAnimationFrame(() => scrollToResultsSection("quiz"));
  }

  function handleRestartLearn(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    setLearnVersions((prev) =>
      prev.map((entry) =>
        entry.version === activeLearnVersion
          ? { ...entry, remountKey: entry.remountKey + 1 }
          : entry,
      ),
    );
    focusLearnSection();
  }

  function createLearnVersion(focusThemes: string[] = []) {
    if (!canAddLearnVersion) return;
    const nextVersion = learnVersions.length + 1;
    setLearnVersions((prev) => [
      ...prev,
      { version: nextVersion, focusThemes, remountKey: 0 },
    ]);
    setActiveLearnVersion(nextVersion);
    focusLearnSection();
  }

  function handleStartFocusedLearn(weakConcepts: string[]) {
    createLearnVersion(weakConcepts);
  }

  function handleRestartQuiz(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    setQuizCollapsed(false);
    setQuizActive(true);
    setQuizSessionKey((key) => key + 1);
    setActiveSection("quiz");
    requestAnimationFrame(() => scrollToResultsSection("quiz"));
  }

  function handleLearnComplete(summary: PracticeRetentionSummary) {
    const gotItCount = summary.cardStates.reduce((n, s) => n + s.gotItCount, 0);
    const reviewAgainCount = summary.cardStates.reduce((n, s) => n + s.reviewAgainCount, 0);
    setLearnStatsByVersion((prev) => ({
      ...prev,
      [activeLearnVersion]: { gotItCount, reviewAgainCount, summary },
    }));
  }

  const bothReady = !learnStarted && !quizActive;

  return (
    <section className="min-w-0 max-w-full space-y-4" data-summary-learn-results>
      {/* Single card: tabs + active panel (no floating tab strip). */}
      {readingTabs.length > 0 ? (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141d]/80">
          <ResultsSectionTabs
            sections={readingTabs}
            activeId={
              activeSection === "summary" ||
              activeSection === "insights" ||
              activeSection === "flashcards"
                ? activeSection
                : "summary"
            }
          onNavigate={(id) => {
            setActiveSection(id);
            if (id === "summary" || id === "insights" || id === "flashcards") {
              setLearnStarted(false);
              setQuizActive(false);
            }
          }}
            ariaLabel="Reading sections"
          />

          {activeSection === "summary" && readingTabs.includes("summary") ? (
            <div
              id="result-section-summary"
              className="min-w-0 p-3 sm:p-5"
              role="tabpanel"
            >
              <AnalysisResultView
                result={result}
                modeId={modeId}
                providerUsed={providerUsed}
                fallbackUsed={fallbackUsed}
                uiSectionLabels={uiSectionLabels}
                entitlementPlanId={entitlementPlanId}
                sections="summary"
                extractedCharacters={extractedCharacters}
                embedded
                showHeader={false}
                showToolbar={false}
              />
            </div>
          ) : null}

          {activeSection === "insights" && hasInsights ? (
            <div
              id="result-section-insights"
              className="min-w-0 p-3 sm:p-5"
              role="tabpanel"
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

          {activeSection === "flashcards" && hasFlashcards ? (
            <div
              id="result-section-flashcards"
              className="min-w-0 p-3 sm:p-5"
              role="tabpanel"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-fuchsia-300" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">Study cards</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">
                    {flashcardCount} card{flashcardCount === 1 ? "" : "s"}
                  </span>
                  {hasLearn ? (
                    <button
                      type="button"
                      onClick={handleStartLearn}
                      className="rounded-lg bg-violet-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-400"
                    >
                      Practice
                    </button>
                  ) : null}
                </div>
              </div>
              <LearnSection
                cards={result.learnCards}
                modeId={modeId}
                entitlementPlanId={entitlementPlanId}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {bothReady ? (
        <div
          className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between"
          data-results-practice-cta
        >
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">Practice these ideas</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {hasLearn
                ? `${basePracticeCards.length} recall prompts from this analysis.`
                : "No Learn cards were generated for this analysis."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={!hasLearn}
              onClick={handleStartLearn}
              className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Practice
            </button>
            <button
              type="button"
              disabled={!hasQuiz}
              onClick={handleStartQuiz}
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.1] bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/[0.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Take quiz
            </button>
          </div>
        </div>
      ) : (
        <>
          <ResultsSectionTabs
            sections={practiceTabs}
            activeId={
              activeSection === "learn" || activeSection === "quiz" ? activeSection : undefined
            }
            onNavigate={handleNavigate}
            ariaLabel="Practice sections"
          />
          <div className="grid min-w-0 grid-cols-1 gap-3">
            {learnStarted ? (
              <section
                id="result-section-learn"
                className="min-w-0 overflow-visible rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-950/40 via-[#0f1520]/95 to-zinc-950 p-3 sm:p-5"
              >
                <LearnVersionTabs
                  versions={learnVersions}
                  activeVersion={activeLearnVersion}
                  canAdd={canAddLearnVersion}
                  capacityNote={capacity.reason}
                  maxVersions={capacity.maxVersions}
                  collapsed={learnCollapsed}
                  onSelect={(version) => {
                    setActiveLearnVersion(version);
                    setLearnCollapsed(false);
                  }}
                  onAdd={() => createLearnVersion([])}
                  onRestart={() => handleRestartLearn()}
                  onToggleCollapse={() => setLearnCollapsed((value) => !value)}
                />
                {learnCollapsed ? (
                  <p className="text-xs text-zinc-500">
                    Learn session hidden. Tap Show to continue where you left off.
                  </p>
                ) : hasLearn ? (
                  <AnalysisPracticeSession
                    key={`learn-v${activeVersionRecord.version}-r${activeVersionRecord.remountKey}`}
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
                    onLearnComplete={handleLearnComplete}
                    onStartQuiz={handleStartQuiz}
                  />
                ) : null}
              </section>
            ) : null}

            {quizActive ? (
              <section
                id="result-section-quiz"
                className="min-w-0 overflow-visible rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/45 via-[#14101f]/90 to-zinc-950 p-3 sm:p-5"
              >
                <SessionModuleToolbar
                  title="Quiz session"
                  tone="violet"
                  collapsed={quizCollapsed}
                  onToggleCollapse={() => setQuizCollapsed((value) => !value)}
                  onRestart={handleRestartQuiz}
                  restartLabel="Restart quiz from the first question"
                />
                {quizCollapsed ? (
                  <p className="text-xs text-zinc-500">
                    Quiz hidden. Tap Show to continue, or Restart to begin from question 1.
                  </p>
                ) : (
                  <AnalysisQuizSession
                    key={`quiz-${quizSessionKey}-v${activeLearnVersion}`}
                    analysisId={analysisId}
                    documentTitle={result.title}
                    questions={quizQuestions}
                    retentionSummary={activeLearnStats?.summary ?? null}
                    gotItCount={activeLearnStats?.gotItCount ?? 0}
                    reviewAgainCount={activeLearnStats?.reviewAgainCount ?? 0}
                    lockedQuizCount={cardAccess.lockedCount}
                    entitlementPlanId={entitlementPlanId}
                    isPaidActive={isPaidActive}
                    audioStudyInput={audioStudyInput}
                    initialPhase="question"
                    hideWorkspaceLinks
                    onRestartLearn={handleRestartLearn}
                    onStartFocusedLearn={handleStartFocusedLearn}
                    canCreateLearnVersion={canAddLearnVersion}
                    learnCapacityNote={capacity.reason}
                  />
                )}
              </section>
            ) : null}
          </div>
        </>
      )}

      {footerContent}
    </section>
  );
}
