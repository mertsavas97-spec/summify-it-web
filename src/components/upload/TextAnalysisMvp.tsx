"use client";

import { useState } from "react";
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
import { WorkspaceUsageWarning } from "./WorkspaceUsageWarning";
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import type { InjectedAnalysisPayload } from "./UploadWorkspace";

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
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive?: boolean;
  limitNotice?: string | null;
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
        className="mt-1.5 w-full resize-y rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
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
      className={`mt-4 rounded-lg border px-3 py-2.5 ${
        isYoutube
          ? "border-red-500/20 bg-red-950/15"
          : isArticle
            ? "border-sky-500/20 bg-sky-950/15"
            : "border-emerald-500/20 bg-emerald-950/20"
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
  entitlementPlanId,
  isAuthenticated,
  isPaidActive = false,
  limitNotice,
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

  async function handleAnalyze() {
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
  }

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

  return (
    <section
      className="rounded-xl border border-violet-500/25 bg-gradient-to-b from-violet-950/20 to-zinc-900/40 p-4 sm:p-5"
      data-workspace-analysis-pane
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Analysis workspace</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{sourceSubtitle}</p>
        </div>
        <Badge variant="accent">Live</Badge>
      </div>

      {displayMeta && displayResult && (
        <div className="mt-5 space-y-4" data-workspace-analysis-result>
          <header
            className="rounded-xl border border-white/[0.08] bg-zinc-950/50 px-4 py-3.5 sm:px-5 sm:py-4"
            data-workspace-analysis-hero
          >
            <div className="min-w-0 max-w-prose">
              <h3 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-lg">
                {displayResult.title}
              </h3>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Provider:{" "}
                <span className="font-mono text-zinc-400">{displayMeta.providerUsed}</span>
                {displayMeta.fallbackUsed ? (
                  <span className="text-amber-400/90"> · fallback</span>
                ) : null}
              </p>
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <AnalysisToolbar result={displayResult} />
            </div>
          </header>

          {!hidePracticeCta && (
            <PracticeAnalysisCta
              savedToWorkspace={displaySavedToWorkspace}
              savedAnalysisId={displaySavedAnalysisId}
              learnCards={displayResult.learnCards}
              analysisContent={displayResult}
              entitlementPlanId={entitlementPlanId}
              isPaidActive={isPaidActive}
              intelligenceModeId={mode}
              sourceType={extractionMeta?.sourceKind ?? null}
              documentTitle={displayResult.title}
              modeLabel={getIntelligenceModeById(mode as IntelligenceModeId)?.label ?? mode}
              sourceKindLabel={
                extractionMeta?.sourceKind === "youtube"
                  ? "YouTube"
                  : extractionMeta?.sourceKind === "presentation"
                    ? "Presentation"
                    : extractionMeta?.sourceKind === "url"
                      ? "Article"
                      : "Document"
              }
            />
          )}

          <WorkspaceSaveBanner savedToWorkspace={displaySavedToWorkspace} />

          <AnalysisResultView
            result={displayResult}
            modeId={mode}
            entitlementPlanId={entitlementPlanId}
            providerUsed={displayMeta.providerUsed}
            fallbackUsed={displayMeta.fallbackUsed}
            uiSectionLabels={displayUiSectionLabels}
            showHeader={false}
            showToolbar={false}
          />
        </div>
      )}

      {(limitNotice || analysisLimitNotice) && (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          {analysisLimitNotice ?? limitNotice}
        </p>
      )}

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
          <p className="text-xs font-medium text-zinc-300">Intelligence lens</p>
          <p className="text-[11px] text-zinc-500">29 modes · click card to change</p>
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

      <WorkspaceUsageWarning />

      {showRunButton && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            size="sm"
            disabled={!canAnalyze}
            onClick={() => {
              if (isYoutubeMode && youtubeAnalysisFailed && onRetryYoutubeAnalysis) {
                void onRetryYoutubeAnalysis();
              } else if (isUrlMode && urlAnalysisFailed && onRetryUrlAnalysis) {
                void onRetryUrlAnalysis();
              } else {
                void handleAnalyze();
              }
            }}
          >
            {loading
              ? "Analyzing…"
              : pipelineAnalysisFailed
                ? "Retry analysis"
                : displayResult
                  ? "Re-run analysis"
                  : "Run analysis"}
          </Button>
          {!canAnalyze && !loading && !modeUnavailableMessage && (
            <span className="text-xs text-zinc-400">
              {extractStatus === "uploading" || extractStatus === "extracting"
                ? "Wait for extraction to finish…"
                : charCount < inputLimits.minChars
                  ? "Add a source to start analysis."
                  : analyzeDisabled
                    ? "Complete the step above to enable analysis."
                    : null}
            </span>
          )}
        </div>
      )}

      {loading && !hidePrimaryAnalyze && (
        <IntelligenceLoadingStages
          key="analyze-loading"
          active
          group="analyze"
          className="mt-4"
        />
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
