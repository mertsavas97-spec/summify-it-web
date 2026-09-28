"use client";

import Link from "next/link";
import { uploadPresigned } from "@vercel/blob/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  FileText,
  Globe,
  Headphones,
  Mic,
  PlaySquare,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UnifiedSourceComposer, detectLinkKind } from "./UnifiedSourceComposer";
import { WorkspaceEntitlementBanner } from "./WorkspaceEntitlementBanner";
import { TextAnalysisMvp } from "./TextAnalysisMvp";
import { getPlanLimits } from "@/lib/plans/planLimits";
import {
  FULL_SOURCE_CHAR_LIMIT,
  PORTION_USED_NOTICE,
} from "@/lib/analysis/sourceCoverage";
import { USER_MESSAGES } from "@/lib/user-messages";
import {
  getExtractionSourceLabel,
  type ExtractApiResponse,
  type ExtractUrlApiResponse,
  type ExtractYoutubeApiResponse,
  type ExtractionMetadata,
  type ExtractionErrorCode,
  type UploadExtractStatus,
  type WorkspaceInputMode,
  type YoutubeExtractionMetadata,
} from "@/types/extraction";
import type { AnalysisResult } from "@/types/text-analysis";
import type {
  IntelligenceModeDefinition,
  IntelligenceModeId,
} from "@/types/modes";
import { getIntelligenceModeById } from "@/config/modes";
import { useWorkspaceEntitlement } from "@/hooks/useWorkspaceEntitlement";
import { canRunAnalysis as canRunModeAnalysis, getDefaultIntelligenceModeId } from "@/lib/mode-resolver";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import { buildYoutubeSourceContext } from "@/types/analyze-source";
import { trackEvent } from "@/lib/analytics/events";
import { runTextAnalysis } from "@/lib/run-text-analysis";
import { trackMetaCustomEvent } from "@/lib/metaPixel";
import { getBillingStatusCopy } from "@/lib/billing/provider";
// import { isEduEmail } from "@/lib/auth/edu-email";
import {
  clearPendingAnalysis,
  consumePendingAnalysisForAuthReturn,
  clearHomeResultHandoff,
  readHomeResultHandoff,
  saveAuthReturnTo,
  saveHomeResultHandoff,
  savePendingAnalysis,
} from "@/lib/auth/return-to";
import {
  countPodcastAnalysisCandidates,
  PodcastWorkspaceCtas,
} from "@/components/podcast/PodcastWorkspaceCtas";
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import type { PodcastSourceProfile } from "@/lib/podcast/eligibility";
import { PlanUpgradeModal } from "@/components/pricing/PlanUpgradeModal";
import { UploadPaywallModal } from "./UploadPaywallModal";
import { GuestWorkspaceBanner } from "./GuestWorkspaceBanner";
import { suggestIntelligenceModeForSource, explainModeSuggestionReason } from "@/lib/suggest-intelligence-mode";
import { getEducationalCreatorModeWarning } from "@/lib/educational-source";
import {
  WorkspaceLensPicker,
} from "./WorkspaceLensPicker";
import { DocumentIqCard } from "./DocumentIqCard";
import { LEARNING_EXPERIENCE_OPTIONS } from "@/types/learning-experience";
import { clearGhostSession, saveGhostSession } from "@/lib/ghost-session";
import { consumeAuthJustReturned } from "@/lib/auth/auth-return-flags";
import {
  isAnalysisQuotaError,
  isGuestQuotaError,
} from "@/lib/analysis-quota";
import { analysisSessionResetForTrigger } from "@/lib/analysis-session-reset";
import type { LearningExperienceId } from "@/types/learning-experience";

const WORKSPACE_CARD =
  "rounded-2xl border border-white/[0.07] bg-[#11141d]/70 shadow-sm shadow-black/20 backdrop-blur";
const WORKSPACE_CARD_PADDING = "p-4 sm:p-5";
const LARGE_FILE_DIRECT_UPLOAD_THRESHOLD_BYTES = 3.5 * 1024 * 1024;

function getSourceTypeLabel(inputMode: WorkspaceInputMode, metadata: ExtractionMetadata | null): string {
  if (inputMode === "text") return "Text";
  if (metadata?.sourceKind === "url") return "URL";
  if (metadata?.sourceKind === "youtube") return "YouTube";
  if (metadata?.sourceKind === "presentation") return "File";
  return "File";
}

function getSourceIconElement(inputMode: WorkspaceInputMode, metadata: ExtractionMetadata | null) {
  const className = "h-4 w-4";
  if (inputMode === "text") return <Type className={className} />;
  if (metadata?.sourceKind === "url") return <Globe className={className} />;
  if (metadata?.sourceKind === "youtube") return <PlaySquare className={className} />;
  return <FileText className={className} />;
}

function getSourceTitle({
  inputMode,
  sourceLabel,
  metadata,
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
}): string {
  if (inputMode === "text") return "Pasted text";
  if (metadata?.sourceKind === "url") return metadata.title;
  if (metadata?.sourceKind === "youtube") return metadata.title ?? `YouTube ${metadata.videoId}`;
  if (metadata?.sourceKind === "presentation") return metadata.fileName;
  return sourceLabel ?? "Uploaded source";
}

function getSourceFacts({
  inputMode,
  metadata,
  rawText,
}: {
  inputMode: WorkspaceInputMode;
  metadata: ExtractionMetadata | null;
  rawText: string;
}): string[] {
  const facts: string[] = [];
  const charCount = metadata?.extractedCharacters ?? rawText.trim().length;

  if (metadata?.sourceKind === "file") {
    facts.push(metadata.fileType.toUpperCase());
    facts.push(`~${metadata.estimatedPages} pages`);
  } else if (metadata?.sourceKind === "presentation") {
    facts.push("PPTX");
    facts.push(`${metadata.slideCount} slides`);
  } else if (metadata?.sourceKind === "url") {
    facts.push(metadata.siteName ?? "Web article");
  } else if (metadata?.sourceKind === "youtube") {
    facts.push("Transcript");
    if (metadata.estimatedDurationMinutes != null) {
      facts.push(`~${metadata.estimatedDurationMinutes} min`);
    }
  } else if (inputMode === "text") {
    facts.push("Text");
  }

  if (charCount > 0) {
    facts.push(`${charCount.toLocaleString()} characters`);
  }

  return facts;
}

