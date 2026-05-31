"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Headphones,
  HelpCircle,
  Mic,
  type LucideIcon,
} from "lucide-react";
import type { IntelligenceModeDefinition } from "@/types/modes";
import { Badge } from "@/components/ui/Badge";
import type { AnalysisResult } from "@/types/text-analysis";
import { getIntelligenceModeById } from "@/config/modes";
import type { IntelligenceModeId } from "@/types/modes";
import { getClientAnalysisInputLimits } from "@/lib/analysis-limits";
import { formatNumber } from "@/lib/format-number";
import {
  getExtractionSourceLabel,
  type ExtractionMetadata,
  type UploadExtractStatus,
  type WorkspaceInputMode,
} from "@/types/extraction";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import {
  buildPresentationSourceContext,
  buildYoutubeSourceContext,
} from "@/types/analyze-source";
import { trackEvent } from "@/lib/analytics/events";
import { trackMetaCustomEvent } from "@/lib/metaPixel";
import { runTextAnalysis } from "@/lib/run-text-analysis";
import { getModeAccessState } from "@/lib/mode-access";
import { canRunAnalysis } from "@/lib/mode-resolver";
import type { PlanId } from "@/types/plan";
import { USER_MESSAGES } from "@/lib/user-messages";
import { AnalysisResultView } from "./AnalysisResultView";
import { AnalysisToolbar } from "./AnalysisToolbar";
import { IntelligenceModeSelector } from "./IntelligenceModeSelector";
import {
  formatAttemptSummary,
  formatFailureReasonLabel,
} from "@/lib/analysis-debug-labels";
import type { AnalyzeApiDebugMetadata } from "@/types/text-analysis";
import type { PersonaUiSectionLabels } from "@/types/adaptive-analysis";
import { PlanUpgradeModal } from "@/components/pricing/PlanUpgradeModal";
import { WorkspaceSaveBanner } from "./WorkspaceSaveBanner";
import type { InjectedAnalysisPayload } from "./UploadWorkspace";
import { AnalysisQuizSession } from "@/components/learn/AnalysisQuizSession";
import { generateAnalysisQuiz } from "@/lib/learn/generateAnalysisQuiz";
import { getPracticeCardAccessForPlan } from "@/lib/learn/practiceCardAccess";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import { DEFAULT_POLLY_VOICE_ID } from "@/lib/audio-study/pollyVoices";

type TextAnalysisMvpProps = {
  rawText: string;
  onRawTextChange: (text: string) => void;
  mode: IntelligenceModeId;
  onModeChange: (mode: IntelligenceModeId) => void;
  inputMode: WorkspaceInputMode;
  extractStatus: UploadExtractStatus;
  extractionMeta: ExtractionMetadata | null;
  analyzeDisabled?: boolean;
  hidePrimaryAnalyze?: boolean;
  youtubeAnalysisFailed?: boolean;
  urlAnalysisFailed?: boolean;
  onRetryYoutubeAnalysis?: () => Promise<void>;
  onRetryUrlAnalysis?: () => Promise<void>;
  injectedAnalysis?: InjectedAnalysisPayload | null;
  onAnalyzingChange?: (analyzing: boolean) => void;
  onAnalysisComplete?: (completed: boolean) => void;
  onAnalysisResultChange?: (result: AnalysisResult | null) => void;
  onSavedAnalysisIdChange?: (analysisId: string | null) => void;
  onIntelligenceReady?: (metadata: AnalysisIntelligenceMetadata | null) => void;
  onAnalyzeReady?: (handler: () => void) => void;
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive?: boolean;
  limitNotice?: string | null;
  /** Invoked when analysis is blocked due to paywall/quota. (e.g. free daily limit reached) */
  onPaywall?: () => void;
  actionModules?: ReactNode;
  practiceModule?: ReactNode;
  renderPracticeModule?: (options: {
    learnComplete: boolean;
    onLearnCompleteChange: (complete: boolean) => void;
    onStartQuiz: () => void;
  }) => ReactNode;
  mediaModules?: (view: "audio" | "podcast") => ReactNode;
  /** Keep analysis wiring mounted while another source-ready shell owns the pre-analysis UI. */
  deferUntilAnalysisActive?: boolean;
  /** When true, the PracticeAnalysisCta is not rendered (caller will render it separately). */
  hidePracticeCta?: boolean;
};

type ResultTabId = "summary" | "learn" | "quiz" | "audio" | "podcast";

type ResultTabTone = "base" | "audio" | "podcast";

const RESULT_TABS: {
  id: ResultTabId;
  label: string;
  eyebrow?: string;
  icon: LucideIcon;
  premium?: "audio" | "podcast";
}[] = [
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "learn", label: "Learn", icon: BrainCircuit },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "audio", label: "Audio lesson", eyebrow: "Listen", icon: Headphones, premium: "audio" },
  { id: "podcast", label: "Podcast", eyebrow: "Discuss", icon: Mic, premium: "podcast" },
];

