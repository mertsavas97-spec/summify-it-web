"use client";

import { getIntelligenceModeById } from "@/config/modes";
import { getCategoryLabelForMode } from "@/lib/mode-groups";
import { formatPlanBadgeLabel, getModeAccessState } from "@/lib/mode-access";
import { canRunAnalysis } from "@/lib/mode-resolver";
import type { PlanId } from "@/types/plan";
import type { ExtractionMetadata, UploadExtractStatus } from "@/types/extraction";
import type { IntelligenceModeId } from "@/types/modes";
import type { AnalysisIntelligenceMetadata, PipelineType } from "@/types/intelligence";
import { formatNumber } from "@/lib/format-number";
import { formatDocumentTypeLabel } from "@/lib/document-type-labels";
import { IntelligenceLoadingStages } from "./IntelligenceLoadingStages";
import { YoutubeThumbnail } from "./YoutubeThumbnail";
import { WEB_PIPELINE_STAGES, YOUTUBE_PIPELINE_STAGES } from "@/lib/loading-stages";

type UploadPreviewPanelProps = {
  sourceLabel: string | null;
  intelligenceModeId: IntelligenceModeId;
  status: UploadExtractStatus;
  metadata: ExtractionMetadata | null;
  extractedPreview?: string;
  isAnalyzing?: boolean;
  youtubePipelineActive?: boolean;
  urlPipelineActive?: boolean;
  intelligence?: AnalysisIntelligenceMetadata | null;
  entitlementPlanId: PlanId;
};

const PIPELINE_LABELS: Record<PipelineType, string> = {
  short_direct: "Direct",
  medium_compacted: "Compacted",
  long_preview: "Preview",
};

const TOKEN_RISK_STYLES = {
  low: "text-zinc-500",
  medium: "text-amber-400/80",
  high: "text-orange-400/80",
} as const;

const COMPLEXITY_STYLES = {
  low: "border-emerald-500/25 bg-emerald-950/20 text-emerald-300",
  medium: "border-amber-500/25 bg-amber-950/20 text-amber-300",
  high: "border-orange-500/25 bg-orange-950/20 text-orange-300",
} as const;