function CompactSourceReadyCard({
  inputMode,
  sourceLabel,
  metadata,
  rawText,
  onReplace,
  embedded = false,
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
  rawText: string;
  onReplace: () => void;
  embedded?: boolean;
}) {
  const sourceIcon = getSourceIconElement(inputMode, metadata);
  const title = getSourceTitle({ inputMode, sourceLabel, metadata });
  const facts = getSourceFacts({ inputMode, metadata, rawText });

  return (
    <section
      className={
        embedded
          ? "rounded-xl border border-emerald-400/15 bg-emerald-950/15 px-3 py-3"
          : `${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`
      }
      data-workspace-source-ready-card
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            {sourceIcon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Source ready
              </span>
            </div>
            <h2 className="mt-1 break-words text-sm font-semibold text-white [overflow-wrap:anywhere] sm:truncate sm:text-base">
              {title}
            </h2>
            {facts.length > 0 && (
              <p className="mt-0.5 break-words text-xs text-zinc-500 [overflow-wrap:anywhere]">
                {facts.join(" · ")}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onReplace}
          className="self-start rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-violet-400/25 hover:text-violet-200 sm:self-center"
        >
          Replace
        </button>
      </div>
    </section>
  );
}

function SourceReadyActionBar({
  isAnalyzing,
  canRun,
  runAnalysisHelper,
  onRunAnalysis,
}: {
  selectedModeId: IntelligenceModeId;
  isAnalyzing: boolean;
  canRun: boolean;
  runAnalysisHelper: string;
  onRunAnalysis: () => void;
}) {
  const isQuotaLimit =
    isGuestQuotaError(runAnalysisHelper) ||
    isAnalysisQuotaError(runAnalysisHelper) ||
    runAnalysisHelper.includes("Create a free account") ||
    runAnalysisHelper.includes("You've used today's") ||
    runAnalysisHelper.includes("You’ve used today’s");

  const shouldShowDailyLimit = !canRun && isQuotaLimit;

  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      data-workspace-source-ready-action
    >
      <p className="text-xs text-zinc-500">
        {isAnalyzing ? "Summarizing…" : "We'll build your AI summary first."}
      </p>

      {!canRun && isQuotaLimit ? (
        <Button
          type="button"
          size="md"
          onClick={onRunAnalysis}
          className="w-full border border-amber-400/25 bg-gradient-to-r from-amber-950/45 via-zinc-950/70 to-zinc-950 text-amber-50 shadow-[0_0_0_1px_rgba(245,158,11,0.10)] hover:border-amber-300/40 hover:bg-amber-950/55 sm:w-auto sm:min-w-[148px]"
        >
          View plans
        </Button>
      ) : (
        <Button
          type="button"
          size="md"
          disabled={!canRun || isAnalyzing}
          onClick={onRunAnalysis}
          className="w-full shadow-violet-500/25 sm:w-auto sm:min-w-[160px]"
        >
          {isAnalyzing ? "Summarizing..." : "Summarize"}
        </Button>
      )}

      {!shouldShowDailyLimit && !canRun ? (
        <p className="text-[11px] text-zinc-600 sm:order-last sm:basis-full">{runAnalysisHelper}</p>
      ) : null}
    </div>
  );
}

type GeneratingStage = {
  id: string;
  label: string;
  done: boolean;
  active?: boolean;
};

type GeneratingExperienceCopy = {
  stepLabel: string;
  title: string;
  description: string;
  nextHint: string;
  stages: GeneratingStage[];
  shell: string;
  stepTone: string;
  badge: string;
  badgeDot: string;
  activeRing: string;
  activeBg: string;
  activeText: string;
  progressBar: string;
  Icon: typeof Headphones;
  iconWrap: string;
};

function getGeneratingExperienceCopy(
  experienceId: LearningExperienceId,
): GeneratingExperienceCopy {
  if (experienceId === "audio") {
    return {
      stepLabel: "",
      title: "Preparing your audio lesson",
      description: "Analyzing your source first — you’ll generate audio on the next screen.",
      nextHint: "Next: Generate audio lesson",
      stages: [
        { id: "extract", label: "Source ready", done: true },
        { id: "analyze", label: "Writing brief", done: false, active: true },
        { id: "ready", label: "Ready for audio", done: false },
      ],
      shell:
        "border-sky-400/25 bg-gradient-to-b from-sky-950/45 via-[#0d141c]/95 to-[#0a1016] shadow-[0_0_48px_rgba(56,189,248,0.16)]",
      stepTone: "text-sky-300/85",
      badge: "border-sky-400/30 bg-sky-500/15 text-sky-50",
      badgeDot: "bg-sky-300",
      activeRing: "border-sky-400/40 bg-sky-500/20 text-sky-50",
      activeBg: "text-sky-200/90",
      activeText: "text-sky-300/85",
      progressBar: "bg-sky-400",
      Icon: Headphones,
      iconWrap:
        "border-sky-400/30 bg-sky-500/15 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.25)]",
    };
  }

  if (experienceId === "podcast") {
    return {
      stepLabel: "",
      title: "Preparing your podcast brief",
      description: "Analyzing your source first — you’ll start the hosts on the next screen.",
      nextHint: "Next: Generate podcast",
      stages: [
        { id: "extract", label: "Source ready", done: true },
        { id: "analyze", label: "Writing brief", done: false, active: true },
        { id: "ready", label: "Ready for podcast", done: false },
      ],
      shell:
        "border-amber-400/25 bg-gradient-to-b from-amber-950/40 via-[#14100c]/95 to-[#0e0b08] shadow-[0_0_48px_rgba(251,146,60,0.14)]",
      stepTone: "text-amber-300/85",
      badge: "border-amber-400/30 bg-amber-500/15 text-amber-50",
      badgeDot: "bg-amber-300",
      activeRing: "border-amber-400/40 bg-amber-500/20 text-amber-50",
      activeBg: "text-amber-200/90",
      activeText: "text-amber-300/85",
      progressBar: "bg-amber-400",
      Icon: Mic,
      iconWrap:
        "border-amber-400/30 bg-amber-500/15 text-amber-100 shadow-[0_0_24px_rgba(251,146,60,0.22)]",
    };
  }

  return {
    stepLabel: "",
    title: "Building your AI summary",
    description:
      "Summary, key insights, study cards, quiz questions, and a mind map from your source.",
    nextHint: "",
    stages: [
      { id: "extract", label: "Source ready", done: true },
      { id: "analyze", label: "Writing summary & key insights", done: false, active: true },
      { id: "learn", label: "Study cards, quiz & mind map", done: false },
    ],
    shell:
      "border-violet-400/20 bg-gradient-to-b from-violet-950/40 via-[#11141d]/90 to-[#0b0e15] shadow-[0_0_48px_rgba(139,92,246,0.14)]",
    stepTone: "text-violet-300/80",
    badge: "border-violet-400/25 bg-violet-500/15 text-violet-100",
    badgeDot: "bg-violet-300",
    activeRing: "border-violet-400/40 bg-violet-500/20 text-violet-100",
    activeBg: "text-violet-200/90",
    activeText: "text-violet-300/80",
    progressBar: "bg-violet-400",
    Icon: FileText,
    iconWrap:
      "border-violet-400/25 bg-violet-500/15 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.22)]",
  };
}

function GeneratingAnalysisState({
  experienceId,
  sourceTitle,
  modeLabel,
  modeDescription,
}: {
  experienceId: LearningExperienceId;
  sourceTitle?: string | null;
  experienceLabel?: string | null;
  modeLabel?: string | null;
  modeDescription?: string | null;
}) {
  const copy = getGeneratingExperienceCopy(experienceId);
  const Icon = copy.Icon;
  const isListenPath = experienceId === "audio" || experienceId === "podcast";

  return (
    <section
      className={`relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border p-6 sm:p-8 ${copy.shell}`}
      data-workspace-analysis-generating
      data-experience={experienceId}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 generating-surface-shimmer opacity-40"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${copy.iconWrap}`}
            aria-hidden
          >
            <span className="absolute inset-0 animate-ping rounded-2xl bg-current opacity-10" />
            <Icon className="relative h-5 w-5 animate-[generating-icon-breathe_2s_ease-in-out_infinite]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {modeLabel
                ? `${modeLabel}${modeDescription ? ` — ${modeDescription}` : ""}`
                : copy.description}
            </p>
            {sourceTitle ? (
              <p className="mt-1.5 truncate text-xs text-zinc-600">{sourceTitle}</p>
            ) : null}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${copy.badge}`}
        >
          <span
            className={`h-1.5 w-1.5 animate-pulse rounded-full ${copy.badgeDot}`}
            aria-hidden
          />
          Working
        </span>
      </div>

      <ol className="relative mt-6 space-y-3" aria-label="Analysis progress">
        {copy.stages.map((stage, index) => {
          const isActive = Boolean(stage.active);
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  stage.done
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : isActive
                      ? `${copy.activeRing} generating-step-glow`
                      : "border-white/[0.08] bg-white/[0.03] text-zinc-600"
                }`}
              >
                {stage.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-medium ${
                      stage.done
                        ? "text-emerald-100/90"
                        : isActive
                          ? "text-white"
                          : "text-zinc-600"
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isActive ? (
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide ${copy.activeText}`}
                    >
                      In progress
                    </span>
                  ) : stage.done ? (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-400/70">
                      Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
                      Next
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${
                      stage.done
                        ? "w-full bg-emerald-400/80"
                        : isActive
                          ? `generating-progress-indeterminate ${copy.progressBar}`
                          : "w-0"
                    }`}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {isListenPath ? (
        <p
          className={`relative mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-2.5 text-xs leading-relaxed ${copy.activeBg}`}
        >
          <span className="font-semibold text-white/90">{copy.nextHint}.</span>{" "}
          Generation starts when you tap the button on the results screen.
        </p>
      ) : null}
    </section>
  );
}

function AnalysisFailureBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="rounded-2xl border border-amber-500/25 bg-amber-950/20 px-4 py-3"
      data-workspace-analysis-failed
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-100">Analysis failed</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">{message}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onRetry} className="shrink-0">
          Retry analysis
        </Button>
      </div>
    </section>
  );
}

type WorkspacePipelinePhase = "empty" | "ingesting" | "configure" | "analyzing" | "results";

function PostAnalysisRail({
  metadata,
  rawText,
  isAuthenticated,
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
  rawText: string;
  selectedModeId: IntelligenceModeId;
  result: AnalysisResult;
  isAuthenticated: boolean;
}) {
  return (
    <aside className="space-y-3" data-workspace-post-analysis-rail>
      {rawText.trim() ? (
        <DocumentIqCard
          extractedText={rawText}
          metadata={metadata}
          guestSimplified={!isAuthenticated}
          compact
        />
      ) : null}
    </aside>
  );
}