function ExtractedTextEditor({
  rawText,
  onRawTextChange,
  rows,
  truncated,
  label = "Document text",
  inputLimits,
}: {
  rawText: string;
  onRawTextChange: (text: string) => void;
  rows: number;
  truncated?: boolean;
  label?: string;
  inputLimits: ReturnType<typeof getClientAnalysisInputLimits>;
}) {
  const charCount = rawText.trim().length;

  return (
    <label className="mt-3 block" data-workspace-extracted-text-editor>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <textarea
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        rows={rows}
        placeholder="Upload a file to extract text, or paste at least 100 characters…"
        className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
      />
      <p className="mt-1 text-[10px] text-zinc-600">
        {formatNumber(charCount)} / {formatNumber(inputLimits.maxChars)} plan
        limit · min {formatNumber(inputLimits.minChars)}
        {truncated && (
          <span className="text-amber-400/80"> · prioritized for your plan</span>
        )}
      </p>
    </label>
  );
}

function getExtractionKey(metadata: ExtractionMetadata): string {
  if (metadata.sourceKind === "url") return metadata.sourceUrl;
  if (metadata.sourceKind === "youtube") return metadata.videoId;
  return `${metadata.fileType}:${metadata.fileName}`;
}

function CompactExtractReady({
  rawText,
  onRawTextChange,
  extractionMeta,
  inputLimits,
  variant = "file",
}: {
  rawText: string;
  onRawTextChange: (text: string) => void;
  extractionMeta: ExtractionMetadata;
  inputLimits: ReturnType<typeof getClientAnalysisInputLimits>;
  variant?: "file" | "youtube" | "article";
}) {
  const [expanded, setExpanded] = useState(false);
  const charCount = rawText.trim().length;
  const isYoutube = variant === "youtube";
  const isArticle = variant === "article";

  return (
    <div
      className={`mt-4 rounded-xl border px-3 py-2.5 ${
        isYoutube
          ? "border-white/[0.07] bg-white/[0.025]"
          : isArticle
            ? "border-white/[0.07] bg-white/[0.025]"
            : "border-emerald-500/20 bg-emerald-950/10"
      }`}
      data-workspace-extract-ready
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`text-xs font-medium ${
              isYoutube
                ? "text-red-200/90"
                : isArticle
                  ? "text-sky-200/90"
                  : "text-emerald-200"
            }`}
          >
            {isYoutube
              ? "Transcript ready"
              : isArticle
                ? "Article ready"
                : "Extracted text ready"}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {formatNumber(charCount)} characters
            {extractionMeta.truncated && (
              <span className="text-amber-400/80"> · truncated</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-md border border-white/[0.08] bg-zinc-950/60 px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:border-violet-500/30 hover:text-violet-200"
          aria-expanded={expanded}
        >
          {expanded
            ? isYoutube
              ? "Hide transcript"
              : isArticle
                ? "Hide article text"
                : "Hide extracted text"
            : isYoutube
              ? "View / edit transcript"
              : isArticle
                ? "View / edit article text"
                : "View / edit extracted text"}
        </button>
      </div>
      {expanded && (
        <ExtractedTextEditor
          rawText={rawText}
          onRawTextChange={onRawTextChange}
          rows={5}
          truncated={extractionMeta.truncated}
          inputLimits={inputLimits}
          label={isYoutube ? "Transcript" : isArticle ? "Article text" : "Document text"}
        />
      )}
    </div>
  );
}

function getResultSourceTitle({
  extractionMeta,
  inputMode,
  result,
}: {
  extractionMeta: ExtractionMetadata | null;
  inputMode: WorkspaceInputMode;
  result: AnalysisResult;
}) {
  if (extractionMeta) return getExtractionSourceLabel(extractionMeta) || result.title;
  if (inputMode === "text") return "Pasted text";
  return result.title;
}

function getSourceKindLabel(inputMode: WorkspaceInputMode, extractionMeta: ExtractionMetadata | null) {
  if (inputMode === "text") return "Text";
  if (extractionMeta?.sourceKind === "youtube") return "YouTube";
  if (extractionMeta?.sourceKind === "url") return "Article";
  if (extractionMeta?.sourceKind === "presentation") return "Presentation";
  return "File";
}

function estimateReadingTime(result: AnalysisResult) {
  const text = [
    result.summary,
    ...result.keyInsights,
    ...result.risksOrWarnings,
    ...result.actionItems,
  ].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function getSourceDomain(extractionMeta: ExtractionMetadata | null): string | null {
  if (extractionMeta?.sourceKind !== "url") return null;
  try {
    return new URL(extractionMeta.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getResultMetadataChips({
  result,
  modeLabel,
  providerUsed,
  fallbackUsed,
  complexity,
  extractionMeta,
}: {
  result: AnalysisResult;
  modeLabel: string;
  providerUsed: string;
  fallbackUsed: boolean;
  complexity: string | null;
  extractionMeta: ExtractionMetadata | null;
}): string[] {
  const chips = [`Mode: ${modeLabel}`];
  if (extractionMeta?.sourceKind === "file") {
    chips.push(`${extractionMeta.estimatedPages} pages`);
  } else if (extractionMeta?.sourceKind === "presentation") {
    chips.push(`${extractionMeta.slideCount} slides`);
  } else if (extractionMeta?.sourceKind === "youtube" && extractionMeta.estimatedDurationMinutes) {
    chips.push(`${extractionMeta.estimatedDurationMinutes} min video`);
  } else {
    chips.push(estimateReadingTime(result));
  }
  if (complexity) chips.push(complexity);
  const domain = getSourceDomain(extractionMeta);
  if (domain) chips.push(domain);
  chips.push(`${providerUsed}${fallbackUsed ? " fallback" : ""}`);
  return chips;
}

function ResultTabButton({
  tab,
  active,
  accessLabel,
  tone = "base",
  onSelect,
}: {
  tab: (typeof RESULT_TABS)[number];
  active: boolean;
  accessLabel?: string;
  tone?: ResultTabTone;
  onSelect: (tab: ResultTabId) => void;
}) {
  const Icon = tab.icon;
  const isPremium = Boolean(tab.premium);

  const toneClasses: Record<ResultTabTone, { active: string; inactive: string; icon: string }> = {
    base: {
      active:
        "border-violet-400/35 bg-violet-500/12 text-violet-50 shadow-[0_0_22px_rgba(139,92,246,0.13)]",
      inactive:
        isPremium
          ? "border-violet-400/12 bg-violet-500/[0.035] text-zinc-300 hover:border-violet-400/25 hover:bg-violet-500/[0.07]"
          : "border-white/[0.06] bg-white/[0.018] text-zinc-400 hover:border-white/[0.11] hover:bg-white/[0.035] hover:text-zinc-200",
      icon: active || isPremium
        ? "border-violet-400/25 bg-violet-500/12 text-violet-200"
        : "border-white/[0.06] bg-black/20 text-zinc-500",
    },
    audio: {
      active:
        "border-sky-400/35 bg-sky-500/12 text-sky-50 shadow-[0_0_22px_rgba(56,189,248,0.14)]",
      inactive:
        "border-sky-400/15 bg-sky-500/[0.045] text-zinc-200 hover:border-sky-300/30 hover:bg-sky-500/[0.07]",
      icon: active
        ? "border-sky-300/35 bg-sky-500/15 text-sky-200"
        : "border-sky-400/18 bg-sky-950/35 text-sky-200/80",
    },
    podcast: {
      active:
        "border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-50 shadow-[0_0_22px_rgba(232,121,249,0.12)]",
      inactive:
        "border-fuchsia-400/15 bg-fuchsia-500/[0.04] text-zinc-200 hover:border-fuchsia-300/30 hover:bg-fuchsia-500/[0.065]",
      icon: active
        ? "border-fuchsia-300/30 bg-fuchsia-500/12 text-fuchsia-200"
        : "border-fuchsia-400/18 bg-fuchsia-950/35 text-fuchsia-200/80",
    },
  };

  const resolvedTone = toneClasses[tone];

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(tab.id)}
      className={`group relative min-w-0 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all ${
        active ? resolvedTone.active : resolvedTone.inactive
      }`}
    >
      {isPremium && (
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
          aria-hidden
        >
          <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl" />
        </span>
      )}
      <span className="relative flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${resolvedTone.icon}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            {tab.eyebrow ? (
              <span className="hidden text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-200/70 md:block">
                {tab.eyebrow}
              </span>
            ) : null}
            <span className="block truncate text-xs font-semibold sm:text-[13px]">{tab.label}</span>
          </span>
        </span>
        {accessLabel ? (
          <span
            className={`hidden rounded-full border px-1.5 py-0.5 text-[9px] font-medium lg:inline-flex ${
              accessLabel === "Included"
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                : "border-violet-400/18 bg-violet-500/10 text-violet-200"
            }`}
          >
            {accessLabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ContinueLearningStrip({ onSelect }: { onSelect: (tab: ResultTabId) => void }) {
  const items: { tab: ResultTabId; title: string; body: string }[] = [
    { tab: "learn", title: "Learn cards", body: "Practice the core ideas." },
    { tab: "quiz", title: "Quiz", body: "Check recall after practice." },
    { tab: "audio", title: "Audio lesson", body: "Listen to a teacher-style recap." },
    { tab: "podcast", title: "Podcast", body: "Generate a two-host discussion." },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Continue your learning</h3>
          <p className="text-xs text-zinc-500">Jump into the next layer without leaving this result.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onSelect(item.tab)}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition-colors hover:border-violet-400/20 hover:bg-violet-500/5"
          >
            <p className="text-xs font-medium text-zinc-200">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{item.body}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function QuizTabContent({
  result,
  modeId,
  sourceType,
  sourceLabel,
  entitlementPlanId,
  isPaidActive,
  learnComplete,
  onSelect,
}: {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  sourceType?: string | null;
  sourceLabel?: string | null;
  entitlementPlanId: PlanId;
  isPaidActive: boolean;
  learnComplete: boolean;
  onSelect: (tab: ResultTabId) => void;
}) {
  const quizCards = result.learnCards.filter((card) => card.type === "quiz" && !card.isLockedPreview);
  const cardAccess = useMemo(
    () => getPracticeCardAccessForPlan(entitlementPlanId, result.learnCards),
    [entitlementPlanId, result.learnCards],
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
  const quizUnlocked = learnComplete || quizCards.length > 0;
  const audioInput = useMemo(
    () =>
      buildAudioStudyInputFromResult(result, {
        sourceType,
        intelligenceMode: modeId,
        sourceLabel,
        quizThemes: quizQuestions.map((q) => q.theme).filter(Boolean) as string[],
      }),
    [modeId, quizQuestions, result, sourceLabel, sourceType],
  );

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
      <p className="text-sm font-semibold text-white">Quiz</p>
      {quizUnlocked && quizQuestions.length > 0 ? (
        <div className="mt-4">
          <AnalysisQuizSession
            analysisId="live-analysis"
            documentTitle={result.title}
            questions={quizQuestions}
            retentionSummary={null}
            gotItCount={0}
            reviewAgainCount={0}
            lockedQuizCount={cardAccess.lockedCount}
            entitlementPlanId={entitlementPlanId}
            isPaidActive={isPaidActive}
            audioStudyInput={audioInput}
            onRestartLearn={() => onSelect("learn")}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Complete your Learn cards to unlock the quiz.
          </p>
          <button
            type="button"
            onClick={() => onSelect("learn")}
            className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-400/25 hover:text-violet-100"
          >
            Go to Learn
          </button>
        </>
      )}
    </section>
  );
}

function PostAnalysisResultShell({
  result,
  modeId,
  extractionMeta,
  inputMode,
  providerUsed,
  fallbackUsed,
  uiSectionLabels,
  entitlementPlanId,
  isAuthenticated,
  isPaidActive,
  savedToWorkspace,
  learnModule,
  renderLearnModule,
  mediaModules,
}: {
  result: AnalysisResult;
  modeId: IntelligenceModeId;
  extractionMeta: ExtractionMetadata | null;
  inputMode: WorkspaceInputMode;
  providerUsed: string;
  fallbackUsed: boolean;
  uiSectionLabels?: PersonaUiSectionLabels;
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive: boolean;
  savedToWorkspace?: boolean;
  learnModule?: ReactNode;
  renderLearnModule?: (options: {
    learnComplete: boolean;
    onLearnCompleteChange: (complete: boolean) => void;
    onStartQuiz: () => void;
  }) => ReactNode;
  mediaModules?: (view: "audio" | "podcast") => ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<ResultTabId>("summary");
  const [learnComplete, setLearnComplete] = useState(false);
  const modeDef = getIntelligenceModeById(modeId);
  const sourceTitle = getResultSourceTitle({ extractionMeta, inputMode, result });
  const sourceKindLabel = getSourceKindLabel(inputMode, extractionMeta);
  // Audio/Podcast are now presented as "Included" in the Upload workspace UI.
  // Keep capability checks inside the actual media modules.
  const complexity = modeDef?.outputDepth
    ? `${modeDef.outputDepth[0].toUpperCase()}${modeDef.outputDepth.slice(1)} depth`
    : null;
  const modeLabel = modeDef?.label ?? modeId;
  const metadataChips = getResultMetadataChips({
    result,
    modeLabel,
    providerUsed,
    fallbackUsed,
    complexity,
    extractionMeta,
  });
  const resolvedLearnModule =
    renderLearnModule
      ? renderLearnModule({
          learnComplete,
          onLearnCompleteChange: setLearnComplete,
          onStartQuiz: () => setActiveTab("quiz"),
        })
      : learnModule;
  const [guestAudioPreviewState, setGuestAudioPreviewState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [guestAudioPreview, setGuestAudioPreview] = useState<{
    title: string;
    durationEstimate: string;
    script: string;
    audioUrl?: string;
    audioBase64?: string;
    audioMime?: string;
  } | null>(null);
  const [guestAudioPreviewError, setGuestAudioPreviewError] = useState<string | null>(null);
  const guestPreviewSrc = guestAudioPreview?.audioUrl
    ?? (guestAudioPreview?.audioBase64
      ? `data:${guestAudioPreview.audioMime ?? "audio/mpeg"};base64,${guestAudioPreview.audioBase64}`
      : null);
  const guestAudioPreviewPlayable = Boolean(guestPreviewSrc);

  useEffect(() => {
    if (isAuthenticated) return;
    if (guestAudioPreviewState === "ready" || guestAudioPreviewState === "generating") return;

    const generateGuestPreview = async () => {
      setGuestAudioPreviewState("generating");
      setGuestAudioPreviewError(null);
      try {
        const input = buildAudioStudyInputFromResult(
          {
            ...result,
            summary: result.summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").trim() || result.summary,
          },
          {
            sourceType: extractionMeta?.sourceKind ?? (inputMode === "text" ? "text" : null),
            intelligenceMode: modeId,
            sourceLabel: sourceTitle,
          },
        );
        const res = await fetch("/api/audio-study/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisId: "guest-preview",
            voiceId: DEFAULT_POLLY_VOICE_ID,
            input,
          }),
        });
        const data = (await res.json()) as {
          title?: string;
          durationEstimate?: string;
          script?: string;
          audioUrl?: string;
          audioBase64?: string;
          audioMime?: string;
          error?: string;
        };
        if (!res.ok || (!data.audioUrl && !data.audioBase64)) {
          throw new Error(data.error ?? "Preview audio could not be generated.");
        }
        setGuestAudioPreview({
          title: data.title ?? "30 Second Audio Preview",
          durationEstimate: data.durationEstimate ?? "~30 sec",
          script: data.script ?? "",
          audioUrl: data.audioUrl,
          audioBase64: data.audioBase64,
          audioMime: data.audioMime,
        });
        setGuestAudioPreviewState("ready");
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "Preview audio could not be generated.";
        const safeMessage = /sign in to use saved analyses/i.test(rawMessage)
          ? "Preview audio could not be generated."
          : rawMessage;
        setGuestAudioPreviewError(safeMessage);
        setGuestAudioPreviewState("error");
      }
    };

    void generateGuestPreview();
  }, [guestAudioPreviewState, inputMode, isAuthenticated, modeId, result, sourceTitle, extractionMeta]);

  return (
    <div className="space-y-4" data-workspace-analysis-result-shell>
      <header className="rounded-2xl border border-white/[0.07] bg-[#11141d]/75 p-4 shadow-sm shadow-black/20 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-200/75">{sourceKindLabel}</p>
            <h3 className="mt-1 line-clamp-2 max-w-3xl text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
              {sourceTitle}
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {metadataChips.map((chip) => (
                <span
                  key={chip}
                  className="max-w-full rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[11px] text-zinc-400"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 lg:max-w-[260px]">
            <AnalysisToolbar result={result} />
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-white/[0.07] bg-[#11141d]/75 p-2 shadow-sm shadow-black/20 backdrop-blur">
        <div className="grid gap-2" role="tablist" aria-label="Analysis result sections">
          <div className="grid grid-cols-3 gap-2">
            {RESULT_TABS.filter((t) => t.id === "summary" || t.id === "learn" || t.id === "quiz").map((tab) => (
              <ResultTabButton
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                onSelect={setActiveTab}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {RESULT_TABS.filter((t) => t.id === "audio" || t.id === "podcast").map((tab) => (
              <ResultTabButton
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                tone={tab.id === "audio" ? "audio" : "podcast"}
                accessLabel={"Included"}
                onSelect={setActiveTab}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div hidden={activeTab !== "summary"} className="space-y-4">
          <AnalysisResultView
            result={result}
            modeId={modeId}
            entitlementPlanId={entitlementPlanId}
            providerUsed={providerUsed}
            fallbackUsed={fallbackUsed}
            uiSectionLabels={uiSectionLabels}
            sections="summary"
            showHeader={false}
            showToolbar={false}
          />
          <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">▶ 30 Second Audio Preview</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Teacher-style lesson generated from this document.
            </p>
            <div className="mt-4">
              {isAuthenticated ? (
                mediaModules?.("audio") ?? (
                  <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
                    Audio lesson generation is not available for this analysis yet.
                  </p>
                )
              ) : guestAudioPreviewState === "ready" && guestAudioPreviewPlayable ? (
                <audio controls className="w-full" src={guestPreviewSrc ?? undefined} />
              ) : guestAudioPreviewState === "generating" ? (
                <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">Preparing your preview...</p>
              ) : (
                <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-3.5 py-3 text-xs text-amber-200/90">
                  <p className="font-medium text-amber-100">Audio preview not ready</p>
                  <p className="mt-1">Create a free account to generate and save audio lessons.</p>
                  <Link
                    href="/login?next=/upload"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-violet-300/40 bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-violet-400"
                  >
                    Create Free Account
                  </Link>
                  {guestAudioPreviewError ? <p className="mt-2 text-[11px] text-amber-200/80">{guestAudioPreviewError}</p> : null}
                </div>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-950/20 p-3.5">
              <p className="text-sm font-semibold text-violet-100">Unlock full Audio Study Mode</p>
              <p className="mt-1 text-xs leading-relaxed text-violet-200/80">
                Generate complete lessons, custom voices, and full-length audio learning.
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Learn Cards Preview</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Practice the most important ideas before moving to quiz.
            </p>
            <div className="mt-4">
              {resolvedLearnModule ?? (
                <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
                  No practice cards were generated for this analysis.
                </p>
              )}
            </div>
          </section>
          <WorkspaceSaveBanner savedToWorkspace={savedToWorkspace} isAuthenticated={isAuthenticated} />
          {!isAuthenticated ? (
            <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
              <p className="text-sm font-semibold text-white">Deep Analysis</p>
              <div className="mt-3">
                <AnalysisResultView
                  result={result}
                  modeId={modeId}
                  entitlementPlanId={entitlementPlanId}
                  providerUsed={providerUsed}
                  fallbackUsed={fallbackUsed}
                  uiSectionLabels={uiSectionLabels}
                  sections="deep"
                  collapseDeepSecondarySections
                  showHeader={false}
                  showToolbar={false}
                  embedded
                />
              </div>
            </section>
          ) : null}
          {isAuthenticated && <ContinueLearningStrip onSelect={setActiveTab} />}
        </div>

        <div hidden={activeTab !== "learn"} className="space-y-4">
          <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Ready to practice</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {sourceTitle} · {modeLabel} · {result.learnCards.length} card{result.learnCards.length === 1 ? "" : "s"} available
            </p>
          </section>
          {resolvedLearnModule ?? (
            <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
              No practice cards were generated for this analysis.
            </p>
          )}
        </div>

        <div hidden={activeTab !== "quiz"}>
          <QuizTabContent
            result={result}
            modeId={modeId}
            sourceType={extractionMeta?.sourceKind ?? (inputMode === "text" ? "text" : null)}
            sourceLabel={sourceTitle}
            entitlementPlanId={entitlementPlanId}
            isPaidActive={isPaidActive}
            learnComplete={learnComplete}
            onSelect={setActiveTab}
          />
        </div>

        <div hidden={activeTab !== "audio"} className="space-y-4">
          {mediaModules?.("audio") ?? (
            <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
              Audio lesson generation is not available for this analysis yet.
            </p>
          )}
        </div>

        <div hidden={activeTab !== "podcast"} className="space-y-4">
          {mediaModules?.("podcast") ?? (
            <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
              Podcast generation is not available for this analysis yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TextAnalysisMvp({
  rawText,
  onRawTextChange,
  mode,
  onModeChange,
  inputMode,
  extractStatus,
  extractionMeta,
  youtubeAnalysisFailed = false,
  urlAnalysisFailed = false,
  injectedAnalysis,
  onAnalyzingChange,
  onAnalysisComplete,
  onAnalysisResultChange,
  onSavedAnalysisIdChange,
  onIntelligenceReady,
  onAnalyzeReady,
  entitlementPlanId,
  isAuthenticated,
  isPaidActive = false,
  actionModules,
  practiceModule,
  renderPracticeModule,
  mediaModules,
  deferUntilAnalysisActive = false,
  onPaywall,
}: TextAnalysisMvpProps) {
  const inputLimits = getClientAnalysisInputLimits(entitlementPlanId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failureDebug, setFailureDebug] = useState<AnalyzeApiDebugMetadata | null>(
    null,
  );
  const [meta, setMeta] = useState<{
    providerUsed: string;
    fallbackUsed: boolean;
    personaUiSectionLabels?: PersonaUiSectionLabels;
  } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedToWorkspace, setSavedToWorkspace] = useState<boolean | undefined>(
    injectedAnalysis?.savedToWorkspace,
  );
  const [upgradeMode, setUpgradeMode] = useState<IntelligenceModeDefinition | null>(null);
  const displayResult = injectedAnalysis?.result ?? result;
  const displaySavedToWorkspace = injectedAnalysis?.savedToWorkspace ?? savedToWorkspace;
  const displayUiSectionLabels =
    injectedAnalysis?.intelligence.personaUiSectionLabels ??
    meta?.personaUiSectionLabels;
  const displayMeta = injectedAnalysis
    ? {
        providerUsed: injectedAnalysis.providerUsed,
        fallbackUsed: injectedAnalysis.fallbackUsed,
      }
    : meta;

  const isManualTextMode = inputMode === "text";
  const isYoutubeMode = inputMode === "youtube";
  const isUrlMode = inputMode === "url";
  const modeDef = getIntelligenceModeById(mode);
  const modeAccess = modeDef
    ? getModeAccessState(modeDef, entitlementPlanId)
    : null;
  const modeUnavailableMessage =
    modeAccess && !modeAccess.canRun
      ? modeAccess.lockReason === "coming_soon"
        ? USER_MESSAGES.analyzeModeComingSoon(modeDef!.label)
        : USER_MESSAGES.analyzeModeLocked(modeDef!.label)
      : null;
  const hasExtractedContent =
    extractionMeta != null && extractStatus === "ready" && rawText.trim().length > 0;
  const useCompactExtractUI = hasExtractedContent && !isManualTextMode;

  const handleAnalyze = async () => {
    if (!canRunAnalysis(mode, entitlementPlanId)) return;
    setError(null);
    setFailureDebug(null);
    setResult(null);
    onAnalysisResultChange?.(null);
    onSavedAnalysisIdChange?.(null);
    setMeta(null);
    setSavedToWorkspace(undefined);
    onIntelligenceReady?.(null);
    setLoading(true);
    onAnalyzingChange?.(true);
    trackMetaCustomEvent("AnalysisStarted", {
      source_type: extractionMeta?.sourceKind ?? (isManualTextMode ? "text" : "unknown"),
      mode,
    });
    trackEvent("upload_started", {
      trigger: "analyze",
      source_type: extractionMeta?.sourceKind ?? "text",
    });

    const sourceContext =
      extractionMeta?.sourceKind === "youtube"
        ? buildYoutubeSourceContext(extractionMeta)
        : extractionMeta?.sourceKind === "presentation"
          ? buildPresentationSourceContext(extractionMeta)
          : undefined;

    try {
      const analysis = await runTextAnalysis({
        rawText,
        mode,
        sourceHint:
          extractionMeta?.sourceKind === "youtube"
            ? "youtube"
            : extractionMeta?.sourceKind === "presentation"
              ? "presentation"
              : extractionMeta?.sourceKind === "url"
                ? "url"
                : extractionMeta?.sourceKind === "file"
                  ? "file"
                  : undefined,
        sourceContext,
        fileType:
          extractionMeta?.sourceKind === "file"
            ? extractionMeta.fileType
            : extractionMeta?.sourceKind === "presentation"
              ? "pptx"
              : null,
      });

      if (!analysis.success) {
        setError(analysis.error);
        return;
      }

      trackEvent("analysis_completed", {
        mode,
        source_kind: extractionMeta?.sourceKind,
        saved_to_workspace: analysis.savedToWorkspace,
      });

      setResult(analysis.result);
      onAnalysisResultChange?.(analysis.result);
      setMeta({
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        personaUiSectionLabels: analysis.intelligence.personaUiSectionLabels,
      });
      setSavedToWorkspace(analysis.savedToWorkspace);
      onSavedAnalysisIdChange?.(analysis.savedAnalysisId ?? null);
      onIntelligenceReady?.(analysis.intelligence);
      onAnalysisComplete?.(true);
    } catch {
      setError(USER_MESSAGES.network);
    } finally {
      setLoading(false);
      onAnalyzingChange?.(false);
    }
  };

  useEffect(() => {
    onAnalyzeReady?.(handleAnalyze);
  }, [onAnalyzeReady, handleAnalyze]);

  const sourceSubtitle = extractionMeta
    ? extractionMeta.sourceKind === "url"
      ? `Source: ${extractionMeta.title}`
      : extractionMeta.sourceKind === "presentation"
        ? `Source: ${extractionMeta.fileName} (${extractionMeta.slideCount} slides)`
        : extractionMeta.sourceKind === "youtube"
          ? `Source: ${getExtractionSourceLabel(extractionMeta)}`
          : `Source: ${getExtractionSourceLabel(extractionMeta)}`
    : isYoutubeMode
      ? "Paste a YouTube URL above to analyze in one step"
      : isUrlMode
        ? "Paste an article URL above to analyze in one step"
        : "Upload a file, paste text, or pick a source to begin";

  const pipelineAnalysisFailed = youtubeAnalysisFailed || urlAnalysisFailed;
  const isFreeDailyQuotaError = useMemo(() => {
    if (!error) return false;
    return (
      error.includes("You've used today's 3 free analyses") ||
      error.includes("Create a free account and get 5 analyses per day") ||
      error.includes("You’ve used today’s 3 free analyses") ||
      error.includes("free daily") ||
      error.includes("free analyses")
    );
  }, [error]);

  const showUpgradeCopy = isFreeDailyQuotaError || error?.includes("Scholar or Pro");

  useEffect(() => {
    if (!error) return;
    if (!isAuthenticated && isFreeDailyQuotaError) {
      onPaywall?.();
    }
  }, [error, isAuthenticated, isFreeDailyQuotaError, onPaywall]);

  // In the /upload source-ready shell, quota/paywall warnings must render in the top
  // source-ready action area (UploadWorkspace) — not inside this lower “Analysis workspace” card.
  // We still keep this component mounted so it can wire `onAnalyzeReady`, but we avoid rendering
  // any pre-analysis UI (including limit notices) until analysis is actually running or complete.
  if (deferUntilAnalysisActive && !loading && !displayResult && !error) {
    return null;
  }

  // /upload now owns all pre-analysis UI (source card + mode selection + run button).
  // This component should only render results (or analysis-time errors) to avoid
  // duplicating the legacy "Analysis workspace" block.
  if (deferUntilAnalysisActive && !displayResult) {
    // Keep debug info visible in development only.
    if (process.env.NODE_ENV === "development" && error && failureDebug) {
      return (
        <section
          className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4"
          data-workspace-analysis-pane
        >
          <p className="text-xs font-semibold text-amber-200">Dev: Analysis failed</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-amber-200/80">
            {failureDebug.failureReason
              ? formatFailureReasonLabel(failureDebug.failureReason)
              : "Unknown failure"}
            {failureDebug.attempts && failureDebug.attempts.length > 0 && (
              <span className="mt-1 block text-amber-300/80">
                {formatAttemptSummary(failureDebug.attempts)}
              </span>
            )}
          </p>
        </section>
      );
    }

    return null;
  }

  return (
    <section
      className={
        displayResult
          ? "min-w-0"
          : "rounded-2xl border border-white/[0.07] bg-[#11141d]/70 p-4 shadow-sm shadow-black/20 backdrop-blur sm:p-5"
      }
      data-workspace-analysis-pane
    >
      {!displayResult && (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Analysis workspace</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{sourceSubtitle}</p>
        </div>
        <Badge variant="muted" className="border-violet-500/20 bg-violet-500/10 text-violet-200">
          Live
        </Badge>
      </div>
      )}

      {/* Intentionally do not render quota/limit notices here. (See deferUntilAnalysisActive guard above.) */}

      {displayMeta && displayResult && (
        <PostAnalysisResultShell
          result={displayResult}
          modeId={mode}
          extractionMeta={extractionMeta}
          inputMode={inputMode}
          isAuthenticated={isAuthenticated}
          entitlementPlanId={entitlementPlanId}
          isPaidActive={isPaidActive}
          providerUsed={displayMeta.providerUsed}
          fallbackUsed={displayMeta.fallbackUsed}
          uiSectionLabels={displayUiSectionLabels}
          savedToWorkspace={displaySavedToWorkspace}
          learnModule={practiceModule ?? actionModules}
          renderLearnModule={renderPracticeModule}
          mediaModules={mediaModules}
        />
      )}

      {!displayResult && (
        <>
          {useCompactExtractUI && extractionMeta && (
            <CompactExtractReady
              key={getExtractionKey(extractionMeta)}
              rawText={rawText}
              onRawTextChange={onRawTextChange}
              extractionMeta={extractionMeta}
              inputLimits={inputLimits}
              variant={
                extractionMeta.sourceKind === "youtube"
                  ? "youtube"
                  : extractionMeta.sourceKind === "url"
                    ? "article"
                    : "file"
              }
            />
          )}

          {isManualTextMode && (
            <div className="mt-4">
              <ExtractedTextEditor
                rawText={rawText}
                onRawTextChange={onRawTextChange}
                rows={7}
                truncated={extractionMeta?.truncated}
                inputLimits={inputLimits}
              />
            </div>
          )}

          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-zinc-300">Intelligence Mode</p>
              <p className="text-[11px] text-zinc-500">Choose how Summify should read this source</p>
            </div>
            <IntelligenceModeSelector
              value={mode}
              entitlementPlanId={entitlementPlanId}
              onChange={onModeChange}
              onLockedSelect={(m) => setUpgradeMode(m)}
            />
            {modeUnavailableMessage && (
              <p className="mt-2 rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2 text-xs text-violet-200/90">
                {modeUnavailableMessage}
              </p>
            )}
          </div>
        </>
      )}

      {error && !pipelineAnalysisFailed && !(isFreeDailyQuotaError && !isAuthenticated) && (
        <div className="mt-4 space-y-2">
          <p className="rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}{" "}
            {showUpgradeCopy && (
              <a href="/pricing?plan=pro" className="font-medium text-red-100 underline-offset-2 hover:underline">
                View plans to upgrade
              </a>
            )}
          </p>
          {process.env.NODE_ENV === "development" && failureDebug && (
            <p
              className="rounded-md border border-amber-500/20 bg-amber-950/25 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-amber-300/90"
              data-workspace-analyze-debug
            >
              <span className="font-semibold text-amber-200/90">Dev: </span>
              {failureDebug.failureReason
                ? formatFailureReasonLabel(failureDebug.failureReason)
                : "Analysis failed"}
              {failureDebug.attempts && failureDebug.attempts.length > 0 && (
                <span className="mt-1 block text-amber-400/80">
                  {formatAttemptSummary(failureDebug.attempts)}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <PlanUpgradeModal
        mode={upgradeMode}
        entitlementPlanId={entitlementPlanId}
        isAuthenticated={isAuthenticated}
        onClose={() => setUpgradeMode(null)}
      />
    </section>
  );
}
