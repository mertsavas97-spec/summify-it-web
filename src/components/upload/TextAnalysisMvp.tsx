"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { AnalysisResult } from "@/types/text-analysis";
import { getIntelligenceModeById } from "@/config/modes";
import type { IntelligenceModeId } from "@/types/modes";
import { AI_INPUT_LIMITS } from "@/lib/analysis-limits";
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
import { runTextAnalysis } from "@/lib/run-text-analysis";
import { canRunAnalysis } from "@/lib/mode-resolver";
import { USER_MESSAGES } from "@/lib/user-messages";
import { IntelligenceLoadingStages } from "./IntelligenceLoadingStages";
import { AnalysisResultView } from "./AnalysisResultView";
import { IntelligenceModeSelector } from "./IntelligenceModeSelector";
import {
  formatAttemptSummary,
  formatFailureReasonLabel,
} from "@/lib/analysis-debug-labels";
import type { AnalyzeApiDebugMetadata } from "@/types/text-analysis";
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
  onIntelligenceReady?: (metadata: AnalysisIntelligenceMetadata | null) => void;
};

function ExtractedTextEditor({
  rawText,
  onRawTextChange,
  rows,
  truncated,
  label = "Document text",
}: {
  rawText: string;
  onRawTextChange: (text: string) => void;
  rows: number;
  truncated?: boolean;
  label?: string;
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
        {formatNumber(charCount)} / {formatNumber(AI_INPUT_LIMITS.maxChars)}{" "}
        characters · min {formatNumber(AI_INPUT_LIMITS.minChars)}
        {truncated && (
          <span className="text-amber-400/80"> · truncated from source</span>
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
  variant = "file",
}: {
  rawText: string;
  onRawTextChange: (text: string) => void;
  extractionMeta: ExtractionMetadata;
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
  youtubeAnalysisFailed = false,
  urlAnalysisFailed = false,
  onRetryYoutubeAnalysis,
  onRetryUrlAnalysis,
  injectedAnalysis,
  onAnalyzingChange,
  onAnalysisComplete,
  onIntelligenceReady,
}: TextAnalysisMvpProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failureDebug, setFailureDebug] = useState<AnalyzeApiDebugMetadata | null>(
    null,
  );
  const [meta, setMeta] = useState<{
    providerUsed: string;
    fallbackUsed: boolean;
  } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const displayResult = injectedAnalysis?.result ?? result;
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
  const modeUnavailableMessage =
    modeDef?.availability === "coming_soon"
      ? USER_MESSAGES.analyzeModeComingSoon(modeDef.label)
      : modeDef?.availability === "locked"
        ? USER_MESSAGES.analyzeModeLocked(modeDef.label)
        : null;
  const hasExtractedContent =
    extractionMeta != null && extractStatus === "ready" && rawText.trim().length > 0;
  const useCompactExtractUI = hasExtractedContent && !isManualTextMode;

  const charCount = rawText.trim().length;
  const canAnalyze =
    charCount >= AI_INPUT_LIMITS.minChars &&
    canRunAnalysis(mode) &&
    !loading &&
    !analyzeDisabled &&
    extractStatus !== "uploading" &&
    extractStatus !== "extracting";

  async function handleAnalyze() {
    if (!canRunAnalysis(mode)) return;
    setError(null);
    setFailureDebug(null);
    setResult(null);
    setMeta(null);
    onIntelligenceReady?.(null);
    setLoading(true);
    onAnalyzingChange?.(true);

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
                : undefined,
        sourceContext,
      });

      if (!analysis.success) {
        setError(analysis.error);
        return;
      }

      setResult(analysis.result);
      setMeta({
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
      });
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
        <div className="mt-4" data-workspace-analysis-result>
          <AnalysisResultView
            result={displayResult}
            modeId={mode}
            providerUsed={displayMeta.providerUsed}
            fallbackUsed={displayMeta.fallbackUsed}
          />
        </div>
      )}

      {useCompactExtractUI && extractionMeta && (
        <CompactExtractReady
          key={getExtractionKey(extractionMeta)}
          rawText={rawText}
          onRawTextChange={onRawTextChange}
          extractionMeta={extractionMeta}
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
          />
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-zinc-300">Intelligence lens</p>
          <p className="text-[11px] text-zinc-500">29 modes · click card to change</p>
        </div>
        <IntelligenceModeSelector value={mode} onChange={onModeChange} />
        {modeUnavailableMessage && (
          <p className="mt-2 rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2 text-xs text-violet-200/90">
            {modeUnavailableMessage}
          </p>
        )}
      </div>

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
                : charCount < AI_INPUT_LIMITS.minChars
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
            {error}
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
    </section>
  );
}