const FUNCTION_PAYLOAD_TOO_LARGE_MESSAGE =
  "This file is too large to send directly. Try again so Summify can use large-file upload.";

function sanitizeBlobFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "document";
}

function createBlobUploadPathname(file: File): string {
  return `uploads/${crypto.randomUUID()}-${sanitizeBlobFileName(file.name)}`;
}

function getStructuredExtractErrorMessage({
  code,
  error,
  requestId,
}: {
  code?: ExtractionErrorCode;
  error?: string;
  requestId?: string;
}): string {
  const base =
    code === "FUNCTION_PAYLOAD_TOO_LARGE"
      ? FUNCTION_PAYLOAD_TOO_LARGE_MESSAGE
      : code === "FILE_TOO_LARGE"
        ? "This file is larger than the current 20 MB limit."
        : code === "BLOB_UPLOAD_FAILED"
          ? "Large-file upload failed. Please try again."
          : code === "BLOB_TOKEN_FAILED"
            ? "Couldn't start large-file upload. Please try again."
            : code === "BLOB_DOWNLOAD_FAILED"
              ? "We uploaded the file, but couldn't prepare it for extraction."
              : code === "PDF_PARSE_FAILED"
                ? "We uploaded the file, but couldn't extract readable text from this PDF."
                : code === "EMPTY_EXTRACTED_TEXT"
                  ? "This document does not appear to contain readable text."
                  : code === "EXTRACTION_TIMEOUT"
                    ? "Extraction took too long. Try again or upload a lighter version."
                    : code === "UNSUPPORTED_FILE_TYPE"
                      ? USER_MESSAGES.extractUnsupported
                      : code === "EXTRACTION_FAILED"
                        ? (error ?? USER_MESSAGES.extractFailed)
                        : code === "UNKNOWN_SERVER_ERROR"
                          ? (error ?? USER_MESSAGES.extractGeneric)
                          : (error ?? USER_MESSAGES.extractGeneric);

  if (requestId && (code === "UNKNOWN_SERVER_ERROR" || code === "EXTRACTION_FAILED")) {
    return `${base} Request ID: ${requestId}`;
  }

  return base;
}

async function tryReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readExtractApiResponse(response: Response): Promise<ExtractApiResponse> {
  const json = await tryReadJson(response);
  const errorData =
    json && typeof json === "object" && "success" in json
      ? (json as ExtractApiResponse)
      : null;

  if (response.status === 413) {
    if (errorData?.success === false) {
      return {
        ...errorData,
        error: getStructuredExtractErrorMessage(errorData),
      };
    }

    return {
      success: false,
      error: FUNCTION_PAYLOAD_TOO_LARGE_MESSAGE,
      code: "FUNCTION_PAYLOAD_TOO_LARGE",
    };
  }

  if (errorData) {
    if (!response.ok && errorData.success === false) {
      return {
        ...errorData,
        error: getStructuredExtractErrorMessage(errorData),
      };
    }
    return errorData;
  }

  if (!response.ok) {
    return {
      success: false,
      error: getStructuredExtractErrorMessage({
        code: "UNKNOWN_SERVER_ERROR",
      }),
      code: "UNKNOWN_SERVER_ERROR",
    };
  }

  return {
    success: false,
    error: USER_MESSAGES.extractGeneric,
    code: "UNKNOWN_SERVER_ERROR",
  };
}

export type InjectedAnalysisPayload = {
  result: AnalysisResult;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceMetadata;
  savedToWorkspace?: boolean;
  savedAnalysisId?: string | null;
};

type UploadWorkspaceProps = {
  /** Homepage embeds the same pipeline without the full-page chrome. */
  surface?: "page" | "home";
  onPhaseChange?: (phase: WorkspacePipelinePhase) => void;
};

