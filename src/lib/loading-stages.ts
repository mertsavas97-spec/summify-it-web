/** Staged intelligence labels — deterministic, no fake percentages. */

export type LoadingStageGroup = "extract" | "analyze" | "youtube" | "web";

export const EXTRACT_LOADING_STAGES = [
  "Extracting document",
  "Cleaning structure",
  "Profiling complexity",
] as const;

export const ANALYZE_LOADING_STAGES = [
  "Profiling complexity",
  "Building knowledge layer",
  "Generating analysis",
  "Creating Learn cards",
] as const;

export const YOUTUBE_PIPELINE_STAGES = [
  "Fetching transcript",
  "Cleaning transcript",
  "Profiling video",
  "Analyzing content",
  "Building Learn layer",
] as const;

export const WEB_PIPELINE_STAGES = [
  "Fetching article",
  "Cleaning article",
  "Profiling source",
  "Analyzing content",
  "Building Learn layer",
] as const;

export function getLoadingStages(group: LoadingStageGroup): readonly string[] {
  switch (group) {
    case "extract":
      return EXTRACT_LOADING_STAGES;
    case "youtube":
      return YOUTUBE_PIPELINE_STAGES;
    case "web":
      return WEB_PIPELINE_STAGES;
    default:
      return ANALYZE_LOADING_STAGES;
  }
}

/** Advance interval (ms) — believable pacing without spam. */
export const LOADING_STAGE_INTERVAL_MS = 2200;