export function UploadPreviewPanel({
  sourceLabel,
  intelligenceModeId,
  status,
  metadata,
  extractedPreview,
  isAnalyzing = false,
  youtubePipelineActive = false,
  urlPipelineActive = false,
  intelligence = null,
  entitlementPlanId,
}: UploadPreviewPanelProps) {
  const intelligenceMode = getIntelligenceModeById(intelligenceModeId);
  const modeAccess = intelligenceMode
    ? getModeAccessState(intelligenceMode, entitlementPlanId)
    : null;
  const modeIsRunnable = canRunAnalysis(intelligenceModeId, entitlementPlanId);

  const singleActionPipelineActive = youtubePipelineActive || urlPipelineActive;

  const previewSnippet =
    metadata?.sourceKind !== "youtube" &&
    metadata?.sourceKind !== "url" &&
    metadata?.sourceKind !== "presentation" &&
    extractedPreview
      ? extractedPreview.slice(0, 420).trim() +
        (extractedPreview.length > 420 ? "…" : "")
      : null;

  const isExtracting = status === "uploading" || status === "extracting";
  const isUrlSource = metadata?.sourceKind === "url";
  const isYoutubeSource = metadata?.sourceKind === "youtube";
  const isPresentationSource = metadata?.sourceKind === "presentation";

  const intelligenceSubtitle = isYoutubeSource
    ? "Video transcript · source understanding"
    : isUrlSource
      ? "Web article · source understanding"
      : isPresentationSource
        ? "Presentation deck · source understanding"
        : metadata?.fileType === "docx"
          ? "Document · source understanding"
          : "Uploaded source · analysis metadata";

  return (
    <aside
      className="relative flex max-h-[calc(100vh-5.5rem)] flex-col overflow-hidden rounded-xl border border-violet-500/15 bg-gradient-to-b from-violet-950/15 via-zinc-950/70 to-zinc-950/90 shadow-lg shadow-black/25"
      data-workspace-source-pane
      data-workspace-preview-panel
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-600/10 to-transparent"
        aria-hidden
      />
      <div className="relative shrink-0 border-b border-white/[0.08] px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
          Document intelligence
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-200">{intelligenceSubtitle}</p>
      </div>

      <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5 sm:p-4">
        {youtubePipelineActive && (
          <IntelligenceLoadingStages
            key="youtube-pipeline-loading"
            active
            stages={YOUTUBE_PIPELINE_STAGES}
          />
        )}
        {urlPipelineActive && (
          <IntelligenceLoadingStages
            key="web-pipeline-loading"
            active
            stages={WEB_PIPELINE_STAGES}
          />
        )}
        {isExtracting && !singleActionPipelineActive && (
          <IntelligenceLoadingStages key="extract-loading" active group="extract" />
        )}
        {isAnalyzing && !singleActionPipelineActive && (
          <IntelligenceLoadingStages key="analyze-loading" active group="analyze" />
        )}

        <section data-workspace-document-source>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Source file
          </p>
          {metadata && sourceLabel ? (
            <div className="mt-2.5 rounded-lg border border-white/[0.1] bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-3 shadow-inner shadow-black/20">
              {isYoutubeSource && (
                <YoutubeThumbnail
                  videoId={metadata.videoId}
                  title={metadata.title}
                  className="mb-2.5"
                />
              )}

              {isYoutubeSource && (
                <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-red-400/70">
                  Video transcript
                </p>
              )}

              {isUrlSource && (
                <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-sky-400/80">
                  Web article
                </p>
              )}

              {isPresentationSource && (
                <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-violet-400/80">
                  Presentation deck
                </p>
              )}

              <p className="truncate text-base font-semibold tracking-tight text-zinc-100">
                {isUrlSource
                  ? metadata.title
                  : isYoutubeSource
                    ? metadata.title ?? `Video ${metadata.videoId}`
                    : isPresentationSource
                      ? metadata.fileName
                      : sourceLabel}
              </p>

              {isYoutubeSource && (
                <p className="mt-1 text-[9px] leading-snug text-zinc-600">
                  Spoken transcript — filler and punctuation may vary.
                </p>
              )}

              {isUrlSource && (
                <p className="mt-1 text-[9px] leading-snug text-zinc-600">
                  Article-based analysis. Some websites may remove context, comments,
                  menus, or interactive elements.
                </p>
              )}

              <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-500">Type</span>
                  <span className="font-medium text-zinc-300">
                    {isUrlSource
                      ? "Web Article"
                      : isYoutubeSource
                        ? "YouTube Transcript"
                        : isPresentationSource
                          ? "Presentation Deck"
                          : metadata.fileType.toUpperCase()}
                  </span>
                </div>
                {isYoutubeSource ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Video ID</span>
                      <span className="font-mono text-zinc-400">{metadata.videoId}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-600">URL</span>
                      <a
                        href={metadata.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-violet-400/90 hover:text-violet-300"
                      >
                        {metadata.sourceUrl}
                      </a>
                    </div>
                    {metadata.transcriptSegmentCount != null && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-600">Segments</span>
                        <span className="tabular-nums text-zinc-400">
                          {formatNumber(metadata.transcriptSegmentCount)}
                        </span>
                      </div>
                    )}
                    {metadata.estimatedDurationMinutes != null && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-600">Duration</span>
                        <span className="tabular-nums text-zinc-400">
                          ~{metadata.estimatedDurationMinutes} min
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Reading</span>
                      <span className="tabular-nums text-zinc-400">
                        ~{metadata.estimatedReadingTimeMinutes} min
                      </span>
                    </div>
                  </>
                ) : isPresentationSource ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Slides</span>
                      <span className="tabular-nums text-zinc-400">
                        {formatNumber(metadata.slideCount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Titles detected</span>
                      <span className="tabular-nums text-zinc-400">
                        {formatNumber(metadata.detectedTitleCount)}
                      </span>
                    </div>
                    {metadata.repeatedThemes.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-600">Themes</span>
                        <span className="font-medium text-zinc-300">
                          {metadata.repeatedThemes.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Reading</span>
                      <span className="tabular-nums text-zinc-400">
                        ~{metadata.estimatedReadingTimeMinutes} min
                      </span>
                    </div>
                  </>
                ) : isUrlSource ? (
                  <>
                    {metadata.siteName && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-600">Site</span>
                        <span className="truncate text-zinc-400">{metadata.siteName}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-600">URL</span>
                      <a
                        href={metadata.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-violet-400/90 hover:text-violet-300"
                      >
                        {metadata.sourceUrl}
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600">Reading</span>
                      <span className="tabular-nums text-zinc-400">
                        ~{metadata.estimatedReadingTimeMinutes} min
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-600">Est. pages</span>
                    <span className="tabular-nums text-zinc-400">
                      {metadata.estimatedPages}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Characters</span>
                  <span className="tabular-nums text-zinc-400">
                    {formatNumber(metadata.extractedCharacters)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Complexity</span>
                  <span
                    className={`inline-flex rounded-md border px-1.5 py-0.5 font-medium capitalize ${COMPLEXITY_STYLES[metadata.complexity]}`}
                  >
                    {metadata.complexity}
                  </span>
                </div>
              </div>
              {metadata.truncated && (
                <p className="mt-2 text-[10px] leading-relaxed text-amber-400/90">
                  Truncated to analysis character limit.
                </p>
              )}
            </div>
          ) : sourceLabel ? (
            <p className="mt-2 text-xs text-zinc-500">
              {isExtracting || singleActionPipelineActive
                ? "Processing…"
                : "Awaiting extraction…"}
            </p>
          ) : (
            <p className="mt-2 rounded-lg border border-dashed border-white/[0.06] py-6 text-center text-xs text-zinc-600">
              Add a file, URL, YouTube link, or text to build a source profile
            </p>
          )}
        </section>

        {isPresentationSource && metadata.slideOutline.length > 0 && (
          <section data-workspace-slide-outline>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Slide outline
            </p>
            <ol className="mt-2 space-y-1 text-[10px]">
              {metadata.slideOutline.map((slide) => (
                <li key={slide.slideNumber} className="leading-snug">
                  <span className="font-medium text-zinc-400/95">
                    {slide.displayLabel}
                  </span>
                  {slide.preview && (
                    <span className="mt-0.5 block text-[9px] leading-snug text-zinc-600/80">
                      {slide.preview}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {previewSnippet && (
          <section data-workspace-source-excerpt>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Extracted excerpt
            </p>
            <blockquote className="mt-2 border-l-2 border-violet-500/40 bg-zinc-900/50 py-2 pl-3 pr-2">
              <p className="font-serif text-[12px] leading-[1.65] text-zinc-400">
                {previewSnippet}
              </p>
            </blockquote>
          </section>
        )}

        {intelligence?.adaptationLabel && (
          <p className="rounded-md border border-violet-500/20 bg-violet-950/25 px-2 py-1 text-[10px] text-violet-300/90">
            Adapted for: {intelligence.adaptationLabel}
          </p>
        )}

        {intelligence && (
          <section data-workspace-intelligence-profile>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Analysis profile
            </p>
            <div className="mt-2 rounded-lg border border-white/[0.08] bg-zinc-900/60 p-3 text-[11px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Type</span>
                  <span className="text-right text-zinc-400">
                    {formatDocumentTypeLabel(intelligence.profile.documentTypeGuess)}
                  </span>
                </div>
                {intelligence.profile.sourceQualityNote && (
                  <p className="text-[10px] leading-relaxed text-amber-400/85">
                    {intelligence.profile.sourceQualityNote}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Reading</span>
                  <span className="tabular-nums text-zinc-400">
                    ~{intelligence.profile.estimatedReadingTimeMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Complexity</span>
                  <span
                    className={`inline-flex rounded-md border px-1.5 py-0.5 font-medium capitalize ${COMPLEXITY_STYLES[intelligence.profile.complexity]}`}
                  >
                    {intelligence.profile.complexity}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Pipeline</span>
                  <span className="font-medium text-zinc-300">
                    {PIPELINE_LABELS[intelligence.adaptivePlan.pipelineType]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Token risk</span>
                  <span
                    className={`capitalize ${TOKEN_RISK_STYLES[intelligence.tokenBudget.riskLevel]}`}
                  >
                    {intelligence.tokenBudget.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section data-workspace-intelligence-lens className="opacity-90">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-600">
            Intelligence lens
          </p>
          <div className="mt-2 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-medium text-violet-200">
                {intelligenceMode?.label ?? intelligenceModeId}
              </p>
              {modeAccess?.effectiveAvailability === "locked" &&
                modeAccess.upgradePlanId && (
                <span className="rounded border border-violet-500/25 bg-violet-950/30 px-1 py-px text-[8px] font-medium uppercase text-violet-300/90">
                  {formatPlanBadgeLabel(modeAccess.upgradePlanId)}
                </span>
              )}
              {modeAccess?.effectiveAvailability === "coming_soon" && (
                <span className="rounded border border-zinc-600/40 bg-zinc-800/40 px-1 py-px text-[8px] font-medium uppercase text-zinc-500">
                  Soon
                </span>
              )}
              {modeIsRunnable && (
                <span className="rounded border border-emerald-500/25 bg-emerald-950/30 px-1 py-px text-[8px] font-medium uppercase text-emerald-400/90">
                  Available
                </span>
              )}
            </div>
            {intelligenceMode && (
              <>
                <p className="mt-1 text-[10px] text-violet-400/70">
                  {getCategoryLabelForMode(intelligenceModeId)}
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                  {intelligenceMode.shortDescription}
                </p>
              </>
            )}
            {!modeIsRunnable && (
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
                Change mode in the analysis workspace to run analysis.
              </p>
            )}
          </div>
        </section>
      </div>

      <footer className="shrink-0 border-t border-white/[0.06] bg-zinc-900/30 px-4 py-3">
        <p className="text-[10px] leading-relaxed text-zinc-600">
          {status === "ready"
            ? isYoutubeSource
              ? "Transcript feeds analysis — results appear in the workspace."
              : isPresentationSource
                ? "Slide text feeds analysis — results appear in the workspace."
                : "Source text feeds the analysis workspace on the left."
            : "Intelligence profile updates after extraction."}
        </p>
      </footer>
    </aside>
  );
}
