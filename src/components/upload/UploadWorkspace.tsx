"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Check,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  PlaySquare,
  Scale,
  Telescope,
  Type,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "./UploadZone";
import { UploadPreviewPanel } from "./UploadPreviewPanel";
import { WorkspaceEntitlementBanner } from "./WorkspaceEntitlementBanner";
import { TextAnalysisMvp } from "./TextAnalysisMvp";
import { InputSourceTabs } from "./InputSourceTabs";
import { UrlExtractPanel } from "./UrlExtractPanel";
import { YoutubeExtractPanel } from "./YoutubeExtractPanel";
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
  IntelligenceModeCategory,
  IntelligenceModeDefinition,
  IntelligenceModeId,
} from "@/types/modes";
import { getIntelligenceModeById, INTELLIGENCE_MODES } from "@/config/modes";
import { useWorkspaceEntitlement } from "@/hooks/useWorkspaceEntitlement";
import { canRunAnalysis as canRunModeAnalysis, getDefaultIntelligenceModeId } from "@/lib/mode-resolver";
import { getModeAccessState } from "@/lib/mode-access";
import { isModeIncludedInPlan } from "@/lib/plan-features";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import type { PlanId } from "@/types/plan";
import { buildYoutubeSourceContext } from "@/types/analyze-source";
import { trackEvent } from "@/lib/analytics/events";
import { runTextAnalysis } from "@/lib/run-text-analysis";
import { trackMetaCustomEvent } from "@/lib/metaPixel";
import {
  clearPendingAnalysis,
  readPendingAnalysis,
  saveAuthReturnTo,
  savePendingAnalysis,
} from "@/lib/auth/return-to";
import { TrustSignals } from "@/components/growth/TrustSignals";
import { DemoWorkflowBlock } from "@/components/growth/DemoWorkflowBlock";
import {
  countPodcastAnalysisCandidates,
  PodcastWorkspaceCtas,
} from "@/components/podcast/PodcastWorkspaceCtas";
import { PracticeAnalysisCta } from "./PracticeAnalysisCta";
import { WorkspaceUsageWarning } from "./WorkspaceUsageWarning";
import type { PodcastSourceProfile } from "@/lib/podcast/eligibility";
import { PlanUpgradeModal } from "@/components/pricing/PlanUpgradeModal";

const WORKSPACE_CARD =
  "rounded-2xl border border-white/[0.07] bg-[#11141d]/70 shadow-sm shadow-black/20 backdrop-blur";
const WORKSPACE_CARD_PADDING = "p-4 sm:p-5";
const SETUP_STEPS = ["Upload", "Intelligence Mode", "Analyze", "Learn"] as const;
type SetupStep = (typeof SETUP_STEPS)[number];

const MODE_CATEGORY_LABELS: Record<IntelligenceModeCategory, string> = {
  core: "Core",
  academic_study: "Study & Learning",
  business_strategy: "Business & Strategy",
  content_media: "Creative & Media",
  productivity: "Research & Knowledge",
  legal_technical: "Legal & Review",
  creative_advanced: "Creative & Advanced",
};

const MODE_CATEGORY_ORDER: IntelligenceModeCategory[] = [
  "core",
  "academic_study",
  "business_strategy",
  "productivity",
  "content_media",
  "legal_technical",
  "creative_advanced",
];

const PRIMARY_MODE_CARDS: {
  id: IntelligenceModeId;
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "general-summary",
    title: "General Summary",
    description: "Balanced overview of the key ideas.",
    Icon: Layers,
  },
  {
    id: "deep-dive",
    title: "Deep Dive",
    description: "Themes, nuance, structure, and deeper context.",
    Icon: Telescope,
  },
  {
    id: "executive-brief",
    title: "Executive",
    description: "Strategic takeaways, decisions, and next steps.",
    Icon: Briefcase,
  },
  {
    id: "the-student",
    title: "Student",
    description: "Study-friendly explanations and learning points.",
    Icon: GraduationCap,
  },
  {
    id: "contract-analyzer",
    title: "Legal",
    description: "Risks, clauses, obligations, and critical details.",
    Icon: Scale,
  },
  {
    id: "narrative-explorer",
    title: "Storytelling",
    description: "Narrative arc, characters, tension, and creative structure.",
    Icon: BookOpen,
  },
];

