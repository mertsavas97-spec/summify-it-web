"use client";

import Link from "next/link";
import { uploadPresigned } from "@vercel/blob/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { LearningExperienceSelector } from "./LearningExperienceSelector";
import { WorkspaceEntitlementBanner } from "./WorkspaceEntitlementBanner";
import { TextAnalysisMvp } from "./TextAnalysisMvp";
import { Badge } from "@/components/ui/Badge";
import { getPlanLimits } from "@/lib/plans/planLimits";
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
  saveAuthReturnTo,
  savePendingAnalysis,
} from "@/lib/auth/return-to";
import { TrustSignals } from "@/components/growth/TrustSignals";
import {
  countPodcastAnalysisCandidates,
  PodcastWorkspaceCtas,
} from "@/components/podcast/PodcastWorkspaceCtas";
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import type { PodcastSourceProfile } from "@/lib/podcast/eligibility";
import { PlanUpgradeModal } from "@/components/pricing/PlanUpgradeModal";
import { UploadPaywallModal } from "./UploadPaywallModal";
import { GuestWorkspaceBanner } from "./GuestWorkspaceBanner";
import { suggestIntelligenceModeForSource } from "@/lib/suggest-intelligence-mode";
import { IntelligenceModeSelector } from "./IntelligenceModeSelector";
import { DocumentIqCard } from "./DocumentIqCard";
import { LEARNING_EXPERIENCE_OPTIONS } from "@/types/learning-experience";
import { clearGhostSession, saveGhostSession } from "@/lib/ghost-session";
import { consumeAuthJustReturned } from "@/lib/auth/auth-return-flags";
import {
  isAnalysisQuotaError,
  isGuestQuotaError,
} from "@/lib/analysis-quota";
import type { LearningExperienceId } from "@/types/learning-experience";

const WORKSPACE_CARD =
  "rounded-2xl border border-white/[0.07] bg-[#11141d]/70 shadow-sm shadow-black/20 backdrop-blur";
const WORKSPACE_CARD_PADDING = "p-4 sm:p-5";
const SETUP_STEPS = ["Source", "Output", "Summarize", "Results"] as const;
const LARGE_FILE_DIRECT_UPLOAD_THRESHOLD_BYTES = 3.5 * 1024 * 1024;
type SetupStep = (typeof SETUP_STEPS)[number];

