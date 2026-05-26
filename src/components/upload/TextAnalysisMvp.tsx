"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  BookOpen,
  BrainCircuit,
  Headphones,
  HelpCircle,
  Mic,
  type LucideIcon,
} from "lucide-react";
import type { IntelligenceModeDefinition } from "@/types/modes";
import { Button } from "@/components/ui/Button";
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
import { IntelligenceLoadingStages } from "./IntelligenceLoadingStages";
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
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import type { InjectedAnalysisPayload } from "./UploadWorkspace";
import { canUseAudioStudyMode } from "@/lib/audio-study/access";
import { canUsePodcastDiscussionMode } from "@/lib/podcast/access";

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
  actionModules?: ReactNode;
  practiceModule?: ReactNode;
  mediaModules?: (view: "audio" | "podcast") => ReactNode;
  /** Keep analysis wiring mounted while another source-ready shell owns the pre-analysis UI. */
  deferUntilAnalysisActive?: boolean;
  /** When true, the PracticeAnalysisCta is not rendered (caller will render it separately). */
  hidePracticeCta?: boolean;
};

type ResultTabId = "summary" | "learn" | "quiz" | "audio" | "podcast";

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
  return "Document";
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

function ResultTabButton({
  tab,
  active,
  accessLabel,
  onSelect,
}: {
  tab: (typeof RESULT_TABS)[number];
  active: boolean;
  accessLabel?: string;
  onSelect: (tab: ResultTabId) => void;
}) {
  const Icon = tab.icon;
  const isPremium = Boolean(tab.premium);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(tab.id)}
      className={`group relative min-w-[132px] shrink-0 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all sm:min-w-0 sm:flex-1 ${
        active
          ? "border-violet-400/35 bg-violet-500/12 text-violet-50 shadow-[0_0_22px_rgba(139,92,246,0.13)]"
          : isPremium
            ? "border-violet-400/12 bg-violet-500/[0.035] text-zinc-300 hover:border-violet-400/25 hover:bg-violet-500/[0.07]"
            : "border-white/[0.06] bg-white/[0.018] text-zinc-400 hover:border-white/[0.11] hover:bg-white/[0.035] hover:text-zinc-200"
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
      <span className="relative flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              active || isPremium
                ? "border-violet-400/25 bg-violet-500/12 text-violet-200"
                : "border-white/[0.06] bg-black/20 text-zinc-500"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span>
            {tab.eyebrow ? (
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/75">
                {tab.eyebrow}
              </span>
            ) : null}
            <span className="block text-sm font-semibold">{tab.label}</span>
          </span>
        </span>
        {accessLabel ? (
          <span className="rounded-full border border-violet-400/18 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
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
  onSelect,
}: {
  result: AnalysisResult;
  onSelect: (tab: ResultTabId) => void;
}) {
  const quizCards = result.learnCards.filter((card) => card.type === "quiz" && !card.isLockedPreview);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
      <p className="text-sm font-semibold text-white">Quiz</p>
      {quizCards.length > 0 ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            {quizCards.length} quiz prompt{quizCards.length === 1 ? "" : "s"} are available from your Learn set.
          </p>
          <button
            type="button"
            onClick={() => onSelect("learn")}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Start from Learn cards
          </button>
        </>
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
  isPaidActive,
  savedToWorkspace,
  learnModule,
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
  isPaidActive: boolean;
  savedToWorkspace?: boolean;
  learnModule?: ReactNode;
  mediaModules?: (view: "audio" | "podcast") => ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<ResultTabId>("summary");
  const modeDef = getIntelligenceModeById(modeId);
  const sourceTitle = getResultSourceTitle({ extractionMeta, inputMode, result });
  const audioUnlocked = canUseAudioStudyMode(entitlementPlanId, isPaidActive);
  const podcastUnlocked = canUsePodcastDiscussionMode(entitlementPlanId, isPaidActive);
  const complexity = modeDef?.outputDepth
    ? `${modeDef.outputDepth[0].toUpperCase()}${modeDef.outputDepth.slice(1)} depth`
    : null;

  return (
    <div className="space-y-4" data-workspace-analysis-result-shell>
      <header className="rounded-2xl border border-white/[0.07] bg-[#11141d]/75 p-4 shadow-sm shadow-black/20 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-200/80">{getSourceKindLabel(inputMode, extractionMeta)}</p>
            <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">{sourceTitle}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <span>Intelligence Mode: {modeDef?.label ?? modeId}</span>
              <span>·</span>
              <span>{estimateReadingTime(result)}</span>
              {complexity ? (
                <>
                  <span>·</span>
                  <span>{complexity}</span>
                </>
              ) : null}
              <span>·</span>
              <span>
                Provider: <span className="font-mono text-zinc-400">{providerUsed}</span>
                {fallbackUsed ? <span className="text-amber-400/90"> · fallback</span> : null}
              </span>
            </div>
          </div>
          <AnalysisToolbar result={result} />
        </div>
      </header>

      <WorkspaceSaveBanner savedToWorkspace={savedToWorkspace} />

      <div className="rounded-3xl border border-white/[0.07] bg-[#11141d]/75 p-2.5 shadow-sm shadow-black/20 backdrop-blur">
        <div
          className="flex gap-2 overflow-x-auto"
          role="tablist"
          aria-label="Analysis result sections"
        >
          {RESULT_TABS.map((tab) => (
            <ResultTabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              accessLabel={
                tab.premium === "audio"
                  ? audioUnlocked ? "Pro" : "Upgrade"
                  : tab.premium === "podcast"
                    ? podcastUnlocked ? "Pro" : "Upgrade"
                    : undefined
              }
              onSelect={setActiveTab}
            />
          ))}
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
          <ContinueLearningStrip onSelect={setActiveTab} />
        </div>

        <div hidden={activeTab !== "learn"} className="space-y-4">
          <section className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Ready to practice</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {sourceTitle} · {modeDef?.label ?? modeId} · {result.learnCards.length} card{result.learnCards.length === 1 ? "" : "s"} available
            </p>
          </section>
          {learnModule ?? (
            <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
              No practice cards were generated for this analysis.
            </p>
          )}
        </div>

        <div hidden={activeTab !== "quiz"}>
          <QuizTabContent result={result} onSelect={setActiveTab} />
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
  analyzeDisabled = false,
  hidePrimaryAnalyze = false,
  hidePracticeCta = false,
  youtubeAnalysisFailed = false,
  urlAnalysisFailed = false,
  onRetryYoutubeAnalysis,
  onRetryUrlAnalysis,
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
  limitNotice,
  actionModules,
  practiceModule,
  mediaModules,
  deferUntilAnalysisActive = false,
}: TextAnalysisMvpProps) {
  const inputLimits = getClientAnalysisInputLimits(entitlementPlanId);
  const [loading, setLoading] = useState(false);
  const [analysisLimitNotice, setAnalysisLimitNotice] = useState<string | null>(null);
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
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null | undefined>(
    injectedAnalysis?.savedAnalysisId,
  );
  const [upgradeMode, setUpgradeMode] = useState<IntelligenceModeDefinition | null>(null);
  const displayResult = injectedAnalysis?.result ?? result;
  const displaySavedToWorkspace = injectedAnalysis?.savedToWorkspace ?? savedToWorkspace;
  const displaySavedAnalysisId = injectedAnalysis?.savedAnalysisId ?? savedAnalysisId;
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

  const charCount = rawText.trim().length;
  const canAnalyze =
    charCount >= inputLimits.minChars &&
    canRunAnalysis(mode, entitlementPlanId) &&
    !loading &&
    !analyzeDisabled &&
    extractStatus !== "uploading" &&
    extractStatus !== "extracting";

  const handleAnalyze = async () => {
    if (!canRunAnalysis(mode, entitlementPlanId)) return;
    setError(null);
    setFailureDebug(null);
    setResult(null);
    onAnalysisResultChange?.(null);
    onSavedAnalysisIdChange?.(null);
    setMeta(null);
    setSavedToWorkspace(undefined);
    setSavedAnalysisId(undefined);
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
      setSavedAnalysisId(analysis.savedAnalysisId);
      onSavedAnalysisIdChange?.(analysis.savedAnalysisId ?? null);
      setAnalysisLimitNotice(analysis.limitNotice ?? null);
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
  const showRunButton =
    !hidePrimaryAnalyze || (isYoutubeMode && youtubeAnalysisFailed) || (isUrlMode && urlAnalysisFailed);
  const showUpgradeCopy =
    error?.includes("free analyses") || error?.includes("Scholar or Pro");

  if (deferUntilAnalysisActive && !loading && !displayResult && !error && !analysisLimitNotice) {
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

      {!displayResult && (limitNotice || analysisLimitNotice) && (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          {analysisLimitNotice ?? limitNotice}
        </p>
      )}

      {displayMeta && displayResult && (
        <PostAnalysisResultShell
          result={displayResult}
          modeId={mode}
          extractionMeta={extractionMeta}
          inputMode={inputMode}
          entitlementPlanId={entitlementPlanId}
          isPaidActive={isPaidActive}
          providerUsed={displayMeta.providerUsed}
          fallbackUsed={displayMeta.fallbackUsed}
          uiSectionLabels={displayUiSectionLabels}
          savedToWorkspace={displaySavedToWorkspace}
          learnModule={practiceModule ?? actionModules}
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

      {error && !pipelineAnalysisFailed && (
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
