import type {
  AnalysisSourceHint,
  AnalyzeSourceContext,
} from "@/server/intelligence/types";

export function resolveSourceLabel(
  sourceHint?: AnalysisSourceHint,
  sourceContext?: AnalyzeSourceContext,
): string | null {
  if (sourceContext?.sourceKind === "youtube") {
    return sourceContext.title?.trim() || `YouTube · ${sourceContext.videoId}`;
  }
  if (sourceContext?.sourceKind === "presentation") {
    return sourceContext.fileName.trim();
  }
  if (sourceHint === "url") return "Web article";
  if (sourceHint === "file") return "Uploaded document";
  if (sourceHint === "text") return "Pasted text";
  if (sourceHint === "youtube") return "YouTube video";
  if (sourceHint === "presentation") return "Presentation";
  return null;
}