function SetupStepper({ activeStep, compact = false }: { activeStep: SetupStep; compact?: boolean }) {
  const activeIndex = SETUP_STEPS.indexOf(activeStep);

  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Summarizer setup">
      {SETUP_STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;
        return (
          <li key={step} className="min-w-0">
            <div
              className={`flex items-center justify-center rounded-lg border px-1.5 font-medium transition-colors ${
                compact ? "h-8 text-[10px] sm:text-xs" : "h-10 rounded-xl text-xs"
              } ${
                isActive
                  ? "border-violet-400/35 bg-violet-500/10 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.12)]"
                  : isComplete
                    ? "border-emerald-400/15 bg-emerald-500/10 text-emerald-300/80"
                    : "border-white/[0.055] bg-white/[0.02] text-zinc-600"
              }`}
            >
              {step}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

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
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
  rawText: string;
  onReplace: () => void;
}) {
  const sourceIcon = getSourceIconElement(inputMode, metadata);
  const title = getSourceTitle({ inputMode, sourceLabel, metadata });
  const facts = getSourceFacts({ inputMode, metadata, rawText });

  return (
    <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`} data-workspace-source-ready-card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            {sourceIcon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Source ready
              </span>
              <span className="text-xs text-zinc-500">{getSourceTypeLabel(inputMode, metadata)}</span>
            </div>
            <h2 className="mt-1 truncate text-base font-semibold text-white">{title}</h2>
            {facts.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">{facts.join(" · ")}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onReplace}
          className="self-start rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-violet-400/25 hover:text-violet-200 sm:self-center"
        >
          Replace source
        </button>
      </div>
    </section>
  );
}

function SourceReadyActionBar({
  selectedModeId,
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
  const selectedMode = getIntelligenceModeById(selectedModeId);
  const selectedModeLabel = selectedMode?.label ?? selectedModeId;

  const isQuotaLimit =
    isGuestQuotaError(runAnalysisHelper) ||
    isAnalysisQuotaError(runAnalysisHelper) ||
    runAnalysisHelper.includes("Create a free account") ||
    runAnalysisHelper.includes("You've used today's") ||
    runAnalysisHelper.includes("You’ve used today’s");

  const shouldShowDailyLimit = !canRun && isQuotaLimit;

  return (
    <section
      className="rounded-2xl border border-violet-400/15 bg-[#11141d]/75 p-3.5 shadow-[0_0_24px_rgba(139,92,246,0.08)] backdrop-blur sm:p-4"
      data-workspace-source-ready-action
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Ready to summarize</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Source ready · {selectedModeLabel} selected
          </p>
        </div>

        {!canRun && isQuotaLimit ? (
          <Button
            type="button"
            size="md"
            onClick={onRunAnalysis}
            className="border border-amber-400/25 bg-gradient-to-r from-amber-950/45 via-zinc-950/70 to-zinc-950 text-amber-50 shadow-[0_0_0_1px_rgba(245,158,11,0.10)] hover:border-amber-300/40 hover:bg-amber-950/55 sm:min-w-[168px]"
          >
            View plans
          </Button>
        ) : (
          <Button
            type="button"
            size="md"
            disabled={!canRun || isAnalyzing}
            onClick={onRunAnalysis}
            className="shadow-violet-500/25 sm:min-w-[148px]"
          >
            {isAnalyzing ? "Summarizing..." : "Summarize"}
          </Button>
        )}
      </div>

      {!shouldShowDailyLimit && !canRun ? (
        <p className="mt-2 text-[11px] text-zinc-600">{runAnalysisHelper}</p>
      ) : null}
    </section>
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
      stepLabel: "Step 3 · Prepare audio",
      title: "Preparing your audio lesson",
      description:
        "We're analyzing your source first. Audio is not generated yet — on the next screen you'll create your teacher-style lesson in one click.",
      nextHint: "Next: Generate audio lesson",
      stages: [
        { id: "extract", label: "Extract source", done: true },
        { id: "structure", label: "Structure content", done: true },
        { id: "analyze", label: "Build listening brief", done: false, active: true },
        { id: "ready", label: "Ready to generate audio", done: false },
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
      stepLabel: "Step 3 · Prepare podcast",
      title: "Preparing your podcast studio",
      description:
        "We're analyzing your source first. The two-host podcast isn't generated yet — on the next screen you'll start the conversation when you're ready.",
      nextHint: "Next: Generate podcast",
      stages: [
        { id: "extract", label: "Extract source", done: true },
        { id: "structure", label: "Map talking points", done: true },
        { id: "analyze", label: "Build discussion brief", done: false, active: true },
        { id: "ready", label: "Ready to generate podcast", done: false },
      ],
      shell:
        "border-amber-400/25 bg-gradient-to-b from-amber-950/40 via-[#16120e]/95 to-[#100e0b] shadow-[0_0_48px_rgba(251,146,60,0.14)]",
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
    stepLabel: "Step 3 · Summarize",
    title: "Building your AI summary",
    description:
      "Creating a structured summary, key insights, flashcards, and quiz from your source.",
    nextHint: "Next: Summary, flashcards & quiz",
    stages: [
      { id: "extract", label: "Extract", done: true },
      { id: "structure", label: "Structure", done: true },
      { id: "analyze", label: "Summarize", done: false, active: true },
      { id: "learn", label: "Flashcards & quiz", done: false },
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
  experienceLabel,
  modeLabel,
}: {
  experienceId: LearningExperienceId;
  sourceTitle?: string | null;
  experienceLabel?: string | null;
  modeLabel?: string | null;
}) {
  const copy = getGeneratingExperienceCopy(experienceId);
  const Icon = copy.Icon;
  const isListenPath = experienceId === "audio" || experienceId === "podcast";

  return (
    <section
      className={`mx-auto w-full max-w-xl rounded-3xl border p-6 sm:p-8 ${copy.shell}`}
      data-workspace-analysis-generating
      data-experience={experienceId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${copy.iconWrap}`}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${copy.stepTone}`}
            >
              {copy.stepLabel}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{copy.description}</p>
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

      {(sourceTitle || experienceLabel || modeLabel) && (
        <dl
          className={`mt-5 grid gap-2 rounded-2xl border border-white/[0.06] bg-black/25 p-3 text-xs ${
            modeLabel ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {sourceTitle ? (
            <div className="min-w-0">
              <dt className="text-zinc-600">Source</dt>
              <dd className="mt-0.5 truncate font-medium text-zinc-200">{sourceTitle}</dd>
            </div>
          ) : null}
          {experienceLabel ? (
            <div>
              <dt className="text-zinc-600">Experience</dt>
              <dd className="mt-0.5 font-medium text-zinc-200">{experienceLabel}</dd>
            </div>
          ) : null}
          {modeLabel ? (
            <div>
              <dt className="text-zinc-600">Mode</dt>
              <dd className="mt-0.5 font-medium text-zinc-200">{modeLabel}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <ol className="mt-6 space-y-3" aria-label="Analysis progress">
        {copy.stages.map((stage, index) => {
          const isActive = Boolean(stage.active);
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  stage.done
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : isActive
                      ? copy.activeRing
                      : "border-white/[0.08] bg-white/[0.03] text-zinc-600"
                }`}
              >
                {stage.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
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
                    className={`h-full rounded-full transition-all ${
                      stage.done
                        ? "w-full bg-emerald-400/80"
                        : isActive
                          ? `w-2/3 animate-pulse ${copy.progressBar}`
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
          className={`mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-2.5 text-xs leading-relaxed ${copy.activeBg}`}
        >
          <span className="font-semibold text-white/90">{copy.nextHint}.</span>{" "}
          This step only prepares your source — generation starts when you tap the button on the
          results screen.
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
  inputMode,
  sourceLabel,
  metadata,
  rawText,
  selectedModeId,
  result,
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
  const title = getSourceTitle({ inputMode, sourceLabel, metadata });
  const facts = getSourceFacts({ inputMode, metadata, rawText });
  const mode = getIntelligenceModeById(selectedModeId);
  const excerpt = rawText.trim().slice(0, 220);

  return (
    <aside className="space-y-4" data-workspace-post-analysis-rail>
      {rawText.trim() ? (
        <DocumentIqCard
          extractedText={rawText}
          metadata={metadata}
          guestSimplified={!isAuthenticated}
          compact
        />
      ) : null}

      <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
        <h2 className="text-xs font-semibold text-zinc-200">Source profile</h2>
        <p className="mt-2 truncate text-sm font-medium text-white">{title}</p>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600">Type</dt>
            <dd className="text-zinc-400">{getSourceTypeLabel(inputMode, metadata)}</dd>
          </div>
          {facts.slice(0, 3).map((fact) => (
            <div key={fact} className="flex items-center justify-between gap-3">
              <dt className="text-zinc-600">{fact.includes("characters") ? "Characters" : "Detail"}</dt>
              <dd className="text-right text-zinc-400">{fact}</dd>
            </div>
          ))}
        </dl>
      </section>

      {isAuthenticated ? (
        <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
          <h2 className="text-xs font-semibold text-zinc-200">Analysis profile</h2>
          <p className="mt-2 text-sm font-medium text-white">{mode?.label ?? selectedModeId}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {mode?.shortDescription ?? "Structured Summify analysis."}
          </p>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-600">Insights</dt>
              <dd className="text-zinc-400">{result.keyInsights.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-600">Learn cards</dt>
              <dd className="text-zinc-400">{result.learnCards.length}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {isAuthenticated && excerpt ? (
        <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
          <h2 className="text-xs font-semibold text-zinc-200">Source excerpt</h2>
          <p className="mt-2 line-clamp-5 text-xs leading-relaxed text-zinc-500">
            {excerpt}
            {rawText.trim().length > excerpt.length ? "..." : ""}
          </p>
        </section>
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

export function UploadWorkspace() {
  const [restoredPendingAnalysis] = useState(() =>
    consumePendingAnalysisForAuthReturn({ justReturned: consumeAuthJustReturned() }),
  );
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
  const [learningExperience, setLearningExperience] =
    useState<LearningExperienceId>("summary-learn");
  const [modeAutoSuggested, setModeAutoSuggested] = useState(false);
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
    useState<InjectedAnalysisPayload | null>(
      (restoredPendingAnalysis?.injectedAnalysis as InjectedAnalysisPayload | null | undefined) ??
        null,
    );
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

  // `useWorkspaceEntitlement` does not currently expose profile/email.
  // Keep the same checkout surface but disable edu detection here.
  const scholarCheckoutEligible = false;

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

  const persistGuestSaveHandoff = useCallback(() => {
    saveAuthReturnTo("/upload");
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

  const applySuggestedModeForSource = useCallback(
    (meta: ExtractionMetadata | null, nextInputMode: WorkspaceInputMode, nextFileName?: string | null) => {
      if (modeAutoSuggested) return;
      const suggested = suggestIntelligenceModeForSource({
        inputMode: nextInputMode,
        metadata: meta,
        fileName: nextFileName ?? fileName,
        entitlementPlanId: workspaceEntitlement.entitlementPlanId,
      });
      setAnalysisMode(suggested);
      setModeAutoSuggested(true);
    },
    [fileName, modeAutoSuggested, workspaceEntitlement.entitlementPlanId],
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
    setAnalysisMode(getDefaultIntelligenceModeId());
    resetAnalysisState();
  }, [resetAnalysisState]);


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
        if (isAnalysisQuotaError(analysis.error, analysis.errorCode)) {
          setAnalysisQuotaExhausted(true);
          setShowAnalysisPaywall(true);
        }
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
    [analysisMode, buildGhostCaptureContext, workspaceEntitlement.isAuthenticated],
  );

  const runUrlAnalysis = useCallback(
    async (text: string, meta?: ExtractionMetadata | null) => {
      setUrlAnalysisError(null);
      setIsAnalyzing(true);

      const urlMeta = meta?.sourceKind === "url" ? meta : null;
      const analysis = await runTextAnalysis({
        rawText: text,
        mode: analysisMode,
        sourceHint: "url",
        sourceContext: {
          sourceKind: "url",
          url: urlMeta?.sourceUrl,
          title: urlMeta?.title,
        },
      });

      setIsAnalyzing(false);

      if (!analysis.success) {
        setUrlAnalysisError(analysis.error);
        if (isAnalysisQuotaError(analysis.error, analysis.errorCode)) {
          setAnalysisQuotaExhausted(true);
          setShowAnalysisPaywall(true);
        }
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
    [analysisMode, buildGhostCaptureContext, workspaceEntitlement.isAuthenticated],
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
      applySuggestedModeForSource(data.metadata, "file", file.name);
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
      resetAnalysisState();
      setUrlPipelineActive(true);
      fireUploadStarted("url", extractionMeta, `url:${url}`);

      let text = rawText;
      let readyMeta: ExtractionMetadata | null =
        extractionMeta?.sourceKind === "url" ? extractionMeta : null;

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
          readyMeta = data.metadata;
          setRawText(text);
          setExtractionMeta(data.metadata);
          setLimitNotice(data.limitNotice ?? null);
          setExtractStatus("ready");
          applySuggestedModeForSource(data.metadata, "url");
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

      if (readyMeta) {
        applySuggestedModeForSource(readyMeta, "url");
      }

      await runUrlAnalysis(text, readyMeta);
      setUrlPipelineActive(false);
    },
    [
      applySuggestedModeForSource,
      extractionMeta,
      fireUploadStarted,
      rawText,
      resetAnalysisState,
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
          applySuggestedModeForSource(meta, "youtube");
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

      applySuggestedModeForSource(meta, "youtube");
      await runYoutubeAnalysis(text, meta);
      setYoutubePipelineActive(false);
    },
    [
      applySuggestedModeForSource,
      extractionMeta,
      fireUploadStarted,
      rawText,
      resetAnalysisState,
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
        applySuggestedModeForSource(null, "text");
      } else {
        setModeAutoSuggested(false);
      }
    },
    [applySuggestedModeForSource, resetAnalysisState],
  );

  const handleAnalyzingChange = useCallback((analyzing: boolean) => {
    setIsAnalyzing(analyzing);
    if (analyzing) setHasAnalysisResult(false);
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
    if (isCompletedResultWorkspace) return "results";
    if (isAnalyzing || singleActionPipelineBusy) return "analyzing";
    if (hasUsableSource) return "configure";
    if (isExtracting || singleActionPipelineBusy) return "ingesting";
    return "empty";
  }, [
    hasUsableSource,
    isAnalyzing,
    isCompletedResultWorkspace,
    isExtracting,
    singleActionPipelineBusy,
  ]);

  const setupStep: SetupStep = isAnalyzing
    ? "Summarize"
    : hasAnalysisResult
      ? "Results"
      : pipelineAnalysisFailed
        ? "Summarize"
        : isExtracting || singleActionPipelineBusy
          ? "Source"
          : isEmptyWorkspace
            ? "Source"
            : hasUsableSource
              ? "Output"
              : "Source";
  const isFileSourceReady = inputMode === "file" && extractStatus === "ready";
  const isTextSourceReady = inputMode === "text" && rawText.trim().length >= 100;
  const canRunSourceReadyAnalysis =
    hasUsableSource && !isAnalyzing && !isExtracting && !singleActionPipelineBusy;
  const runAnalysisHelper = isAnalyzing
    ? "Building your AI summary."
    : isExtracting || singleActionPipelineBusy
      ? "Extracting and preparing your source."
      : hasUsableSource
        ? pipelineAnalysisFailed
          ? "Retry summarize or replace your source."
          : "Source ready — pick an output, then summarize."
        : inputMode === "file"
          ? isFileSourceReady
            ? "Source ready to summarize."
            : "Add a source to start summarizing."
          : inputMode === "text"
            ? isTextSourceReady
              ? "Text ready to summarize."
              : "Enter at least 100 characters to start summarizing."
            : "Add a source to start summarizing.";
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
  const showPipelineStepper =
    workspacePhase !== "results" && workspacePhase !== "empty";
  const showSourceIntake = workspacePhase === "empty" || workspacePhase === "ingesting";

  return (
    <>
      <UploadPaywallModal
        open={showAnalysisPaywall}
        billing={billing}
        scholarCheckoutEligible={scholarCheckoutEligible}
        isAuthenticated={workspaceEntitlement.isAuthenticated}
        onClose={() => setShowAnalysisPaywall(false)}
      />
      <div
        className={`mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8 ${
          isEmptyWorkspace && !isCompletedResultWorkspace ? "py-4 sm:py-5" : "py-7 sm:py-9"
        } ${showAnalysisPaywall ? "blur-sm brightness-75" : ""}`}
        data-workspace-root
      >
      {!isCompletedResultWorkspace && workspacePhase !== "analyzing" && (
      <header className={isEmptyWorkspace ? "pb-3" : "pb-5"}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {!isEmptyWorkspace && (
              <Badge variant="muted" className="mb-3 border-white/[0.06] bg-white/[0.03] text-zinc-400">
                AI Summarizer
              </Badge>
            )}
            <h1
              className={`font-semibold tracking-tight text-white ${
                isEmptyWorkspace ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              }`}
            >
              Summarize any PDF, link, or text with AI
            </h1>
            <p
              className={`max-w-2xl text-zinc-400 ${
                isEmptyWorkspace
                  ? "mt-1 text-xs leading-relaxed sm:text-sm"
                  : "mt-2 text-sm leading-relaxed"
              }`}
            >
              {isEmptyWorkspace
                ? "Upload a PDF, PowerPoint, YouTube link, or article — get a structured AI summary, then optional flashcards, quiz, or audio."
                : "One upload. AI summary first — then flashcards, quiz, audio lesson, or podcast."}
            </p>
          </div>
          <div className="lg:text-right">
            {!workspaceEntitlement.isAuthenticated ? (
              <Link
                href="/login?returnTo=/upload"
                className="text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200"
              >
                Sign in to save analyses
              </Link>
            ) : null}
            {!isEmptyWorkspace && (
              <TrustSignals variant="compact" className="mt-3 lg:justify-end" />
            )}
          </div>
        </div>
      </header>
      )}

      {!workspaceEntitlement.isAuthenticated && !isCompletedResultWorkspace ? (
        <GuestWorkspaceBanner
          exhausted={guestBannerExhausted}
          className={isEmptyWorkspace ? "mb-3" : "mb-5"}
          compact={isEmptyWorkspace}
        />
      ) : null}

      {!isCompletedResultWorkspace && workspacePhase !== "analyzing" && !isEmptyWorkspace && showPipelineStepper && (
      <div className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING} mt-3`}>
        <SetupStepper activeStep={setupStep} />
      </div>
      )}

      <div
        className={`${isCompletedResultWorkspace ? "mt-0" : isEmptyWorkspace ? "mt-3" : "mt-5"} grid min-w-0 gap-3 sm:gap-4 ${
          isEmptyWorkspace || workspacePhase === "analyzing"
            ? ""
            : "lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]"
        } lg:items-start`}
        data-workspace-layout
        data-workspace-phase={workspacePhase}
      >
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {showSourceIntake && (
            <section className={`${WORKSPACE_CARD} p-4 sm:p-5`}>
              <div>
                <h2 className="text-sm font-semibold text-white">Upload your source</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  PDF, PowerPoint, DOCX, YouTube, web article, or pasted text.
                </p>
              </div>

              <div className="mt-3">
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

              {workspacePhase === "empty" ? (
                <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
                  <LearningExperienceSelector
                    value={learningExperience}
                    onChange={setLearningExperience}
                    disabled={isAnalyzing || singleActionPipelineBusy}
                  />
                  {learningExperience === "summary-learn" ? (
                    <div
                      ref={modeSectionRef}
                      className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5 sm:p-4"
                      data-workspace-intelligence-picker
                    >
                      <div className="mb-3">
                        <h2 className="text-sm font-semibold text-white">Intelligence mode</h2>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          How Summify should <span className="font-semibold text-zinc-300">summarize</span>{" "}
                          your source.{" "}
                          <span className="font-semibold text-emerald-300/90">Free</span> modes
                          unlock automatically;{" "}
                          <span className="font-semibold text-violet-300/90">Pro</span> modes need
                          an upgrade.
                        </p>
                      </div>
                      <IntelligenceModeSelector
                        value={analysisMode}
                        entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                        onChange={(modeId) => {
                          setModeAutoSuggested(true);
                          setAnalysisMode(modeId);
                        }}
                        onLockedSelect={setUpgradeMode}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          )}

          {workspacePhase === "configure" && (
            <>
              <CompactSourceReadyCard
                inputMode={inputMode}
                sourceLabel={sourceLabel}
                metadata={extractionMeta}
                rawText={rawText}
                onReplace={handleReplaceSource}
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

              <div className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
                <LearningExperienceSelector
                  value={learningExperience}
                  onChange={setLearningExperience}
                  disabled={isAnalyzing}
                />
              </div>

              {learningExperience === "summary-learn" ? (
                <div
                  ref={modeSectionRef}
                  className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}
                  data-workspace-intelligence-picker
                >
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-white">Intelligence mode</h2>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      <span className="font-semibold text-sky-300/90">Auto-selected</span> for this
                      source. Open the menu to browse{" "}
                      <span className="font-semibold text-emerald-300/90">Free</span> and{" "}
                      <span className="font-semibold text-violet-300/90">Pro</span> modes.
                    </p>
                  </div>
                  <IntelligenceModeSelector
                    value={analysisMode}
                    entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                    onChange={(modeId) => {
                      setModeAutoSuggested(true);
                      setAnalysisMode(modeId);
                    }}
                    onLockedSelect={setUpgradeMode}
                  />
                </div>
              ) : null}

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
            </>
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
              onAnalysisSuccess={({ result, providerUsed, fallbackUsed, intelligence, savedToWorkspace, savedAnalysisId }) => {
                hydrateCompletedAnalysis({
                  result,
                  providerUsed,
                  fallbackUsed,
                  intelligence,
                  savedToWorkspace: savedToWorkspace ?? false,
                  savedAnalysisId: savedAnalysisId ?? null,
                });
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
              limitNotice={limitNotice}
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


          {!isEmptyWorkspace &&
            !isCompletedResultWorkspace &&
            workspacePhase !== "analyzing" && (
            <WorkspaceEntitlementBanner entitlement={workspaceEntitlement} />
          )}

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
