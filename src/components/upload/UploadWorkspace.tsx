"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "./UploadZone";
import { UploadPreviewPanel } from "./UploadPreviewPanel";
import { WorkspaceEntitlementBanner } from "./WorkspaceEntitlementBanner";
import { PipelineStages } from "./PipelineStages";
import { TextAnalysisMvp } from "./TextAnalysisMvp";
import { InputSourceTabs } from "./InputSourceTabs";
import { UrlExtractPanel } from "./UrlExtractPanel";
import { YoutubeExtractPanel } from "./YoutubeExtractPanel";
import { Badge } from "@/components/ui/Badge";
import { getPlanLimits } from "@/lib/plans/planLimits";
import { getUploadZoneCopy } from "@/lib/plans/uploadCopy";
import { USER_MESSAGES } from "@/lib/user-messages";
import type { PipelineStage } from "@/core/types";
import {
  getExtractionSourceLabel,
  type ExtractApiResponse,
  type ExtractUrlApiResponse,
  type ExtractYoutubeApiResponse,
  type ExtractionMetadata,
  type UploadExtractStatus,
  type WorkspaceInputMode,
  type YoutubeExtractionMetadata,
} from "@/types/extraction";
import type { AnalysisResult } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import { getIntelligenceModeById } from "@/config/modes";
import { useWorkspaceEntitlement } from "@/hooks/useWorkspaceEntitlement";
import { getDefaultIntelligenceModeId } from "@/lib/mode-resolver";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import { buildYoutubeSourceContext } from "@/types/analyze-source";
import { trackEvent } from "@/lib/analytics/events";
import { runTextAnalysis } from "@/lib/run-text-analysis";
import { trackMetaCustomEvent } from "@/lib/metaPixel";
import { TrustSignals } from "@/components/growth/TrustSignals";
import { DemoWorkflowBlock } from "@/components/growth/DemoWorkflowBlock";
import {
  countPodcastAnalysisCandidates,
  PodcastWorkspaceCtas,
} from "@/components/podcast/PodcastWorkspaceCtas";
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import type { PodcastSourceProfile } from "@/lib/podcast/eligibility";

function resolvePipelineStage(
  extractStatus: UploadExtractStatus,
  isAnalyzing: boolean,
  hasResult: boolean,
): PipelineStage | null {
  if (isAnalyzing) return "analyze";
  if (extractStatus === "idle") return null;
  if (extractStatus === "uploading") return "upload";
  if (extractStatus === "extracting") return "extract";
  if (extractStatus === "failed") return "upload";
  if (hasResult) return "learn";
  if (extractStatus === "ready") return "profile";
  return "clean";
}

export type InjectedAnalysisPayload = {
  result: AnalysisResult;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceMetadata;
  savedToWorkspace?: boolean;
  savedAnalysisId?: string | null;
};