export function UploadWorkspace({
  surface = "page",
  onPhaseChange,
}: UploadWorkspaceProps = {}) {
  const isHomeSurface = surface === "home";
  const [restoredPendingAnalysis] = useState(() => {
    const fromAuth = consumePendingAnalysisForAuthReturn({
      justReturned: consumeAuthJustReturned(),
    });
    if (fromAuth) return fromAuth;
    if (surface === "page") return readHomeResultHandoff();
    return null;
  });
  const router = useRouter();
  const workspaceEntitlement = useWorkspaceEntitlement();
  const [inputMode, setInputMode] = useState<WorkspaceInputMode>(
    restoredPendingAnalysis?.inputMode ?? "file",
  );
  const [fileName, setFileName] = useState<string | null>(restoredPendingAnalysis?.fileName ?? null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(restoredPendingAnalysis?.sourceUrl ?? null);
  const [extractStatus, setExtractStatus] =
    useState<UploadExtractStatus>(
      (restoredPendingAnalysis?.extractStatus as UploadExtractStatus | undefined) ?? "idle",
    );
  const [extractStatusMessage, setExtractStatusMessage] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionMeta, setExtractionMeta] =
    useState<ExtractionMetadata | null>(
      (restoredPendingAnalysis?.extractionMeta as ExtractionMetadata | null | undefined) ?? null,
    );
  const [rawText, setRawText] = useState(restoredPendingAnalysis?.rawText ?? "");
  const [analysisMode, setAnalysisMode] = useState<IntelligenceModeId>(
    (restoredPendingAnalysis?.analysisMode as IntelligenceModeId | undefined) ??
      getDefaultIntelligenceModeId(),
  );
  /** Always the latest lens for analyze calls — avoids stale closure after setState. */
  const analysisModeRef = useRef(analysisMode);
  analysisModeRef.current = analysisMode;
  const searchParams = useSearchParams();
  const [learningExperience, setLearningExperience] = useState<LearningExperienceId>(() => {
    const intent = searchParams.get("intent");
    if (intent === "audio" || intent === "podcast") return intent;
    if (intent === "summary") return "summary-learn";
    return "summary-learn";
  });
  const [modeAutoSuggested, setModeAutoSuggested] = useState(false);
  /** Once the user picks a lens, never overwrite it with auto-suggest. */
  const [modeUserOverride, setModeUserOverride] = useState(false);
  const [suggestedModeId, setSuggestedModeId] = useState<IntelligenceModeId | null>(null);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const educationalCreatorWarning = useMemo(
    () =>
      getEducationalCreatorModeWarning({
        modeId: analysisMode,
        inputMode,
        metadata: extractionMeta,
        fileName,
        textSnippet: rawText,
      }),
    [analysisMode, extractionMeta, fileName, inputMode, rawText],
  );
  const [showTextComposer, setShowTextComposer] = useState(
    () => (restoredPendingAnalysis?.inputMode ?? "file") === "text" || Boolean(restoredPendingAnalysis?.rawText?.trim()),
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalysisResult, setHasAnalysisResult] = useState(
    Boolean(restoredPendingAnalysis?.analysisResult),
  );
  const [analysisIntelligence, setAnalysisIntelligence] =
    useState<AnalysisIntelligenceMetadata | null>(
      (restoredPendingAnalysis?.analysisIntelligence as
        | AnalysisIntelligenceMetadata
        | null
        | undefined) ?? null,
    );
  const [youtubePipelineActive, setYoutubePipelineActive] = useState(false);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [youtubeAnalysisError, setYoutubeAnalysisError] = useState<string | null>(
    null,
  );
  const [urlPipelineActive, setUrlPipelineActive] = useState(false);
  const [urlAnalysisError, setUrlAnalysisError] = useState<string | null>(null);
  const [injectedAnalysis, setInjectedAnalysis] =
    useState<InjectedAnalysisPayload | null>(() => {
      const fromPending =
        (restoredPendingAnalysis?.injectedAnalysis as InjectedAnalysisPayload | null | undefined) ??
        null;
      if (fromPending) return fromPending;

      const result =
        (restoredPendingAnalysis?.analysisResult as AnalysisResult | null | undefined) ?? null;
      const intelligence =
        (restoredPendingAnalysis?.analysisIntelligence as
          | AnalysisIntelligenceMetadata
          | null
          | undefined) ?? null;
      if (!result || !intelligence) return null;

      return {
        result,
        providerUsed: "guest-session",
        fallbackUsed: false,
        intelligence,
        savedAnalysisId: restoredPendingAnalysis?.analysisId ?? null,
      };
    });
  const [latestAnalysisResult, setLatestAnalysisResult] =
    useState<AnalysisResult | null>(
      (restoredPendingAnalysis?.analysisResult as AnalysisResult | null | undefined) ?? null,
    );
  const [latestSavedAnalysisId, setLatestSavedAnalysisId] = useState<string | null>(
    restoredPendingAnalysis?.analysisId ?? null,
  );
  const [upgradeMode, setUpgradeMode] = useState<IntelligenceModeDefinition | null>(null);
  const [showAnalysisPaywall, setShowAnalysisPaywall] = useState(false);
  const [analysisQuotaExhausted, setAnalysisQuotaExhausted] = useState(false);
  const modeSectionRef = useRef<HTMLDivElement | null>(null);
  const runAnalysisRef = useRef<null | (() => void)>(null);
  const uploadStartedRef = useRef<Set<string>>(new Set());
  const homeResultRedirected = useRef(false);

  const hydrateCompletedAnalysis = useCallback((payload: InjectedAnalysisPayload) => {
    setInjectedAnalysis(payload);
    setLatestAnalysisResult(payload.result);
    setLatestSavedAnalysisId(payload.savedAnalysisId ?? null);
    setAnalysisIntelligence(payload.intelligence);
    setHasAnalysisResult(true);
  }, []);

  const billing = useMemo(() => getBillingStatusCopy(), []);
  const guestBannerExhausted =
    !workspaceEntitlement.isAuthenticated && analysisQuotaExhausted;

  // Scholar checkout: .edu (or equivalent school) email unlocks Start Scholar.
  const scholarCheckoutEligible = workspaceEntitlement.isEduEligible;

  useEffect(() => {
    if (!restoredPendingAnalysis) return;
    if (restoredPendingAnalysis.analysisId) {
      trackEvent("auth_return_to_restored_analysis" as never, {
        analysisId: restoredPendingAnalysis.analysisId,
        route: restoredPendingAnalysis.returnTo,
      } as never);
    }
    clearPendingAnalysis();
  }, [restoredPendingAnalysis]);

  useEffect(() => {
    function handleRecommendation(event: Event) {
      const detail = (event as CustomEvent<{ modeId?: string }>).detail;
      if (!detail?.modeId) return;
      setAnalysisMode(detail.modeId as IntelligenceModeId);

      // Make it feel “interactive” by scrolling to the mode section after the change.
      // This keeps the UI hierarchy intact while showing the selected mode updated.
      requestAnimationFrame(() => {
        modeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    window.addEventListener(
      "workspace:intelligence-mode-recommendation",
      handleRecommendation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "workspace:intelligence-mode-recommendation",
        handleRecommendation as EventListener,
      );
    };
  }, []);

  const persistPendingAnalysis = useCallback(
    (feature: "audio" | "podcast", returnTo: string) => {
      const safeReturnTo = saveAuthReturnTo(returnTo);
      savePendingAnalysis({
        analysisId: latestSavedAnalysisId,
        returnTo: safeReturnTo,
        inputMode,
        fileName,
        sourceUrl,
        rawText,
        extractStatus,
        extractionMeta,
        analysisMode,
        analysisResult: latestAnalysisResult,
        injectedAnalysis,
        analysisIntelligence,
      });
      trackEvent("auth_return_to_saved" as never, {
        returnTo: safeReturnTo,
        source: "sessionStorage",
      } as never);
      trackEvent("auth_gated_feature_signin_required" as never, {
        feature,
        returnTo: safeReturnTo,
        hasAnalysisId: Boolean(latestSavedAnalysisId),
        hasPendingDocument: Boolean(rawText.trim() || fileName || sourceUrl),
      } as never);
    },
    [analysisIntelligence, analysisMode, extractStatus, extractionMeta, fileName, injectedAnalysis, inputMode, latestAnalysisResult, latestSavedAnalysisId, rawText, sourceUrl],
  );

  const getSourceType = useCallback((mode: WorkspaceInputMode, meta: ExtractionMetadata | null) => {
    if (mode === "file") return "file";
    if (mode === "text") return "text";
    if (meta?.sourceKind === "youtube") return "youtube";
    if (meta?.sourceKind === "url") return "url";
    if (meta?.sourceKind === "presentation") return "file";
    return "unknown";
  }, []);

  const buildGhostCaptureContext = useCallback(
    (overrides?: { sourceKind?: string; sourceLabel?: string | null }) => {
      const sourceKind = overrides?.sourceKind ?? getSourceType(inputMode, extractionMeta);
      let inferredLabel: string | null = null;

      if (extractionMeta?.sourceKind === "youtube") {
        inferredLabel =
          extractionMeta.title?.trim() || `YouTube · ${extractionMeta.videoId}`;
      } else if (extractionMeta?.sourceKind === "url") {
        inferredLabel = sourceUrl?.trim() || "Web article";
      } else {
        inferredLabel =
          fileName?.trim() ||
          sourceUrl?.trim() ||
          (inputMode === "text" ? "Pasted text" : null);
      }

      const sourceLabel = overrides?.sourceLabel ?? inferredLabel;

      return {
        intelligenceModeId: analysisMode,
        sourceKind,
        sourceLabel,
      };
    },
    [analysisMode, extractionMeta, fileName, getSourceType, inputMode, sourceUrl],
  );

  const redirectHomeResultToWorkspace = useCallback(
    (payload: InjectedAnalysisPayload) => {
      if (!isHomeSurface || homeResultRedirected.current) return false;
      homeResultRedirected.current = true;
      if (!workspaceEntitlement.isAuthenticated) {
        saveGhostSession({
          analysisResult: payload.result,
          providerUsed: payload.providerUsed,
          fallbackUsed: payload.fallbackUsed,
          intelligenceMetadata: payload.intelligence,
          ...buildGhostCaptureContext(),
        });
      }
      const saved = saveHomeResultHandoff({
        analysisId: payload.savedAnalysisId ?? null,
        returnTo: "/upload",
        inputMode,
        fileName,
        sourceUrl,
        rawText,
        extractStatus,
        extractionMeta,
        analysisMode: analysisModeRef.current,
        analysisResult: payload.result,
        injectedAnalysis: payload,
        analysisIntelligence: payload.intelligence,
      });
      if (!saved) {
        homeResultRedirected.current = false;
        return false;
      }
      router.push("/upload");
      return true;
    },
    [
      buildGhostCaptureContext,
      extractStatus,
      extractionMeta,
      fileName,
      inputMode,
      isHomeSurface,
      rawText,
      router,
      sourceUrl,
      workspaceEntitlement.isAuthenticated,
    ],
  );

  const persistGuestSaveHandoff = useCallback(() => {
    const safeReturnTo = saveAuthReturnTo("/upload");

    // Guest → account funnel step: guest asked to keep this analysis.
    trackEvent("account_requested", {
      surface: "result_save_banner",
      return_to: safeReturnTo,
    });

    const injected =
      injectedAnalysis ??
      (latestAnalysisResult && analysisIntelligence
        ? {
            result: latestAnalysisResult,
            providerUsed: "guest-session",
            fallbackUsed: false,
            intelligence: analysisIntelligence,
            savedAnalysisId: latestSavedAnalysisId,
          }
        : null);

    if (latestAnalysisResult && analysisIntelligence) {
      saveGhostSession({
        analysisResult: latestAnalysisResult,
        providerUsed: injected?.providerUsed ?? "guest-session",
        fallbackUsed: injected?.fallbackUsed ?? false,
        intelligenceMetadata: analysisIntelligence,
        ...buildGhostCaptureContext(),
      });
    }

    savePendingAnalysis({
      analysisId: latestSavedAnalysisId,
      returnTo: safeReturnTo,
      inputMode,
      fileName,
      sourceUrl,
      rawText,
      extractStatus,
      extractionMeta,
      analysisMode,
      analysisResult: latestAnalysisResult,
      injectedAnalysis: injected,
      analysisIntelligence,
    });
  }, [
    analysisIntelligence,
    analysisMode,
    buildGhostCaptureContext,
    extractStatus,
    extractionMeta,
    fileName,
    injectedAnalysis,
    inputMode,
    latestAnalysisResult,
    latestSavedAnalysisId,
    rawText,
    sourceUrl,
  ]);

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
    setAnalysisQuotaExhausted(false);
    clearGhostSession();
  }, []);

  /** Re-analyze / new URL-YouTube run: keep prior results + ghost so quota 429 does not wipe the handoff. */
  const prepareForReanalyze = useCallback(() => {
    setYoutubeAnalysisError(null);
    setUrlAnalysisError(null);
    setAnalysisQuotaExhausted(false);
  }, []);

  const beginAnalysisPipeline = useCallback(
    (trigger: "url_analyze" | "youtube_analyze" | "retry_analyze") => {
      if (analysisSessionResetForTrigger(trigger) === "abandon_session") {
        resetAnalysisState();
        return;
      }
      prepareForReanalyze();
    },
    [prepareForReanalyze, resetAnalysisState],
  );

  const applySuggestedModeForSource = useCallback(
    (
      meta: ExtractionMetadata | null,
      nextInputMode: WorkspaceInputMode,
      nextFileName?: string | null,
      textSnippet?: string | null,
    ) => {
      const suggested = suggestIntelligenceModeForSource({
        inputMode: nextInputMode,
        metadata: meta,
        fileName: nextFileName ?? fileName,
        entitlementPlanId: workspaceEntitlement.entitlementPlanId,
        textSnippet,
      });
      const reason = explainModeSuggestionReason({
        modeId: suggested,
        inputMode: nextInputMode,
        metadata: meta,
        fileName: nextFileName ?? fileName,
        textSnippet,
      });
      setSuggestedModeId(suggested);
      setSuggestionReason(reason);
      // Never clobber a lens the user already chose.
      if (modeUserOverride) {
        setModeAutoSuggested(true);
        return;
      }
      // Allow upgrade Creator → Student once transcript signals appear.
      const upgradeToStudent =
        modeAutoSuggested &&
        suggested === "the-student" &&
        analysisModeRef.current === "the-creator";
      if (modeAutoSuggested && !upgradeToStudent) return;
      setAnalysisMode(suggested);
      analysisModeRef.current = suggested;
      setModeAutoSuggested(true);
    },
    [
      fileName,
      modeAutoSuggested,
      modeUserOverride,
      workspaceEntitlement.entitlementPlanId,
    ],
  );

  const handleReplaceSource = useCallback(() => {
    setFileName(null);
    setSourceUrl(null);
    setExtractStatus("idle");
    setExtractStatusMessage(null);
    setExtractError(null);
    setExtractionMeta(null);
    setRawText("");
    setLimitNotice(null);
    setYoutubePipelineActive(false);
    setUrlPipelineActive(false);
    setModeAutoSuggested(false);
    setModeUserOverride(false);
    setSuggestedModeId(null);
    setSuggestionReason(null);
    setAnalysisMode(getDefaultIntelligenceModeId());
    analysisModeRef.current = getDefaultIntelligenceModeId();
    resetAnalysisState();
  }, [resetAnalysisState]);

  useEffect(() => {
    function handleRequestNewAnalysis() {
      const confirmed = window.confirm(
        "Start a new analysis? Your current results stay available only if you’ve saved them.",
      );
      if (!confirmed) return;
      handleReplaceSource();
    }

    window.addEventListener("workspace:request-new-analysis", handleRequestNewAnalysis);
    return () => {
      window.removeEventListener("workspace:request-new-analysis", handleRequestNewAnalysis);
    };
  }, [handleReplaceSource]);

  const runYoutubeAnalysis = useCallback(
    async (
      text: string,
      meta: YoutubeExtractionMetadata,
      modeId: IntelligenceModeId = analysisModeRef.current,
    ) => {
      setYoutubeAnalysisError(null);
      setIsAnalyzing(true);

      const analysis = await runTextAnalysis({
        rawText: text,
        mode: modeId,
        sourceHint: "youtube",
        sourceContext: buildYoutubeSourceContext(meta),
      });

      if (!analysis.success) {
        setIsAnalyzing(false);
        setYoutubeAnalysisError(analysis.error);
        if (isAnalysisQuotaError(analysis.error, analysis.errorCode)) {
          setAnalysisQuotaExhausted(true);
          setShowAnalysisPaywall(true);
        }
        return false;
      }

      const youtubePayload: InjectedAnalysisPayload = {
        result: analysis.result,
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        intelligence: analysis.intelligence,
        savedToWorkspace: analysis.savedToWorkspace,
        savedAnalysisId: analysis.savedAnalysisId,
      };
      if (redirectHomeResultToWorkspace(youtubePayload)) return true;

      setIsAnalyzing(false);
      setInjectedAnalysis(youtubePayload);
      setLatestAnalysisResult(analysis.result);
      setLatestSavedAnalysisId(analysis.savedAnalysisId ?? null);
      setAnalysisIntelligence(analysis.intelligence);
      setHasAnalysisResult(true);
      if (!workspaceEntitlement.isAuthenticated) {
        saveGhostSession({
          analysisResult: analysis.result,
          providerUsed: analysis.providerUsed,
          fallbackUsed: analysis.fallbackUsed,
          intelligenceMetadata: analysis.intelligence,
          ...buildGhostCaptureContext({
            sourceKind: "youtube",
            sourceLabel: meta.title?.trim() || `YouTube · ${meta.videoId}`,
          }),
        });
      }
      return true;
    },
    [buildGhostCaptureContext, redirectHomeResultToWorkspace, workspaceEntitlement.isAuthenticated],
  );

  const runUrlAnalysis = useCallback(
    async (
      text: string,
      meta?: ExtractionMetadata | null,
      modeId: IntelligenceModeId = analysisModeRef.current,
    ) => {
      setUrlAnalysisError(null);
      setIsAnalyzing(true);

      const urlMeta = meta?.sourceKind === "url" ? meta : null;
      const analysis = await runTextAnalysis({
        rawText: text,
        mode: modeId,
        sourceHint: "url",
        sourceContext: {
          sourceKind: "url",
          url: urlMeta?.sourceUrl,
          title: urlMeta?.title,
        },
      });

      if (!analysis.success) {
        setIsAnalyzing(false);
        setUrlAnalysisError(analysis.error);
        if (isAnalysisQuotaError(analysis.error, analysis.errorCode)) {
          setAnalysisQuotaExhausted(true);
          setShowAnalysisPaywall(true);
        }
        return false;
      }

      const urlPayload: InjectedAnalysisPayload = {
        result: analysis.result,
        providerUsed: analysis.providerUsed,
        fallbackUsed: analysis.fallbackUsed,
        intelligence: analysis.intelligence,
        savedToWorkspace: analysis.savedToWorkspace,
        savedAnalysisId: analysis.savedAnalysisId,
      };
      if (redirectHomeResultToWorkspace(urlPayload)) return true;

      setIsAnalyzing(false);
      setInjectedAnalysis(urlPayload);
      setLatestAnalysisResult(analysis.result);
      setLatestSavedAnalysisId(analysis.savedAnalysisId ?? null);
      setAnalysisIntelligence(analysis.intelligence);
      setHasAnalysisResult(true);
      if (!workspaceEntitlement.isAuthenticated) {
        saveGhostSession({
          analysisResult: analysis.result,
          providerUsed: analysis.providerUsed,
          fallbackUsed: analysis.fallbackUsed,
          intelligenceMetadata: analysis.intelligence,
          ...buildGhostCaptureContext({
            sourceKind: "url",
            sourceLabel: urlMeta?.title?.trim() || "Web article",
          }),
        });
      }
      return true;
    },
    [buildGhostCaptureContext, redirectHomeResultToWorkspace, workspaceEntitlement.isAuthenticated],
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
    setExtractStatusMessage(null);
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
    const uploadMode =
      file.size > LARGE_FILE_DIRECT_UPLOAD_THRESHOLD_BYTES ? "blob" : "direct";
    trackEvent("upload_started", {
      trigger: "file",
      source_type: file.type || "file",
    });

    try {
      let res: Response;

      if (uploadMode === "blob") {
        setExtractStatusMessage("Uploading large document...");
        const blob = await uploadPresigned(createBlobUploadPathname(file), file, {
          access: "private",
          handleUploadUrl: "/api/upload/blob",
          contentType: file.type,
          multipart: true,
          clientPayload: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        setExtractStatus("extracting");
        setExtractStatusMessage("Preparing document for extraction...");
        res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "blob",
            fileUrl: blob.url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            blobPathname: blob.pathname,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        setExtractStatusMessage("Extracting text...");
        setExtractStatus("extracting");
        res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });
      }

      const data = await readExtractApiResponse(res);

      if (!data.success) {
        setExtractError(data.error);
        setExtractStatus("failed");
        setExtractStatusMessage(null);
        return;
      }

      setRawText(data.extractedText);
      setExtractionMeta(data.metadata);
      setLimitNotice(data.limitNotice ?? null);
      setExtractStatus("ready");
      setExtractStatusMessage("Source ready");
      applySuggestedModeForSource(data.metadata, "file", file.name, data.extractedText);
    } catch (error) {
      const lowerMessage = error instanceof Error ? error.message.toLowerCase() : "";
      const message =
        lowerMessage.includes("client token") || lowerMessage.includes("retrieve the client token")
          ? "Couldn't start large-file upload. Please try again."
          : uploadMode === "blob"
            ? "Large-file upload failed. Please try again."
            : USER_MESSAGES.network;
      setExtractError(message);
      setExtractStatus("failed");
      setExtractStatusMessage(null);
    }
  }, [applySuggestedModeForSource, fireUploadStarted, planLimits.maxUploadMb, resetAnalysisState]);

  const handleUrlAnalyzeArticle = useCallback(
    async (url: string, options?: { analyzeOnly?: boolean }) => {
      setInputMode("url");
      setFileName(null);
      setSourceUrl(url);
      setExtractError(null);
      setUrlAnalysisError(null);
      beginAnalysisPipeline(options?.analyzeOnly ? "retry_analyze" : "url_analyze");
      fireUploadStarted("url", extractionMeta, `url:${url}`);

      let text = rawText;
      let readyMeta: ExtractionMetadata | null =
        extractionMeta?.sourceKind === "url" ? extractionMeta : null;

      if (!options?.analyzeOnly) {
        setUrlPipelineActive(true);
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
          readyMeta = data.metadata;
          setRawText(text);
          setExtractionMeta(data.metadata);
          setLimitNotice(data.limitNotice ?? null);
          setExtractStatus("ready");
          applySuggestedModeForSource(data.metadata, "url", null, text);
          // Stop at Lens configure — do not auto-analyze with a stale/wrong mode.
          setUrlPipelineActive(false);
          return;
        } catch {
          setExtractError(USER_MESSAGES.network);
          setExtractStatus("failed");
          setUrlPipelineActive(false);
          return;
        }
      }

      if (text.trim().length < 100) {
        setExtractError(USER_MESSAGES.urlTooShort);
        return;
      }

      setUrlPipelineActive(true);
      if (readyMeta) {
        applySuggestedModeForSource(readyMeta, "url", null, text);
      }
      await runUrlAnalysis(text, readyMeta, analysisModeRef.current);
      setUrlPipelineActive(false);
    },
    [
      applySuggestedModeForSource,
      beginAnalysisPipeline,
      extractionMeta,
      fireUploadStarted,
      rawText,
      runUrlAnalysis,
    ],
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
      beginAnalysisPipeline(options?.analyzeOnly ? "retry_analyze" : "youtube_analyze");
      fireUploadStarted("youtube", extractionMeta, `youtube:${url}`);

      let meta = extractionMeta?.sourceKind === "youtube" ? extractionMeta : null;
      let text = rawText;

      if (!options?.analyzeOnly) {
        setYoutubePipelineActive(true);
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
          applySuggestedModeForSource(meta, "youtube", null, text);
          // Stop at Lens configure — analysis runs only on Summarize with the selected lens.
          setYoutubePipelineActive(false);
          return;
        } catch {
          setExtractError(USER_MESSAGES.network);
          setExtractStatus("failed");
          setYoutubePipelineActive(false);
          return;
        }
      }

      if (!meta || meta.sourceKind !== "youtube" || text.trim().length < 100) {
        setExtractError(USER_MESSAGES.youtubeTranscriptShort);
        return;
      }

      setYoutubePipelineActive(true);
      applySuggestedModeForSource(meta, "youtube", null, text);
      await runYoutubeAnalysis(text, meta, analysisModeRef.current);
      setYoutubePipelineActive(false);
    },
    [
      applySuggestedModeForSource,
      beginAnalysisPipeline,
      extractionMeta,
      fireUploadStarted,
      rawText,
      runYoutubeAnalysis,
    ],
  );

  const handleYoutubeRetryAnalysis = useCallback(async () => {
    if (!sourceUrl) return;
    await handleYoutubeAnalyzeVideo(sourceUrl, { analyzeOnly: true });
  }, [sourceUrl, handleYoutubeAnalyzeVideo]);

  const handleUnifiedLinkSubmit = useCallback(
    async (url: string) => {
      const kind = detectLinkKind(url);
      if (kind === "youtube") {
        await handleYoutubeAnalyzeVideo(url);
        return;
      }
      await handleUrlAnalyzeArticle(url);
    },
    [handleUrlAnalyzeArticle, handleYoutubeAnalyzeVideo],
  );

  const handleUnifiedRawTextChange = useCallback(
    (text: string) => {
      setInputMode("text");
      setShowTextComposer(true);
      setRawText(text);
      resetAnalysisState();
      const ready = text.trim().length >= 100;
      setExtractStatus(ready ? "ready" : "idle");
      setExtractionMeta(null);
      setFileName(null);
      setSourceUrl(null);
      if (ready) {
        applySuggestedModeForSource(null, "text", null, text);
      } else {
        setModeAutoSuggested(false);
        setModeUserOverride(false);
      }
    },
    [applySuggestedModeForSource, resetAnalysisState],
  );

  const handleAnalyzingChange = useCallback((analyzing: boolean) => {
    setIsAnalyzing(analyzing);
    // Keep prior results visible until a successful run replaces them (quota 429 must not wipe).
  }, []);

  const isDailyFreeLimitReached = useMemo(() => {
    if (workspaceEntitlement.isPaidActive) return false;
    if (analysisQuotaExhausted) return true;
    if (canRunModeAnalysis(analysisMode, workspaceEntitlement.entitlementPlanId)) return false;
    return false;
  }, [
    analysisMode,
    analysisQuotaExhausted,
    workspaceEntitlement.entitlementPlanId,
    workspaceEntitlement.isPaidActive,
  ]);

  const handleRunAnalysis = useCallback(() => {
    if (isDailyFreeLimitReached) {
      setShowAnalysisPaywall(true);
      return;
    }
    fireAnalysisStarted(extractionMeta);

    if (inputMode === "url" && sourceUrl && extractionMeta?.sourceKind === "url") {
      void handleUrlAnalyzeArticle(sourceUrl, { analyzeOnly: true });
      return;
    }
    if (
      inputMode === "youtube" &&
      sourceUrl &&
      extractionMeta?.sourceKind === "youtube"
    ) {
      void handleYoutubeAnalyzeVideo(sourceUrl, { analyzeOnly: true });
      return;
    }

    runAnalysisRef.current?.();
  }, [
    extractionMeta,
    fireAnalysisStarted,
    handleUrlAnalyzeArticle,
    handleYoutubeAnalyzeVideo,
    inputMode,
    isDailyFreeLimitReached,
    sourceUrl,
  ]);

  const sourceLabel = getExtractionSourceLabel(extractionMeta) || fileName;
  const isExtracting =
    extractStatus === "uploading" || extractStatus === "extracting";
  const youtubePipelineBusy =
    youtubePipelineActive || (inputMode === "youtube" && isAnalyzing);
  const urlPipelineBusy = urlPipelineActive || (inputMode === "url" && isAnalyzing);
  const singleActionPipelineBusy = youtubePipelineBusy || urlPipelineBusy;
  const hasSource = Boolean(extractionMeta || rawText.trim().length >= 100 || fileName || sourceUrl);
  const hasUsableSource = Boolean(
    extractionMeta ||
      (inputMode === "text" && rawText.trim().length >= 100) ||
      (inputMode === "file" && extractStatus === "ready" && fileName),
  );

  const pipelineAnalysisFailed = Boolean(youtubeAnalysisError || urlAnalysisError);
  const isEmptyWorkspace =
    !hasSource &&
    extractStatus === "idle" &&
    !isAnalyzing &&
    !singleActionPipelineBusy;

  const completedAnalysisResult =
    hasAnalysisResult ? latestAnalysisResult ?? injectedAnalysis?.result ?? null : null;
  const isCompletedResultWorkspace = Boolean(completedAnalysisResult);

  const workspacePhase = useMemo<WorkspacePipelinePhase>(() => {
    if (isCompletedResultWorkspace) return isHomeSurface ? "analyzing" : "results";
    if (isAnalyzing) return "analyzing";
    if (isExtracting || singleActionPipelineBusy) return "ingesting";
    if (hasUsableSource) return "configure";
    return "empty";
  }, [
    hasUsableSource,
    isAnalyzing,
    isCompletedResultWorkspace,
    isExtracting,
    isHomeSurface,
    singleActionPipelineBusy,
  ]);

  const coverageNotice =
    limitNotice ??
    (!getPlanLimits(workspaceEntitlement.entitlementPlanId).supportsChunkedAnalysis &&
    rawText.trim().length > FULL_SOURCE_CHAR_LIMIT
      ? PORTION_USED_NOTICE
      : null);

  const authReturnTo = isHomeSurface ? "/" : "/upload";

  useEffect(() => {
    if (isHomeSurface) return;
    if (restoredPendingAnalysis?.analysisResult || restoredPendingAnalysis?.injectedAnalysis) {
      const timeoutId = window.setTimeout(() => {
        clearHomeResultHandoff();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const pending = readHomeResultHandoff();
    if (!pending?.analysisResult && !pending?.injectedAnalysis) return;

    const result = (pending.analysisResult as AnalysisResult | null) ?? null;
    const intelligence =
      (pending.analysisIntelligence as AnalysisIntelligenceMetadata | null) ?? null;
    const injected =
      (pending.injectedAnalysis as InjectedAnalysisPayload | null) ??
      (result && intelligence
        ? {
            result,
            providerUsed: "guest-session",
            fallbackUsed: false,
            intelligence,
            savedAnalysisId: pending.analysisId,
          }
        : null);

    if (pending.inputMode) setInputMode(pending.inputMode);
    setFileName(pending.fileName);
    setSourceUrl(pending.sourceUrl);
    if (pending.extractStatus) setExtractStatus(pending.extractStatus as UploadExtractStatus);
    setExtractionMeta((pending.extractionMeta as ExtractionMetadata | null) ?? null);
    setRawText(pending.rawText ?? "");
    if (pending.analysisMode) setAnalysisMode(pending.analysisMode as IntelligenceModeId);
    if (pending.rawText?.trim() || pending.inputMode === "text") setShowTextComposer(true);
    if (intelligence) setAnalysisIntelligence(intelligence);
    if (injected) setInjectedAnalysis(injected);
    if (result) setLatestAnalysisResult(result);
    setLatestSavedAnalysisId(pending.analysisId);
    setHasAnalysisResult(Boolean(result || injected));

    const timeoutId = window.setTimeout(() => {
      clearHomeResultHandoff();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isHomeSurface, restoredPendingAnalysis]);

  useEffect(() => {
    onPhaseChange?.(workspacePhase);
  }, [onPhaseChange, workspacePhase]);

  const isFileSourceReady = inputMode === "file" && extractStatus === "ready";
  const isTextSourceReady = inputMode === "text" && rawText.trim().length >= 100;
  const canRunSourceReadyAnalysis =
    hasUsableSource && !isAnalyzing && !isExtracting && !singleActionPipelineBusy;
  const selectedModeLabel =
    getIntelligenceModeById(analysisMode)?.label ?? analysisMode;
  const runAnalysisHelper = isAnalyzing
    ? "Building your AI summary."
    : isExtracting || singleActionPipelineBusy
      ? "Extracting and preparing your source."
      : hasUsableSource
        ? pipelineAnalysisFailed
          ? "Retry summarize or replace your source."
          : `Source ready · ${selectedModeLabel} · summarize when ready.`
        : inputMode === "file"
          ? isFileSourceReady
            ? "Source ready to summarize."
            : "Add a source to start summarizing."
          : inputMode === "text"
            ? isTextSourceReady
              ? "Text ready to summarize."
              : "Enter at least 100 characters to start summarizing."
            : "Add a source to start summarizing.";
  const handleLensChange = useCallback((modeId: IntelligenceModeId) => {
    setModeUserOverride(true);
    setAnalysisMode(modeId);
    analysisModeRef.current = modeId;
    // Keep suggestion chip only while the suggested mode is still selected.
    if (suggestedModeId && modeId !== suggestedModeId) {
      setSuggestionReason(null);
    } else if (suggestedModeId && modeId === suggestedModeId) {
      setSuggestionReason(
        explainModeSuggestionReason({
          modeId,
          inputMode,
          metadata: extractionMeta,
          fileName,
          textSnippet: rawText,
        }),
      );
    }
  }, [extractionMeta, fileName, inputMode, rawText, suggestedModeId]);
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
  const shouldMountAnalysisEngine =
    workspacePhase === "configure" ||
    workspacePhase === "analyzing" ||
    workspacePhase === "results";
  const showSourceIntake = workspacePhase === "empty" || workspacePhase === "ingesting";

  return (
    <>
      <UploadPaywallModal
        open={showAnalysisPaywall}
        billing={billing}
        scholarCheckoutEligible={scholarCheckoutEligible}
        isAuthenticated={workspaceEntitlement.isAuthenticated}
        onClose={() => setShowAnalysisPaywall(false)}
        onAuthIntent={persistGuestSaveHandoff}
        authReturnTo={authReturnTo}
      />
      <div
        id={isHomeSurface ? "home-workspace" : undefined}
        className={
          isHomeSurface
            ? `w-full min-w-0 overflow-x-hidden ${showAnalysisPaywall ? "blur-sm brightness-75" : ""}`
            : `mx-auto w-full max-w-[1180px] overflow-x-hidden px-4 sm:px-6 lg:px-8 ${
                isEmptyWorkspace && !isCompletedResultWorkspace ? "py-4 sm:py-5" : "py-7 sm:py-9"
              } ${showAnalysisPaywall ? "blur-sm brightness-75" : ""}`
        }
        data-workspace-root
        data-workspace-surface={surface}
      >
      {!isHomeSurface && !isCompletedResultWorkspace && workspacePhase === "empty" && (
      <header className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Add a source
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
              File, link, or text — pick one. We’ll build your AI summary next.
            </p>
          </div>
          <div className="lg:text-right">
            {workspaceEntitlement.ready && !workspaceEntitlement.isAuthenticated ? (
              <Link
                href={`/login?returnTo=${encodeURIComponent(authReturnTo)}`}
                className="text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200"
              >
                Sign in to save analyses
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      )}

      {workspaceEntitlement.ready &&
      !isHomeSurface &&
      !workspaceEntitlement.isAuthenticated &&
      !isCompletedResultWorkspace &&
      workspacePhase !== "analyzing" ? (
        <GuestWorkspaceBanner
          exhausted={guestBannerExhausted}
          className={isEmptyWorkspace ? "mb-3" : "mb-4"}
          compact
          onCreateAccountClick={persistGuestSaveHandoff}
        />
      ) : null}

      {!isCompletedResultWorkspace &&
      workspacePhase === "configure" ? (
        <div className="mx-auto mt-2 mb-1 max-w-xl space-y-1 text-center">
          <p className="text-[11px] font-medium tracking-wide text-zinc-600">
            Source ready · choose lens if needed · summarize
          </p>
          {coverageNotice ? (
            <p className="text-xs text-zinc-400">{coverageNotice}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={`${isCompletedResultWorkspace ? "mt-0" : isEmptyWorkspace ? "mt-3" : "mt-4"} grid min-w-0 gap-3 sm:gap-4 ${
          workspacePhase === "results"
            ? "lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]"
            : ""
        } lg:items-start`}
        data-workspace-layout
        data-workspace-phase={workspacePhase}
      >
        <div
          className={`min-w-0 space-y-4 sm:space-y-5 ${
            workspacePhase === "configure" || workspacePhase === "analyzing"
              ? "mx-auto w-full max-w-xl"
              : ""
          }`}
        >
          {showSourceIntake && (
            <section className={`${WORKSPACE_CARD} p-4 sm:p-5`}>
              <div className="mt-0">
                <UnifiedSourceComposer
                  compact
                  fileName={fileName}
                  extractStatus={extractStatus}
                  extractStatusMessage={extractStatusMessage}
                  extractError={extractError}
                  limitNotice={limitNotice}
                  planId={workspaceEntitlement.entitlementPlanId}
                  rawText={rawText}
                  linkValue={sourceUrl ?? ""}
                  pipelineBusy={singleActionPipelineBusy}
                  showTextInput={showTextComposer || inputMode === "text"}
                  disabled={isAnalyzing}
                  emphasizeChoices={isHomeSurface && workspacePhase === "empty"}
                  onFileSelected={(file) => {
                    setShowTextComposer(false);
                    void handleFileSelected(file);
                  }}
                  onLinkChange={setSourceUrl}
                  onLinkSubmit={handleUnifiedLinkSubmit}
                  onRawTextChange={handleUnifiedRawTextChange}
                  onShowTextInput={() => {
                    setShowTextComposer(true);
                    setInputMode("text");
                  }}
                />
              </div>
            </section>
          )}

          {workspacePhase === "configure" && (
            <section className={`${WORKSPACE_CARD} space-y-4 p-4 sm:p-5`} data-workspace-ready-compose>
              <CompactSourceReadyCard
                inputMode={inputMode}
                sourceLabel={sourceLabel}
                metadata={extractionMeta}
                rawText={rawText}
                onReplace={handleReplaceSource}
                embedded
              />

              {pipelineAnalysisFailed ? (
                <AnalysisFailureBanner
                  message={
                    urlAnalysisError ??
                    youtubeAnalysisError ??
                    "Something went wrong while analyzing this source."
                  }
                  onRetry={() => {
                    if (inputMode === "url") {
                      void handleUrlRetryAnalysis();
                      return;
                    }
                    if (inputMode === "youtube") {
                      void handleYoutubeRetryAnalysis();
                      return;
                    }
                    handleRunAnalysis();
                  }}
                />
              ) : null}

              <div ref={modeSectionRef} data-workspace-intelligence-picker>
                <WorkspaceLensPicker
                  value={analysisMode}
                  entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                  suggestedModeId={suggestedModeId}
                  suggestionReason={suggestionReason}
                  onChange={handleLensChange}
                  onLockedSelect={setUpgradeMode}
                  compactFirst
                />
                {educationalCreatorWarning ? (
                  <p
                    className="mt-2 text-[11px] leading-relaxed text-amber-200/85"
                    role="status"
                  >
                    {educationalCreatorWarning}{" "}
                    <button
                      type="button"
                      className="font-semibold text-amber-50 underline underline-offset-2 hover:text-white"
                      onClick={() => handleLensChange("the-student")}
                    >
                      Switch to The Student
                    </button>
                  </p>
                ) : null}
              </div>

              <SourceReadyActionBar
                selectedModeId={analysisMode}
                isAnalyzing={isAnalyzing}
                canRun={
                  canRunSourceReadyAnalysis &&
                  canRunModeAnalysis(analysisMode, workspaceEntitlement.entitlementPlanId)
                }
                runAnalysisHelper={runAnalysisHelper}
                onRunAnalysis={handleRunAnalysis}
              />
            </section>
          )}

          {workspacePhase === "analyzing" && (
            <GeneratingAnalysisState
              experienceId={learningExperience}
              sourceTitle={getSourceTitle({
                inputMode,
                sourceLabel,
                metadata: extractionMeta,
              })}
              experienceLabel={
                LEARNING_EXPERIENCE_OPTIONS.find((o) => o.id === learningExperience)?.title ??
                learningExperience
              }
              modeLabel={
                learningExperience === "summary-learn"
                  ? getIntelligenceModeById(analysisMode)?.label ?? analysisMode
                  : null
              }
              modeDescription={
                learningExperience === "summary-learn"
                  ? getIntelligenceModeById(analysisMode)?.shortDescription ?? null
                  : null
              }
            />
          )}

          {shouldMountAnalysisEngine && (
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
              onModeChange={handleLensChange}
              extractStatus={extractStatus}
              extractionMeta={extractionMeta}
              analyzeDisabled={isExtracting || singleActionPipelineBusy}
              hidePrimaryAnalyze
              youtubeAnalysisFailed={Boolean(youtubeAnalysisError)}
              urlAnalysisFailed={Boolean(urlAnalysisError)}
              onRetryYoutubeAnalysis={handleYoutubeRetryAnalysis}
              onRetryUrlAnalysis={handleUrlRetryAnalysis}
              injectedAnalysis={injectedAnalysis}
              hideCompletedResult={isHomeSurface}
              onAnalyzingChange={(busy) => {
                if (isHomeSurface && homeResultRedirected.current && !busy) return;
                handleAnalyzingChange(busy);
              }}
              onAnalysisComplete={(done) => {
                if (isHomeSurface) return;
                setHasAnalysisResult(done);
              }}
              onAnalysisResultChange={(result) => {
                if (isHomeSurface) return;
                setLatestAnalysisResult(result);
              }}
              onSavedAnalysisIdChange={setLatestSavedAnalysisId}
              onIntelligenceReady={(intelligence) => {
                if (isHomeSurface) return;
                setAnalysisIntelligence(intelligence);
              }}
              onAnalysisSuccess={({ result, providerUsed, fallbackUsed, intelligence, savedToWorkspace, savedAnalysisId }) => {
                const payload: InjectedAnalysisPayload = {
                  result,
                  providerUsed,
                  fallbackUsed,
                  intelligence,
                  ...(typeof savedToWorkspace === "boolean"
                    ? { savedToWorkspace }
                    : {}),
                  savedAnalysisId: savedAnalysisId ?? null,
                };
                if (redirectHomeResultToWorkspace(payload)) return;
                hydrateCompletedAnalysis(payload);
                if (savedAnalysisId) {
                  setLatestSavedAnalysisId(savedAnalysisId);
                }
                if (!workspaceEntitlement.isAuthenticated) {
                  saveGhostSession({
                    analysisResult: result,
                    providerUsed,
                    fallbackUsed,
                    intelligenceMetadata: intelligence,
                    ...buildGhostCaptureContext(),
                  });
                }
              }}
              learningExperience={learningExperience}
              savedAnalysisId={latestSavedAnalysisId}
              onGuestSaveClick={persistGuestSaveHandoff}
              onExperienceChange={setLearningExperience}
              onNewAnalysis={handleReplaceSource}
              onAnalyzeReady={(handler) => {
                runAnalysisRef.current = handler;
              }}
              deferUntilAnalysisActive={workspacePhase !== "results"}
              limitNotice={coverageNotice}
              onPaywall={() => setShowAnalysisPaywall(true)}
              onAnalysisQuotaExhausted={() => {
                setAnalysisQuotaExhausted(true);
                setShowAnalysisPaywall(true);
              }}
              renderPracticeModule={
                completedAnalysisResult ? ({ onLearnCompleteChange, onStartQuiz }) => (
                  <PracticeAnalysisCta
                    savedToWorkspace={injectedAnalysis?.savedToWorkspace ?? false}
                    savedAnalysisId={injectedAnalysis?.savedAnalysisId ?? latestSavedAnalysisId}
                    learnCards={completedAnalysisResult.learnCards}
                    analysisContent={{
                      title: completedAnalysisResult.title,
                      summary: completedAnalysisResult.summary,
                      keyInsights: completedAnalysisResult.keyInsights,
                      risksOrWarnings: completedAnalysisResult.risksOrWarnings,
                      actionItems: completedAnalysisResult.actionItems,
                    }}
                    entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                    isPaidActive={workspaceEntitlement.isPaidActive}
                    intelligenceModeId={analysisMode}
                    sourceType={extractionMeta?.sourceKind ?? null}
                    sourceChars={extractionMeta?.extractedCharacters ?? null}
                    documentTitle={completedAnalysisResult.title}
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
                    allowInternalQuiz={false}
                    onLearnCompleteChange={onLearnCompleteChange}
                    onStartQuizOverride={onStartQuiz}
                  />
                ) : undefined
              }
              mediaModules={
                completedAnalysisResult
                  ? (view) => (
                    <PodcastWorkspaceCtas
                      entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                      isPaidActive={workspaceEntitlement.isPaidActive}
                      hasSource={hasSource}
                      hasAnalysis={hasAnalysisResult}
                      sourceProfile={podcastSourceProfile}
                      analysisId={latestSavedAnalysisId}
                      analysisResult={completedAnalysisResult}
                      sourceType={extractionMeta?.sourceKind ?? null}
                      sourceLabel={sourceLabel}
                      intelligenceMode={analysisMode}
                      view={view}
                      onAuthRequired={persistPendingAnalysis}
                    />
                  )
                  : undefined
              }
            />
          )}


          {workspacePhase === "empty" ? (
            <WorkspaceEntitlementBanner entitlement={workspaceEntitlement} />
          ) : null}

          {workspacePhase === "results" && completedAnalysisResult && rawText.trim() ? (
            <div className="min-w-0 lg:hidden" data-workspace-document-iq-mobile>
              <DocumentIqCard
                extractedText={rawText}
                metadata={extractionMeta}
                guestSimplified={!workspaceEntitlement.isAuthenticated}
                compact
              />
            </div>
          ) : null}

        </div>

        <div className="hidden min-w-0 space-y-4 lg:sticky lg:top-[4.5rem] lg:z-10 lg:block lg:self-start">
          {workspacePhase === "results" && completedAnalysisResult ? (
            <PostAnalysisRail
              inputMode={inputMode}
              sourceLabel={sourceLabel}
              metadata={extractionMeta}
              rawText={rawText}
              selectedModeId={analysisMode}
              result={completedAnalysisResult}
              isAuthenticated={workspaceEntitlement.isAuthenticated}
            />
          ) : null}
        </div>
      </div>

      <PlanUpgradeModal
        mode={upgradeMode}
        entitlementPlanId={workspaceEntitlement.entitlementPlanId}
        isAuthenticated={workspaceEntitlement.isAuthenticated}
        onClose={() => setUpgradeMode(null)}
      />
      </div>
    </>
  );
}