function SetupStepper({ activeStep }: { activeStep: SetupStep }) {
  const activeIndex = SETUP_STEPS.indexOf(activeStep);

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Workspace setup">
      {SETUP_STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;
        return (
          <li key={step} className="min-w-0">
            <div
              className={`flex h-10 items-center justify-center rounded-xl border px-2 text-xs font-medium transition-colors ${
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

function EmptyHelperRail() {
  const rows = [
    {
      title: "Supported sources",
      body: "File, text, web articles, YouTube",
    },
    {
      title: "Private by default",
      body: "Sources are processed for extraction and analysis only.",
    },
    {
      title: "Best for",
      body: "Research papers, reports, lectures, long articles",
    },
  ];

  return (
    <aside className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`} data-workspace-empty-helper>
      <div className="space-y-4">
        {rows.map((row) => (
          <section key={row.title} className="border-b border-white/[0.05] pb-4 last:border-0 last:pb-0">
            <h2 className="text-xs font-semibold text-zinc-200">{row.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{row.body}</p>
          </section>
        ))}
      </div>
    </aside>
  );
}

function TextSourceSetup({
  rawText,
  onRawTextChange,
}: {
  rawText: string;
  onRawTextChange: (text: string) => void;
}) {
  const charCount = rawText.trim().length;

  return (
    <div className="space-y-3" data-workspace-empty-text-input>
      <label className="block">
        <span className="text-xs font-medium text-zinc-300">Text source</span>
        <textarea
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          rows={8}
          placeholder="Paste notes, transcripts, article drafts, or long-form text…"
          className="mt-1.5 w-full resize-y rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
      </label>
      <p className="text-[11px] text-zinc-600">
        {charCount} characters · minimum 100 to unlock analysis.
      </p>
    </div>
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

  return (
    <section
      className="rounded-2xl border border-violet-400/15 bg-[#11141d]/75 p-3.5 shadow-[0_0_24px_rgba(139,92,246,0.08)] backdrop-blur sm:p-4"
      data-workspace-source-ready-action
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Ready to analyze</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Source ready · {selectedModeLabel} selected
          </p>
        </div>
        <Button
          type="button"
          size="md"
          disabled={!canRun || isAnalyzing}
          onClick={onRunAnalysis}
          className="shadow-violet-500/25 sm:min-w-[148px]"
        >
          {isAnalyzing ? "Analyzing..." : "Run analysis"}
        </Button>
      </div>
      {!canRun && (
        <p className="mt-2 text-[11px] text-zinc-600">{runAnalysisHelper}</p>
      )}
    </section>
  );
}

function getModePlanLabel(
  mode: IntelligenceModeDefinition,
  access: ReturnType<typeof getModeAccessState>,
) {
  if (access.lockReason === "coming_soon") return "Locked";
  if (access.canAccess) {
    return isModeIncludedInPlan(mode.id, "free") ? "Free" : "Pro";
  }
  return "Upgrade";
}

function getModePlanLabelClass(label: string) {
  if (label === "Free") {
    return "border-emerald-400/15 bg-emerald-500/10 text-emerald-300/90";
  }
  if (label === "Pro") {
    return "border-violet-400/20 bg-violet-500/10 text-violet-200";
  }
  if (label === "Upgrade") {
    return "border-amber-300/15 bg-amber-400/10 text-amber-200/80";
  }
  return "border-white/[0.06] bg-white/[0.025] text-zinc-500";
}

function SourceReadyModeSection({
  selectedModeId,
  entitlementPlanId,
  onModeChange,
  onLockedSelect,
}: {
  selectedModeId: IntelligenceModeId;
  entitlementPlanId: PlanId;
  onModeChange: (mode: IntelligenceModeId) => void;
  onLockedSelect: (mode: IntelligenceModeDefinition) => void;
}) {
  const [showAllModes, setShowAllModes] = useState(false);
  const modesByCategory = MODE_CATEGORY_ORDER.map((category) => ({
    category,
    modes: INTELLIGENCE_MODES.filter((mode) => mode.category === category),
  })).filter((group) => group.modes.length > 0);

  return (
    <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`} data-workspace-source-ready-modes>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Choose your intelligence mode
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Tell Summify how to read this source: summarize, study, extract decisions, or turn it into audio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllModes((value) => !value)}
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition-colors hover:border-violet-300/35 hover:bg-violet-500/15"
        >
          {showAllModes ? "Hide all modes" : "See all intelligence modes"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PRIMARY_MODE_CARDS.map((card) => {
          const mode = getIntelligenceModeById(card.id);
          if (!mode) return null;
          const access = getModeAccessState(mode, entitlementPlanId);
          const selected = selectedModeId === card.id;
          const locked = !access.canAccess;
          const Icon = card.Icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (locked) {
                  onLockedSelect(mode);
                  return;
                }
                onModeChange(card.id);
              }}
              className={`group min-h-[132px] rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-violet-400/35 bg-violet-500/10 shadow-[0_0_22px_rgba(139,92,246,0.14)]"
                  : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.04]"
              } ${locked ? "opacity-75" : ""}`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    selected
                      ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                      : "border-white/[0.07] bg-black/20 text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {selected ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-400/90 text-zinc-950">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : locked ? (
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 text-[10px] text-zinc-500">
                    Locked
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-100">{card.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{card.description}</p>
            </button>
          );
        })}
      </div>

      {showAllModes && (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-100">All intelligence modes</p>
              <p className="text-xs text-zinc-600">Organized by use case, with plan availability shown.</p>
            </div>
            <p className="text-[11px] text-zinc-600">{INTELLIGENCE_MODES.length} total modes</p>
          </div>
          <div className="max-h-[430px] space-y-4 overflow-y-auto pr-1">
            {modesByCategory.map(({ category, modes }) => (
              <section key={category}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  {MODE_CATEGORY_LABELS[category]}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {modes.map((mode) => {
                    const access = getModeAccessState(mode, entitlementPlanId);
                    const selected = selectedModeId === mode.id;
                    const locked = !access.canAccess;
                    const planLabel = getModePlanLabel(mode, access);

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            onLockedSelect(mode);
                            return;
                          }
                          onModeChange(mode.id);
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? "border-violet-400/30 bg-violet-500/10"
                            : "border-white/[0.055] bg-white/[0.018] hover:border-white/[0.1] hover:bg-white/[0.035]"
                        } ${locked ? "opacity-80" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-zinc-100">
                            {mode.label}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getModePlanLabelClass(planLabel)}`}
                          >
                            {planLabel}
                          </span>
                        </div>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                            {mode.shortDescription}
                          </p>
                          {selected && (
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GeneratingAnalysisState() {
  return (
    <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`} data-workspace-analysis-generating>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Generating analysis</h2>
          <p className="mt-1 text-sm text-zinc-500">Creating your structured intelligence workspace.</p>
        </div>
        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          Analyzing
        </span>
      </div>
      <div className="mt-5 flex gap-2" aria-label="Analysis progress">
        {["Extract", "Clean", "Profile", "Analyze", "Learn"].map((label, index) => {
          const completed = index < 3;
          const active = index === 3;
          return (
            <div
              key={label}
              className={`relative h-2 flex-1 overflow-hidden rounded-full border ${
                completed
                  ? "border-violet-500/35 bg-violet-500/80"
                  : active
                    ? "border-violet-400/45 bg-violet-950/35"
                    : "border-white/[0.06] bg-white/[0.06]"
              }`}
              title={label}
            >
              {active && (
                <div className="absolute inset-y-0 left-0 w-1/2 animate-pulse rounded-full bg-violet-400/70 shadow-[0_0_14px_rgba(167,139,250,0.45)]" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SourceReadyRail({
  inputMode,
  sourceLabel,
  metadata,
  rawText,
  selectedModeId,
  onChangeMode,
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
  rawText: string;
  selectedModeId: IntelligenceModeId;
  onChangeMode: () => void;
}) {
  const title = getSourceTitle({ inputMode, sourceLabel, metadata });
  const facts = getSourceFacts({ inputMode, metadata, rawText });
  const mode = getIntelligenceModeById(selectedModeId);

  return (
    <aside className="space-y-4" data-workspace-source-ready-rail>
      <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
        <h2 className="text-xs font-semibold text-zinc-200">Source</h2>
        <p className="mt-2 truncate text-sm font-medium text-white">{title}</p>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600">Type</dt>
            <dd className="text-zinc-400">{getSourceTypeLabel(inputMode, metadata)}</dd>
          </div>
          {facts.map((fact) => (
            <div key={fact} className="flex items-center justify-between gap-3">
              <dt className="text-zinc-600">{fact.includes("characters") ? "Characters" : "Detail"}</dt>
              <dd className="text-right text-zinc-400">{fact}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600">Status</dt>
            <dd className="text-emerald-300/85">Ready</dd>
          </div>
        </dl>
      </section>

      <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-zinc-200">Active mode</h2>
            <p className="mt-2 text-sm font-medium text-violet-100">
              {mode?.label ?? selectedModeId}
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeMode}
            className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-violet-400/25 hover:text-violet-200"
          >
            Change
          </button>
        </div>
        {mode && (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{mode.shortDescription}</p>
        )}
      </section>

      <section className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING}`}>
        <h2 className="text-xs font-semibold text-zinc-200">Private by default</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Your source is used to generate this analysis workspace and is not used to train third-party foundation models.
        </p>
      </section>
    </aside>
  );
}

function PostAnalysisRail({
  inputMode,
  sourceLabel,
  metadata,
  rawText,
  selectedModeId,
  result,
}: {
  inputMode: WorkspaceInputMode;
  sourceLabel: string | null;
  metadata: ExtractionMetadata | null;
  rawText: string;
  selectedModeId: IntelligenceModeId;
  result: AnalysisResult;
}) {
  const title = getSourceTitle({ inputMode, sourceLabel, metadata });
  const facts = getSourceFacts({ inputMode, metadata, rawText });
  const mode = getIntelligenceModeById(selectedModeId);
  const excerpt = rawText.trim().slice(0, 220);

  return (
    <aside className="space-y-4" data-workspace-post-analysis-rail>
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

      {excerpt ? (
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
  "This file produced too much data for the current extraction route. Try again, compress the PDF, or use a smaller version.";

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
        ? "This file is too large for the current extraction route. Try compressing the PDF or uploading a smaller version."
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
  const initialPendingAnalysis = readPendingAnalysis();
  const restoredPendingAnalysis =
    initialPendingAnalysis && initialPendingAnalysis.returnTo.startsWith("/upload")
      ? initialPendingAnalysis
      : null;
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
  const modeSectionRef = useRef<HTMLDivElement | null>(null);
  const runAnalysisRef = useRef<null | (() => void)>(null);
  const uploadStartedRef = useRef<Set<string>>(new Set());

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

  const handleReplaceSource = useCallback(() => {
    setFileName(null);
    setSourceUrl(null);
    setExtractStatus("idle");
    setExtractError(null);
    setExtractionMeta(null);
    setRawText("");
    setLimitNotice(null);
    setYoutubePipelineActive(false);
    setUrlPipelineActive(false);
    resetAnalysisState();
  }, [resetAnalysisState]);

  const scrollToModeSection = useCallback(() => {
    modeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      const data = await readExtractApiResponse(res);

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
  const hasSource = Boolean(extractionMeta || rawText.trim().length >= 100 || fileName || sourceUrl);
  const hasUsableSource = Boolean(
    extractionMeta ||
      (inputMode === "text" && rawText.trim().length >= 100) ||
      (inputMode === "file" && extractStatus === "ready" && fileName),
  );
  const isEmptyWorkspace =
    !hasSource &&
    extractStatus === "idle" &&
    !isAnalyzing &&
    !singleActionPipelineBusy;
  const isSourceReadyWorkspace =
    hasUsableSource &&
    !hasAnalysisResult &&
    !isAnalyzing &&
    !singleActionPipelineBusy &&
    !youtubeAnalysisError &&
    !urlAnalysisError;
  const isGeneratingAnalysisWorkspace =
    hasUsableSource && isAnalyzing && !hasAnalysisResult;
  const setupStep: SetupStep = isAnalyzing
    ? "Analyze"
    : hasAnalysisResult
      ? "Learn"
      : isExtracting || singleActionPipelineBusy
        ? "Upload"
        : hasUsableSource
        ? "Intelligence Mode"
        : "Upload";
  const isFileSourceReady = inputMode === "file" && extractStatus === "ready";
  const isTextSourceReady = inputMode === "text" && rawText.trim().length >= 100;
  const showSourceActionArea = inputMode === "file" || inputMode === "text";
  const canRunAnalysis =
    showSourceActionArea &&
    (inputMode === "file" ? isFileSourceReady : isTextSourceReady) &&
    !isAnalyzing &&
    !isExtracting &&
    !singleActionPipelineBusy;
  const canRunSourceReadyAnalysis =
    hasUsableSource && !isAnalyzing && !isExtracting && !singleActionPipelineBusy;
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
  const completedAnalysisResult =
    hasAnalysisResult ? latestAnalysisResult ?? injectedAnalysis?.result ?? null : null;
  const isCompletedResultWorkspace = Boolean(completedAnalysisResult);

  return (
    <div
      className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
      data-workspace-root
    >
      {!isCompletedResultWorkspace && (
      <header className="pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {!isEmptyWorkspace && (
              <Badge variant="muted" className="mb-3 border-white/[0.06] bg-white/[0.03] text-zinc-400">
                Workspace
              </Badge>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              New summary
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Upload a file, paste text, or add a link. Summify will turn it into a structured intelligence workspace.
            </p>
          </div>
          <div className="lg:text-right">
            <Link
              href="/login?returnTo=/upload"
              className="text-xs font-medium text-violet-300/80 transition-colors hover:text-violet-200"
            >
              Sign in to save analyses
            </Link>
            {!isEmptyWorkspace && (
              <TrustSignals variant="compact" className="mt-3 lg:justify-end" />
            )}
          </div>
        </div>
      </header>
      )}

      {!isCompletedResultWorkspace && (
      <div className={`${WORKSPACE_CARD} ${WORKSPACE_CARD_PADDING} mt-3`}>
        <SetupStepper activeStep={setupStep} />
      </div>
      )}

      <div
        className={`${isCompletedResultWorkspace ? "mt-0" : "mt-5"} grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:grid-cols-[minmax(0,1fr)_340px]`}
        data-workspace-layout
      >
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {isSourceReadyWorkspace && (
            <>
              <CompactSourceReadyCard
                inputMode={inputMode}
                sourceLabel={sourceLabel}
                metadata={extractionMeta}
                rawText={rawText}
                onReplace={handleReplaceSource}
              />
              <SourceReadyActionBar
                selectedModeId={analysisMode}
                isAnalyzing={isAnalyzing}
                canRun={canRunSourceReadyAnalysis && canRunModeAnalysis(analysisMode, workspaceEntitlement.entitlementPlanId)}
                runAnalysisHelper={runAnalysisHelper}
                onRunAnalysis={handleRunAnalysis}
              />
              <div ref={modeSectionRef}>
                <SourceReadyModeSection
                  selectedModeId={analysisMode}
                  entitlementPlanId={workspaceEntitlement.entitlementPlanId}
                  onModeChange={setAnalysisMode}
                  onLockedSelect={setUpgradeMode}
                />
              </div>
            </>
          )}

          {isGeneratingAnalysisWorkspace && <GeneratingAnalysisState />}

          {!isSourceReadyWorkspace && !isGeneratingAnalysisWorkspace && !isCompletedResultWorkspace && (
            <section
              className={`${WORKSPACE_CARD} px-4 pt-4 transition-colors sm:px-5 sm:pt-5 ${
                showSourceActionArea ? "pb-0 sm:pb-0" : "pb-4 sm:pb-5"
              }`}
            >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Input source</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Choose how Summify should read this source.</p>
              </div>
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

            {inputMode === "text" && isEmptyWorkspace && (
              <TextSourceSetup
                rawText={rawText}
                onRawTextChange={(text) => {
                  setRawText(text);
                  resetAnalysisState();
                  setExtractStatus(text.trim().length >= 100 ? "ready" : "idle");
                  setExtractionMeta(null);
                  setFileName(null);
                  setSourceUrl(null);
                }}
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

            {showSourceActionArea && (!isEmptyWorkspace || inputMode === "text") && (
              <div className={`${isAnalyzing ? "mb-4" : ""} mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canRunAnalysis}
                    onClick={handleRunAnalysis}
                    className="shadow-violet-500/25"
                  >
                    {runAnalysisLabel}
                  </Button>
                  <span className="text-xs text-zinc-400">{runAnalysisHelper}</span>
                </div>

                <WorkspaceUsageWarning className="mt-3" />
              </div>
            )}

            {isAnalyzing && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 text-sm text-zinc-200">
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

            </section>
          )}

          {!isEmptyWorkspace && (
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
              deferUntilAnalysisActive={isSourceReadyWorkspace}
              limitNotice={limitNotice}
              practiceModule={
                completedAnalysisResult ? (
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
                  />
                ) : null
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

          {inputMode === "text" && !isSourceReadyWorkspace && !isGeneratingAnalysisWorkspace && !isCompletedResultWorkspace && (
            <p className="text-xs leading-relaxed text-zinc-500">
              Paste or type your document in the analysis workspace (min 100
              characters), then run analysis.
            </p>
          )}

          {!isEmptyWorkspace && !isCompletedResultWorkspace && <WorkspaceEntitlementBanner entitlement={workspaceEntitlement} />}
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-[4.5rem] lg:z-10 lg:max-h-[calc(100vh-5.5rem)] lg:self-start">
          {isEmptyWorkspace ? (
            <EmptyHelperRail />
          ) : isSourceReadyWorkspace || isGeneratingAnalysisWorkspace ? (
            <SourceReadyRail
              inputMode={inputMode}
              sourceLabel={sourceLabel}
              metadata={extractionMeta}
              rawText={rawText}
              selectedModeId={analysisMode}
              onChangeMode={scrollToModeSection}
            />
          ) : hasAnalysisResult && completedAnalysisResult ? (
            <PostAnalysisRail
              inputMode={inputMode}
              sourceLabel={sourceLabel}
              metadata={extractionMeta}
              rawText={rawText}
              selectedModeId={analysisMode}
              result={completedAnalysisResult}
            />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      <PlanUpgradeModal
        mode={upgradeMode}
        entitlementPlanId={workspaceEntitlement.entitlementPlanId}
        isAuthenticated={workspaceEntitlement.isAuthenticated}
        onClose={() => setUpgradeMode(null)}
      />
    </div>
  );
}
