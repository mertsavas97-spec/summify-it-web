"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
import { isAnalysisQuotaError } from "@/lib/analysis-quota";
import { AnalysisExportToolbar } from "@/components/analysis/AnalysisExportToolbar";
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
import { LearningExperiencesResults } from "./LearningExperiencesResults";
import { AnalysisExportSharePanel } from "@/components/analysis/AnalysisExportSharePanel";
import type { LearningExperienceId } from "@/types/learning-experience";

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
  onAnalysisSuccess?: (payload: {
    result: AnalysisResult;
    providerUsed: string;
    fallbackUsed: boolean;
    intelligence: AnalysisIntelligenceMetadata;
    savedToWorkspace?: boolean;
    savedAnalysisId?: string | null;
  }) => void;
  onAnalyzeReady?: (handler: () => void) => void;
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive?: boolean;
  limitNotice?: string | null;
  /** Invoked when analysis is blocked due to paywall/quota. (e.g. free daily limit reached) */
  onPaywall?: () => void;
  /** Invoked when guest quota is exhausted so parent can update banner state. */
  onAnalysisQuotaExhausted?: (payload: { error: string; errorCode?: string }) => void;
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
  learningExperience?: LearningExperienceId;
  savedAnalysisId?: string | null;
  onGuestSaveClick?: () => void;
  onExperienceChange?: (experience: LearningExperienceId) => void;
  onNewAnalysis?: () => void;
  /** When true, the PracticeAnalysisCta is not rendered (caller will render it separately). */
  hidePracticeCta?: boolean;
};

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
  savedAnalysisId,
  learningExperience = "summary-learn",
  onGuestSaveClick,
  mediaModules,
  onExperienceChange,
  onNewAnalysis,
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
  savedAnalysisId?: string | null;
  learningExperience?: LearningExperienceId;
  onGuestSaveClick?: () => void;
  mediaModules?: (view: "audio" | "podcast") => ReactNode;
  onExperienceChange?: (experience: LearningExperienceId) => void;
  onNewAnalysis?: () => void;
}) {
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
          <div className="shrink-0 lg:max-w-[320px]">
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {onNewAnalysis ? (
                <button
                  type="button"
                  onClick={onNewAnalysis}
                  className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-violet-400/25 hover:text-violet-100"
                >
                  New analysis
                </button>
              ) : null}
              {savedAnalysisId && isAuthenticated ? (
              <AnalysisExportToolbar
                result={result}
                exportContext={{
                  sourceKind: extractionMeta?.sourceKind ?? inputMode,
                  intelligenceMode: modeLabel,
                  intelligenceModeId: modeId,
                  uiSectionLabels,
                }}
              />
            ) : (
              <AnalysisToolbar
                result={result}
                modeId={modeId}
                uiSectionLabels={uiSectionLabels}
              />
            )}
            </div>
          </div>
        </div>
      </header>

      <LearningExperiencesResults
        initialExperience={learningExperience}
        result={result}
        modeId={modeId}
        providerUsed={providerUsed}
        fallbackUsed={fallbackUsed}
        uiSectionLabels={uiSectionLabels}
        entitlementPlanId={entitlementPlanId}
        isPaidActive={isPaidActive}
        sourceType={extractionMeta?.sourceKind ?? (inputMode === "text" ? "text" : null)}
        sourceLabel={sourceTitle}
        savedAnalysisId={savedAnalysisId}
        modeLabel={modeLabel}
        sourceKindLabel={sourceKindLabel}
        audioContent={
          mediaModules?.("audio") ?? (
            <p className="text-xs text-zinc-500">Audio lesson generation is not available for this analysis yet.</p>
          )
        }
        podcastContent={
          mediaModules?.("podcast") ?? (
            <p className="text-xs text-zinc-500">Podcast generation is not available for this analysis yet.</p>
          )
        }
        onTryAudio={() => onExperienceChange?.("audio")}
        onTryPodcast={() => onExperienceChange?.("podcast")}
        footerContent={
          <>
            <WorkspaceSaveBanner
              savedToWorkspace={savedToWorkspace}
              isAuthenticated={isAuthenticated}
              savedAnalysisId={savedAnalysisId}
              onGuestSaveClick={onGuestSaveClick}
            />
            {isAuthenticated && savedAnalysisId ? (
              <AnalysisExportSharePanel
                result={result}
                analysisId={savedAnalysisId}
                isPublic={false}
                shareId={null}
                exportContext={{
                  sourceKind: extractionMeta?.sourceKind ?? inputMode,
                  intelligenceMode: modeLabel,
                  intelligenceModeId: modeId,
                  uiSectionLabels,
                }}
              />
            ) : null}
          </>
        }
      />
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
  onAnalysisSuccess,
  onAnalyzeReady,
  entitlementPlanId,
  isAuthenticated,
  isPaidActive = false,
  mediaModules,
  deferUntilAnalysisActive = false,
  learningExperience = "summary-learn",
  savedAnalysisId,
  onGuestSaveClick,
  onPaywall,
  onAnalysisQuotaExhausted,
  onExperienceChange,
  onNewAnalysis,
}: TextAnalysisMvpProps) {
  const inputLimits = getClientAnalysisInputLimits(entitlementPlanId);
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

  const handleAnalyze = useCallback(async () => {
    if (!canRunAnalysis(mode, entitlementPlanId)) return;
    setError(null);
    setFailureDebug(null);
    setResult(null);
    onAnalysisResultChange?.(null);
    onSavedAnalysisIdChange?.(null);
    setMeta(null);
    setSavedToWorkspace(undefined);
    onIntelligenceReady?.(null);
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
          : extractionMeta?.sourceKind === "file"
            ? {
                sourceKind: "file" as const,
                fileName: extractionMeta.fileName,
                fileType: extractionMeta.fileType ?? null,
              }
            : extractionMeta?.sourceKind === "url"
              ? {
                  sourceKind: "url" as const,
                  url: extractionMeta.sourceUrl,
                  title: extractionMeta.title,
                }
              : isManualTextMode
                ? { sourceKind: "text" as const, label: "Pasted text" }
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
                  : isManualTextMode
                    ? "text"
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
        if (isAnalysisQuotaError(analysis.error, analysis.errorCode)) {
          onAnalysisQuotaExhausted?.({
            error: analysis.error,
            errorCode: analysis.errorCode,
          });
        }
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
      onAnalysisSuccess?.({
        result: analysis.result,
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        intelligence: analysis.intelligence,
        savedToWorkspace: analysis.savedToWorkspace,
        savedAnalysisId: analysis.savedAnalysisId ?? null,
      });
      onAnalysisComplete?.(true);
    } catch {
      setError(USER_MESSAGES.network);
    } finally {
      onAnalyzingChange?.(false);
    }
  }, [
    entitlementPlanId,
    extractionMeta,
    isManualTextMode,
    mode,
    onAnalysisComplete,
    onAnalysisQuotaExhausted,
    onAnalysisResultChange,
    onAnalysisSuccess,
    onAnalyzingChange,
    onIntelligenceReady,
    onSavedAnalysisIdChange,
    rawText,
  ]);

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
    return isAnalysisQuotaError(error);
  }, [error]);

  const showUpgradeCopy = isFreeDailyQuotaError || error?.includes("Scholar or Pro");

  useEffect(() => {
    if (!error) return;
    if (isAnalysisQuotaError(error)) {
      onPaywall?.();
    }
  }, [error, onPaywall]);

  // In the /upload source-ready shell, quota/paywall warnings must render in the top
  // source-ready action area (UploadWorkspace) — not inside this lower “Analysis workspace” card.
  // We still keep this component mounted so it can wire `onAnalyzeReady`, but we avoid rendering
  // any pre-analysis UI (including limit notices) until analysis is actually running or complete.
  if (deferUntilAnalysisActive && !displayResult) {
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
          <h2 className="text-sm font-semibold text-white">Summarizer workspace</h2>
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
          savedAnalysisId={savedAnalysisId}
          learningExperience={learningExperience}
          onGuestSaveClick={onGuestSaveClick}
          mediaModules={mediaModules}
          onExperienceChange={onExperienceChange}
          onNewAnalysis={onNewAnalysis}
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
              <p className="text-[11px] text-zinc-500">Choose how Summify should summarize this source</p>
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
