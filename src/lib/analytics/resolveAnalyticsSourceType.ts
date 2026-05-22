import type { AnalysisSourceHint } from "@/server/intelligence/types";
import type { AnalyzeSourceContext } from "@/server/intelligence/types";

export type AnalyticsSourceType =
  | "pdf"
  | "pptx"
  | "docx"
  | "txt"
  | "youtube"
  | "web";

const FILE_TYPES = new Set<AnalyticsSourceType>(["pdf", "pptx", "docx", "txt"]);

/**
 * Maps analyze inputs to dashboard source_type buckets.
 */
export function resolveAnalyticsSourceType(input: {
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
  /** From client extraction metadata (e.g. file upload fileType). */
  fileType?: string | null;
}): AnalyticsSourceType {
  const explicit = input.fileType?.trim().toLowerCase();
  if (explicit && FILE_TYPES.has(explicit as AnalyticsSourceType)) {
    return explicit as AnalyticsSourceType;
  }

  if (input.sourceContext?.sourceKind === "youtube") return "youtube";
  if (
    input.sourceContext?.sourceKind === "presentation" ||
    input.sourceHint === "presentation"
  ) {
    return "pptx";
  }
  if (input.sourceHint === "youtube") return "youtube";
  if (input.sourceHint === "url") return "web";
  if (input.sourceHint === "text") return "txt";
  if (input.sourceHint === "file") return "pdf";

  return "txt";
}