export function UploadWorkspace() {
  const workspaceEntitlement = useWorkspaceEntitlement();
  const [inputMode, setInputMode] = useState<WorkspaceInputMode>("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] =
    useState<UploadExtractStatus>("idle");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionMeta, setExtractionMeta] =
    useState<ExtractionMetadata | null>(null);
  const [rawText, setRawText] = useState("");
  const [analysisMode, setAnalysisMode] = useState<IntelligenceModeId>(
    getDefaultIntelligenceModeId(),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalysisResult, setHasAnalysisResult] = useState(false);
  const [analysisIntelligence, setAnalysisIntelligence] =
    useState<AnalysisIntelligenceMetadata | null>(null);
  const [youtubePipelineActive, setYoutubePipelineActive] = useState(false);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [youtubeAnalysisError, setYoutubeAnalysisError] = useState<string | null>(
    null,
  );
  const [urlPipelineActive, setUrlPipelineActive] = useState(false);
  const [urlAnalysisError, setUrlAnalysisError] = useState<string | null>(null);
  const [injectedAnalysis, setInjectedAnalysis] =
    useState<InjectedAnalysisPayload | null>(null);
  const [latestAnalysisResult, setLatestAnalysisResult] =
    useState<AnalysisResult | null>(null);
  const [latestSavedAnalysisId, setLatestSavedAnalysisId] = useState<string | null>(
    null,
  );
  const runAnalysisRef = useRef<null | (() => void)>(null);
  const uploadStartedRef = useRef<Set<string>>(new Set());

  const getSourceType = useCallback((mode: WorkspaceInputMode, meta: ExtractionMetadata | null) => {
    if (mode === "file") return "file";
    if (mode === "text") return "text";
    if (meta?.sourceKind === "youtube") return "youtube";
    if (meta?.sourceKind === "url") return "url";
    if (meta?.sourceKind === "presentation") return "file";
    return "unknown";
  }, []);

  const fireUploadStarted = useCallback(
    (mode: WorkspaceInputMode, meta: ExtractionMetadata | null, sessionKey: string) => {
      if (uploadStartedRef.current.has(sessionKey)) return;
      uploadStartedRef.current.add(sessionKey);
      trackMetaCustomEvent("UploadStarted", { source_type: getSourceType(mode, meta) });
    },
    [getSourceType],
  );

  const fireAnalysisStarted = useCallback(
    (meta: ExtractionMetadata | null) => {
      trackMetaCustomEvent("AnalysisStarted", {
        source_type: getSourceType(inputMode, meta),
        mode: analysisMode,
      });
    },
    [analysisMode, getSourceType, inputMode],
  );

  const resetAnalysisState = useCallback(() => {
    setHasAnalysisResult(false);
    setAnalysisIntelligence(null);
    setInjectedAnalysis(null);
    setLatestAnalysisResult(null);
    setLatestSavedAnalysisId(null);
    setYoutubeAnalysisError(null);
    setUrlAnalysisError(null);
  }, []);

  const runYoutubeAnalysis = useCallback(
    async (text: string, meta: YoutubeExtractionMetadata) => {
      setYoutubeAnalysisError(null);
      setIsAnalyzing(true);

      const analysis = await runTextAnalysis({
        rawText: text,
        mode: analysisMode,
        sourceHint: "youtube",
        sourceContext: buildYoutubeSourceContext(meta),
      });

      setIsAnalyzing(false);

      if (!analysis.success) {
        setYoutubeAnalysisError(analysis.error);
        return false;
      }

      setInjectedAnalysis({
        result: analysis.result,
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        intelligence: analysis.intelligence,
        savedToWorkspace: analysis.savedToWorkspace,
        savedAnalysisId: analysis.savedAnalysisId,
      });
      setLatestAnalysisResult(analysis.result);
      setLatestSavedAnalysisId(analysis.savedAnalysisId ?? null);
      setAnalysisIntelligence(analysis.intelligence);
      setHasAnalysisResult(true);
      return true;
    },
    [analysisMode],
  );

  const runUrlAnalysis = useCallback(
    async (text: string) => {
      setUrlAnalysisError(null);
      setIsAnalyzing(true);

      const analysis = await runTextAnalysis({
        rawText: text,
        mode: analysisMode,
        sourceHint: "url",
      });

      setIsAnalyzing(false);

      if (!analysis.success) {
        setUrlAnalysisError(analysis.error);
        return false;
      }

      setInjectedAnalysis({
        result: analysis.result,
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        intelligence: analysis.intelligence,
        savedToWorkspace: analysis.savedToWorkspace,
        savedAnalysisId: analysis.savedAnalysisId,
      });
      setLatestAnalysisResult(analysis.result);
      setLatestSavedAnalysisId(analysis.savedAnalysisId ?? null);
      setAnalysisIntelligence(analysis.intelligence);
      setHasAnalysisResult(true);
      return true;
    },
    [analysisMode],
  );

  const uploadCopy = useMemo(
    () => getUploadZoneCopy(workspaceEntitlement.entitlementPlanId),
    [workspaceEntitlement.entitlementPlanId],
  );
  const planLimits = useMemo(
    () => getPlanLimits(workspaceEntitlement.entitlementPlanId),
    [workspaceEntitlement.entitlementPlanId],
  );

  const handleFileSelected = useCallback(async (file: File) => {
    setInputMode("file");
    setFileName(file.name);
    setSourceUrl(null);
    setExtractError(null);
    setExtractionMeta(null);
    setLimitNotice(null);
    resetAnalysisState();

    const maxBytes = planLimits.maxUploadMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setExtractError(USER_MESSAGES.extractFileTooLarge(planLimits.maxUploadMb));
      setExtractStatus("failed");
      return;
    }

    setExtractStatus("uploading");
    fireUploadStarted("file", null, `file:${file.name}:${file.size}:${file.lastModified}`);
    trackEvent("upload_started", { trigger: "file", source_type: file.type || "file" });

    const formData = new FormData();
    formData.append("file", file);

    setExtractStatus("extracting");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as ExtractApiResponse;

      if (!data.success) {
        setExtractError(data.error);
        setExtractStatus("failed");
        return;
      }

      setRawText(data.extractedText);
      setExtractionMeta(data.metadata);
      setLimitNotice(data.limitNotice ?? null);
      setExtractStatus("ready");
    } catch {
      setExtractError(USER_MESSAGES.network);
      setExtractStatus("failed");
    }
  }, [fireUploadStarted, planLimits.maxUploadMb, resetAnalysisState]);

  const handleUrlAnalyzeArticle = useCallback(
    async (url: string, options?: { analyzeOnly?: boolean }) => {
      setInputMode("url");
      setFileName(null);
      setSourceUrl(url);
      setExtractError(null);
      setUrlAnalysisError(null);
      resetAnalysisState();
      setUrlPipelineActive(true);
      fireUploadStarted("url", extractionMeta, `url:${url}`);

      let text = rawText;

      if (!options?.analyzeOnly) {
        setExtractStatus("extracting");

        try {
          const res = await fetch("/api/extract-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });

          const data = (await res.json()) as ExtractUrlApiResponse;

          if (!data.success) {
            setExtractError(data.error);
            setExtractStatus("failed");
            setUrlPipelineActive(false);
            return;
          }

          text = data.extractedText;
          setRawText(text);
          setExtractionMeta(data.metadata);
          setLimitNotice(data.limitNotice ?? null);
          setExtractStatus("ready");
        } catch {
          setExtractError(USER_MESSAGES.network);
          setExtractStatus("failed");
          setUrlPipelineActive(false);
          return;
        }
      }

      if (text.trim().length < 100) {
        setExtractError(USER_MESSAGES.urlTooShort);
        setUrlPipelineActive(false);
        return;
      }

      await runUrlAnalysis(text);
      setUrlPipelineActive(false);
    },
    [extractionMeta, fireUploadStarted, rawText, resetAnalysisState, runUrlAnalysis],
  );

  const handleUrlRetryAnalysis = useCallback(async () => {
    if (!sourceUrl) return;
    await handleUrlAnalyzeArticle(sourceUrl, { analyzeOnly: true });
  }, [sourceUrl, handleUrlAnalyzeArticle]);

  const handleYoutubeAnalyzeVideo = useCallback(
    async (url: string, options?: { analyzeOnly?: boolean }) => {
      setInputMode("youtube");
      setFileName(null);
      setSourceUrl(url);
      setExtractError(null);
      setYoutubeAnalysisError(null);
      resetAnalysisState();
      setYoutubePipelineActive(true);
      fireUploadStarted("youtube", extractionMeta, `youtube:${url}`);

      let meta = extractionMeta?.sourceKind === "youtube" ? extractionMeta : null;
      let text = rawText;

      if (!options?.analyzeOnly) {
        setExtractStatus("extracting");

        try {
          const res = await fetch("/api/extract-youtube", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });

          const data = (await res.json()) as ExtractYoutubeApiResponse;

          if (!data.success) {
            setExtractError(data.error);
            setExtractStatus("failed");
            setYoutubePipelineActive(false);
            return;
          }

          text = data.extractedText;
          meta = data.metadata;
          setRawText(text);
          setExtractionMeta(meta);
          setLimitNotice(data.limitNotice ?? null);
          setExtractStatus("ready");
        } catch {
          setExtractError(USER_MESSAGES.network);
          setExtractStatus("failed");
          setYoutubePipelineActive(false);
          return;
        }
      }

      if (!meta || meta.sourceKind !== "youtube" || text.trim().length < 100) {
        setExtractError(USER_MESSAGES.youtubeTranscriptShort);
        setYoutubePipelineActive(false);
        return;
      }

      await runYoutubeAnalysis(text, meta);
      setYoutubePipelineActive(false);
    },
    [extractionMeta, fireUploadStarted, rawText, resetAnalysisState, runYoutubeAnalysis],
  );

  const handleYoutubeRetryAnalysis = useCallback(async () => {
    if (!sourceUrl) return;
    await handleYoutubeAnalyzeVideo(sourceUrl, { analyzeOnly: true });
  }, [sourceUrl, handleYoutubeAnalyzeVideo]);

  const handleInputModeChange = useCallback((mode: WorkspaceInputMode) => {
    setInputMode(mode);
    setExtractError(null);
    setYoutubeAnalysisError(null);
    setUrlAnalysisError(null);
    if (mode === "text") {
      setExtractStatus(rawText.trim().length >= 100 ? "ready" : "idle");
    }
  }, [rawText]);

  const activeStage = useMemo(
    () =>
      resolvePipelineStage(extractStatus, isAnalyzing, hasAnalysisResult),
    [extractStatus, isAnalyzing, hasAnalysisResult],
  );

  const handleAnalyzingChange = useCallback((analyzing: boolean) => {
    setIsAnalyzing(analyzing);
    if (analyzing) setHasAnalysisResult(false);
  }, []);

  const handleRunAnalysis = useCallback(() => {
    fireAnalysisStarted(extractionMeta);
    runAnalysisRef.current?.();
  }, [extractionMeta, fireAnalysisStarted]);

  const sourceLabel = getExtractionSourceLabel(extractionMeta) || fileName;
  const isExtracting =
    extractStatus === "uploading" || extractStatus === "extracting";
  const youtubePipelineBusy =
    youtubePipelineActive || (inputMode === "youtube" && isAnalyzing);
  const urlPipelineBusy = urlPipelineActive || (inputMode === "url" && isAnalyzing);
  const singleActionPipelineBusy = youtubePipelineBusy || urlPipelineBusy;
  const hasPodcastSource = rawText.trim().length >= 100;
  const hasSource = Boolean(extractionMeta || rawText.trim().length >= 100 || fileName || sourceUrl);
  const isFileSourceReady = inputMode === "file" && extractStatus === "ready";
  const isTextSourceReady = inputMode === "text" && rawText.trim().length >= 100;
  const showSourceActionArea = inputMode === "file" || inputMode === "text";
  const canRunAnalysis =
    showSourceActionArea &&
    (inputMode === "file" ? isFileSourceReady : isTextSourceReady) &&
    !isAnalyzing &&
    !isExtracting &&
    !singleActionPipelineBusy;
  const runAnalysisLabel = isAnalyzing
    ? "Analyzing…"
    : isExtracting
      ? "Preparing source…"
      : canRunAnalysis
        ? "Run analysis"
        : "Run analysis";
  const runAnalysisHelper = isAnalyzing
    ? "Generating your analysis."
    : isExtracting
      ? "Extracting text from your source."
      : inputMode === "file"
        ? isFileSourceReady
          ? "Source ready for analysis."
          : "Add a source to start analysis."
        : inputMode === "text"
          ? isTextSourceReady
            ? "Text ready for analysis."
            : "Enter at least 100 characters to start analysis."
          : canRunAnalysis
        ? "Source ready for analysis."
        : "Add a source to start analysis.";
  const podcastSourceProfile = useMemo<PodcastSourceProfile>(() => {
    const extractedCharacterCount =
      extractionMeta?.extractedCharacters ?? rawText.trim().length;
    const analysisCandidateCount = latestAnalysisResult
      ? countPodcastAnalysisCandidates(latestAnalysisResult)
      : null;

    return {
      sourceKind:
        inputMode === "text"
          ? "pasted-text"
          : extractionMeta?.sourceKind ?? null,
      estimatedPages:
        extractionMeta?.sourceKind === "file" ? extractionMeta.estimatedPages : null,
      extractedCharacterCount,
      youtubeDurationMinutes:
        extractionMeta?.sourceKind === "youtube"
          ? extractionMeta.estimatedDurationMinutes
          : null,
      transcriptCharacterCount:
        extractionMeta?.sourceKind === "youtube"
          ? extractedCharacterCount
          : null,
      meaningfulAnalysisCandidateCount: analysisCandidateCount,
    };
  }, [extractionMeta, inputMode, latestAnalysisResult, rawText]);

  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      data-workspace-root
    >
      <header className="border-b border-white/[0.06] pb-5">
        <Badge variant="muted" className="mb-2">
          Workspace
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          New summary
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Upload a file, paste text, or analyze a web article or YouTube video in
          one step. {uploadCopy.limitLine} · source panel stays pinned on desktop.
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          <Link
            href="/login?next=/upload"
            className="text-violet-400/80 hover:text-violet-300"
          >
            Sign in to save analyses.
          </Link>
        </p>
        <TrustSignals variant="compact" className="mt-3" />
      </header>

      <div className="mt-4">
        <PipelineStages activeStage={activeStage} />
      </div>

      <div
        className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start xl:grid-cols-[minmax(0,1fr)_336px]"
        data-workspace-layout
      >
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4 transition-colors hover:border-white/[0.1] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-zinc-400">Input source</p>
              <InputSourceTabs
                active={inputMode}
                onChange={handleInputModeChange}
                disabled={isExtracting || isAnalyzing || singleActionPipelineBusy}
              />
            </div>

            {inputMode === "file" && (
              <UploadZone
                fileName={fileName}
                status={extractStatus}
                error={extractError}
                planId={workspaceEntitlement.entitlementPlanId}
                limitNotice={limitNotice}
                onFileSelected={handleFileSelected}
                disabled={isExtracting || isAnalyzing || singleActionPipelineBusy}
              />
            )}

            {inputMode === "url" && (
              <UrlExtractPanel
                status={extractStatus}
                error={extractError}
                analysisError={urlAnalysisError}
                sourceUrl={sourceUrl}
                pipelineActive={urlPipelineBusy}
                onUrlChange={setSourceUrl}
                onAnalyzeArticle={handleUrlAnalyzeArticle}
                onRetryAnalysis={handleUrlRetryAnalysis}
                disabled={isAnalyzing && !urlPipelineActive}
              />
            )}

            {inputMode === "youtube" && (
              <YoutubeExtractPanel
                status={extractStatus}
                error={extractError}
                analysisError={youtubeAnalysisError}
                sourceUrl={sourceUrl}
                pipelineActive={youtubePipelineBusy}
                onUrlChange={setSourceUrl}
                onAnalyzeVideo={handleYoutubeAnalyzeVideo}
                onRetryAnalysis={handleYoutubeRetryAnalysis}
                disabled={isAnalyzing && !youtubePipelineActive}
              />
            )}

          {showSourceActionArea && (
            <div className={`${isAnalyzing ? "mb-4" : "mb-6"} rounded-xl border border-violet-500/20 bg-violet-950/15 p-4`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  size="sm"
                  disabled={!canRunAnalysis}
                  onClick={handleRunAnalysis}
                >
                  {runAnalysisLabel}
                </Button>
                <span className="text-xs text-zinc-400">{runAnalysisHelper}</span>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="mb-6 rounded-xl border border-violet-500/20 bg-zinc-950/50 p-4 text-sm text-zinc-200">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="font-medium text-violet-200">Generating analysis</p>
                <p className="text-xs text-zinc-400">Creating learn cards</p>
              </div>
              <div className="mt-3 flex gap-2" aria-label="Analysis progress">
                {['Extract', 'Clean', 'Profile', 'Analyze', 'Learn'].map((label, index) => {
                  const completed = index < 3;
                  const active = index === 3;
                  return (
                    <div
                      key={label}
                      className={`relative h-2 flex-1 overflow-hidden rounded-full border ${
                        completed
                          ? 'border-violet-500/35 bg-violet-500/80'
                          : active
                            ? 'border-violet-400/45 bg-violet-950/35'
                            : 'border-white/[0.06] bg-white/[0.06]'
                      }`}
                    >
                      {active && (
                        <div className="absolute inset-y-0 left-0 w-1/2 animate-pulse rounded-full bg-violet-400/70 shadow-[0_0_14px_rgba(167,139,250,0.45)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PodcastWorkspaceCtas
            entitlementPlanId={workspaceEntitlement.entitlementPlanId}
            isPaidActive={workspaceEntitlement.isPaidActive}
            hasSource={hasSource}
            hasAnalysis={hasAnalysisResult}
            sourceProfile={podcastSourceProfile}
            analysisId={latestSavedAnalysisId}
            analysisResult={latestAnalysisResult}
            sourceType={extractionMeta?.sourceKind ?? null}
            sourceLabel={sourceLabel}
            intelligenceMode={analysisMode}
          />

          <PracticeAnalysisCta
            savedToWorkspace={injectedAnalysis?.savedToWorkspace ?? false}
            savedAnalysisId={injectedAnalysis?.savedAnalysisId ?? latestSavedAnalysisId}
            learnCards={latestAnalysisResult?.learnCards}
            analysisContent={latestAnalysisResult ? {
              title: latestAnalysisResult.title,
              summary: latestAnalysisResult.summary,
              keyInsights: latestAnalysisResult.keyInsights,
              risksOrWarnings: latestAnalysisResult.risksOrWarnings,
              actionItems: latestAnalysisResult.actionItems,
            } : undefined}
            entitlementPlanId={workspaceEntitlement.entitlementPlanId}
            isPaidActive={workspaceEntitlement.isPaidActive}
            intelligenceModeId={analysisMode}
            sourceType={extractionMeta?.sourceKind ?? null}
            documentTitle={latestAnalysisResult?.title}
            modeLabel={getIntelligenceModeById(analysisMode)?.label ?? analysisMode}
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

          {inputMode === "text" && (
            <p className="text-xs leading-relaxed text-zinc-500">
              Paste or type your document in the analysis workspace below (min
              100 characters), then run analysis.
            </p>
          )}

        </section>

          <TextAnalysisMvp
            entitlementPlanId={workspaceEntitlement.entitlementPlanId}
            isAuthenticated={workspaceEntitlement.isAuthenticated}
            isPaidActive={workspaceEntitlement.isPaidActive}
            inputMode={inputMode}
            rawText={rawText}
            onRawTextChange={(text) => {
              setRawText(text);
              if (inputMode === "text") {
                resetAnalysisState();
                setExtractStatus(text.trim().length >= 100 ? "ready" : "idle");
                setExtractionMeta(null);
                setFileName(null);
                setSourceUrl(null);
              }
            }}
            mode={analysisMode}
            onModeChange={setAnalysisMode}
            extractStatus={extractStatus}
            extractionMeta={extractionMeta}
            analyzeDisabled={isExtracting || singleActionPipelineBusy}
            hidePrimaryAnalyze
            youtubeAnalysisFailed={Boolean(youtubeAnalysisError)}
            urlAnalysisFailed={Boolean(urlAnalysisError)}
            onRetryYoutubeAnalysis={handleYoutubeRetryAnalysis}
            onRetryUrlAnalysis={handleUrlRetryAnalysis}
            injectedAnalysis={injectedAnalysis}
            onAnalyzingChange={handleAnalyzingChange}
            onAnalysisComplete={setHasAnalysisResult}
            onAnalysisResultChange={setLatestAnalysisResult}
            onSavedAnalysisIdChange={setLatestSavedAnalysisId}
            onIntelligenceReady={setAnalysisIntelligence}
            onAnalyzeReady={(handler) => {
              runAnalysisRef.current = handler;
            }}
            limitNotice={limitNotice}
          />

          <WorkspaceEntitlementBanner entitlement={workspaceEntitlement} />
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-[4.5rem] lg:z-10 lg:max-h-[calc(100vh-5.5rem)] lg:self-start">
          <UploadPreviewPanel
            entitlementPlanId={workspaceEntitlement.entitlementPlanId}
            sourceLabel={sourceLabel}
            intelligenceModeId={analysisMode}
            status={extractStatus}
            metadata={extractionMeta}
            extractedPreview={rawText}
            isAnalyzing={isAnalyzing}
            youtubePipelineActive={youtubePipelineBusy}
            urlPipelineActive={urlPipelineBusy}
            intelligence={analysisIntelligence}
          />
          <DemoWorkflowBlock
            className="hidden lg:block"
            limit={2}
            variant="subtle"
          />
        </div>
      </div>
    </div>
  );
}
