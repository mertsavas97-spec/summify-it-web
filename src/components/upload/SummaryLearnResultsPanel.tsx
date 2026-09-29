"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useRef, useCallback, type MouseEvent, type ReactNode } from "react";
import {
  Eye,
  EyeOff,
  Layers,
  Network,
  Plus,
  RotateCcw,
  Lock,
} from "lucide-react";
import { AnalysisPracticeSession } from "@/components/learn/AnalysisPracticeSession";
import { AnalysisQuizSession } from "@/components/learn/AnalysisQuizSession";
import { MindMapSkeleton } from "@/components/mindmap/MindMapSkeleton";
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
import { uniqueLearnCards } from "@/lib/learn/uniqueLearnCards";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import { quizQuestionTargetForChars } from "@/server/intelligence/sourceOutputQuota";
import { planHasFeature } from "@/lib/plan-features";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import type { DocumentProfileMetadata } from "@/types/intelligence";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";
import type { QuizQuestion } from "@/types/learn-quiz";
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

/** Lazy: React Flow only loads when the Mind map tab is opened. */
const MindMapPanel = dynamic(
  () => import("@/components/mindmap/MindMapPanel").then((m) => m.MindMapPanel),
  { ssr: false, loading: () => <MindMapSkeleton /> },
);

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
  onQuizAvailabilityChange?: (available: boolean) => void;
  focusQuiz?: boolean;
  onFocusQuizHandled?: () => void;
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
  onQuizAvailabilityChange,
  focusQuiz = false,
  onFocusQuizHandled,
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

  // Remote quiz (LLM-generated) state
  const [remoteQuiz, setRemoteQuiz] = useState<QuizQuestion[] | null>(null);
  const [remoteQuizStatus, setRemoteQuizStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const remoteQuizFetchedRef = useRef(false);

  const cardAccess = useMemo(
    () =>
      getPracticeCardAccessForPlan(
        entitlementPlanId,
        uniqueLearnCards(result.learnCards),
      ),
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
        maxQuestions: quizQuestionTargetForChars(extractedCharacters),
        variantSeed: `learn-v${activeLearnVersion}-quiz-${quizSessionKey}`,
        intelligenceModeId: modeId,
      }),
    [
      activeLearnVersion,
      cardAccess.accessibleCards,
      extractedCharacters,
      quizSessionKey,
      result,
      modeId,
    ],
  );

  // Fetch remote quiz — uses refs to avoid stale closures and missing deps
  const fetchRemoteQuiz = useCallback(async () => {
    if (remoteQuizStatus !== "idle") return;
    setRemoteQuizStatus("loading");
    try {
      const maxQ = quizQuestionTargetForChars(extractedCharacters);
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          summary: result.summary,
          keyInsights: result.keyInsights,
          risksOrWarnings: result.risksOrWarnings,
          learnCards: cardAccess.accessibleCards.map((c) => ({
            type: c.type,
            title: c.title,
            content: c.content,
          })),
          count: maxQ,
          provider: providerUsed === "gemini" ? "gemini" : "groq",
        }),
      });
      if (!res.ok) throw new Error("Quiz API failed");
      const data = await res.json();
      if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
        // Map raw questions to QuizQuestion shape
        const mapped: QuizQuestion[] = data.questions.map(
          (q: { question: string; options: string[]; correctIndex: number; explanation: string }, idx: number) => ({
            id: `quiz-remote-${idx}`,
            question: q.question,
            options: q.options.map((opt: string, oi: number) => ({
              key: (["A", "B", "C", "D"] as const)[oi],
              text: opt,
            })),
            correctOptionKey: (["A", "B", "C", "D"] as const)[q.correctIndex],
            explanation: q.explanation,
            difficulty: "medium" as const,
            theme: q.question.split(" ")[0]?.toLowerCase() ?? `q${idx}`,
          }),
        );
        setRemoteQuiz(mapped);
        setRemoteQuizStatus("ready");
      } else {
        setRemoteQuizStatus("error");
      }
    } catch {
      setRemoteQuizStatus("error");
    }
  }, [
    remoteQuizStatus,
    extractedCharacters,
    result.title,
    result.summary,
    result.keyInsights,
    result.risksOrWarnings,
    cardAccess.accessibleCards,
    providerUsed,
  ]);

  // Merge remote (LLM) quiz with local fallback — remote takes priority
  const mergedQuizQuestions = useMemo((): QuizQuestion[] => {
    if (!remoteQuiz || remoteQuiz.length === 0) return quizQuestions;
    const local = quizQuestions;
    const seen = new Set<string>();
    const norm = (q: QuizQuestion) =>
      q.question.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/, "");
    for (const q of remoteQuiz) seen.add(norm(q));
    const combined: QuizQuestion[] = [...remoteQuiz];
    for (const q of local) {
      if (combined.length >= quizQuestionTargetForChars(extractedCharacters)) break;
      if (!seen.has(norm(q))) combined.push(q);
    }
    return combined;
  }, [remoteQuiz, quizQuestions, extractedCharacters]);

  // Fetch remote quiz lazily on first quiz access or after a short delay on mount
  useEffect(() => {
    if (remoteQuizFetchedRef.current || remoteQuizStatus !== "idle") return;
    // Start fetch after a short delay so the analysis result renders first
    const timer = setTimeout(() => {
      remoteQuizFetchedRef.current = true;
      fetchRemoteQuiz();
    }, 1200);
    return () => clearTimeout(timer);
  }, [fetchRemoteQuiz, remoteQuizStatus]);

  // Also fetch immediately when user explicitly starts quiz
  const ensureRemoteQuiz = useCallback(() => {
    if (remoteQuizStatus === "idle" && !remoteQuizFetchedRef.current) {
      remoteQuizFetchedRef.current = true;
      fetchRemoteQuiz();
    }
  }, [fetchRemoteQuiz, remoteQuizStatus]);

  const audioStudyInput = useMemo(
    () =>
      buildAudioStudyInputFromResult(result, {
        sourceType,
        intelligenceMode: modeId,
        sourceLabel,
        quizThemes: mergedQuizQuestions.map((q) => q.theme).filter(Boolean) as string[],
      }),
    [modeId, mergedQuizQuestions, result, sourceLabel, sourceType],
  );

  const analysisId = savedAnalysisId ?? "live-analysis";
  const hasLearn = basePracticeCards.length > 0;
  const hasInsights = result.keyInsights.length > 0;
  const hasQuiz = mergedQuizQuestions.length > 0;
  const activeLearnStats = learnStatsByVersion[activeLearnVersion];

  // Notify parent about quiz availability for the external Quiz button
  useEffect(() => {
    onQuizAvailabilityChange?.(hasQuiz);
  }, [hasQuiz, onQuizAvailabilityChange]);

  // Handle external focusQuiz request (from Quiz button above tab bar)
  useEffect(() => {
    if (focusQuiz && hasQuiz) {
      handleNavigate("quiz");
      onFocusQuizHandled?.();
    }
  }, [focusQuiz, hasQuiz, onFocusQuizHandled]);

  const sectionTabs = useMemo(() => {
    const tabs: ResultsSectionId[] = ["summary"];
    if (hasInsights) tabs.push("insights");
    // Study cards stays mounted even when card generation produced nothing, so
    // the section renders an empty state instead of silently disappearing.
    tabs.push("flashcards");
    return tabs;
  }, [hasInsights]);

  /** Mind map is independent of the flashcards tab — always available if content exists. */
  const hasMindMap =
    result.summary.trim().length > 0 ||
    hasInsights ||
    result.actionItems.length > 0 ||
    result.risksOrWarnings.length > 0;

  /** Check if user's plan includes mind map feature. */
  const mindMapAccess = planHasFeature(entitlementPlanId, "mindMapEnabled");

  const mindMapInput = useMemo(
    () => ({
      title: result.title,
      summary: result.summary,
      keyInsights: result.keyInsights,
      risksOrWarnings: result.risksOrWarnings,
      actionItems: result.actionItems,
      learnCards: result.learnCards
        .filter((card) => !card.isLockedPreview)
        .map((card) => ({
          type: card.type,
          title: card.title ?? "",
          content: card.content ?? "",
        })),
      sourceKind: sourceType,
      intelligenceMode: modeId,
      sourceChars: extractedCharacters,
    }),
    [extractedCharacters, modeId, result, sourceType],
  );

  const practiceTabs = useMemo((): ResultsSectionId[] => {
    const tabs: ResultsSectionId[] = [];
    if (hasLearn) tabs.push("learn");
    if (hasQuiz) tabs.push("quiz");
    return tabs;
  }, [hasLearn, hasQuiz]);

  const readingTabs = useMemo((): ResultsSectionId[] => {
    const tabs = sectionTabs.filter(
      (id) => id === "summary" || id === "insights" || id === "flashcards",
    ) as ResultsSectionId[];
    if (hasMindMap) tabs.push("mindmap");
    return tabs;
  }, [hasMindMap, sectionTabs]);

  function handleNavigate(id: ResultsSectionId) {
    setActiveSection(id);
    // Tab visibility is driven by activeSection, but a session only renders
    // once it has been started — clicking a practice tab must mount it too,
    // otherwise the tab highlights while the other panel stays on screen.
    if (id === "learn") {
      setLearnStarted(true);
      setLearnCollapsed(false);
    }
    if (id === "quiz") {
      setQuizActive(true);
      setQuizCollapsed(false);
    }
    // Scroll after commit: the target panel may be mounting right now.
    requestAnimationFrame(() => scrollToResultsSection(id));
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
    ensureRemoteQuiz();
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
              activeSection === "flashcards" ||
              activeSection === "mindmap"
                ? activeSection
                : "summary"
            }
          onNavigate={(id) => {
            setActiveSection(id);
            if (
              id === "summary" ||
              id === "insights" ||
              id === "flashcards" ||
              id === "mindmap"
            ) {
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

          {activeSection === "flashcards" ? (
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
              {result.learnCards.length > 0 ? (
                <LearnSection
                  cards={result.learnCards}
                  modeId={modeId}
                  entitlementPlanId={entitlementPlanId}
                />
              ) : (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-zinc-400">
                  <p className="font-medium text-zinc-200">
                    Study cards could not be generated for this analysis.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Summary, key insights, quiz and the mind map are unaffected. Run the
                    analysis again to generate study cards.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeSection === "mindmap" && hasMindMap ? (
            <div
              id="result-section-mindmap"
              className="min-w-0 p-3 sm:p-5"
              role="tabpanel"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Network className="h-4 w-4 text-cyan-300" aria-hidden />
                <h3 className="text-sm font-semibold text-white">Mind map</h3>
                <span className="text-[11px] text-zinc-500">
                  Built from this analysis · lens: {modeLabel}
                </span>
                {!mindMapAccess && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-500/15 text-violet-300 px-2 py-0.5 text-[10px] font-semibold">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    Pro
                  </span>
                )}
              </div>
              <div className="relative">
                {!mindMapAccess ? (
                  <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center rounded-xl border border-white/[0.06] z-10">
                    <div className="text-center p-6">
                      <Lock className="mx-auto h-8 w-8 text-zinc-400" aria-hidden />
                      <p className="mt-3 text-sm font-medium text-zinc-200">Mind map is a Pro feature</p>
                      <p className="mt-1 text-xs text-zinc-500">Upgrade to explore interactive concept graphs</p>
                    </div>
                  </div>
                ) : null}
                <MindMapPanel active {...mindMapInput} />
              </div>
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
                className={`min-w-0 overflow-visible rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-950/40 via-[#0f1520]/95 to-zinc-950 p-3 sm:p-5${
                  activeSection === "learn" ? "" : " hidden"
                }`}
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
                className={`min-w-0 overflow-visible rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/45 via-[#14101f]/90 to-zinc-950 p-3 sm:p-5${
                  activeSection === "quiz" ? "" : " hidden"
                }`}
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
                ) : remoteQuizStatus === "loading" ? (
                  <div className="flex items-center justify-center py-12 text-zinc-400">
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-violet-400" viewBox="0 0 24 24" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                        <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" />
                      </svg>
                      <span className="text-sm font-medium">Building your quiz from this source…</span>
                    </div>
                  </div>
                ) : (
                  <AnalysisQuizSession
                    key={`quiz-${quizSessionKey}-v${activeLearnVersion}`}
                    analysisId={analysisId}
                    documentTitle={result.title}
                    questions={mergedQuizQuestions}
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
