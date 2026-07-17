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
  if (sourceContext?.sourceKind === "file") {
    return sourceContext.fileName?.trim() || "Uploaded document";
  }
  if (sourceContext?.sourceKind === "url") {
    return sourceContext.title?.trim() || sourceContext.url?.trim() || "Web article";
  }
  if (sourceContext?.sourceKind === "text") {
    return sourceContext.label?.trim() || "Pasted text";
  }
  if (sourceHint === "url") return "Web article";
  if (sourceHint === "file") return "Uploaded document";
  if (sourceHint === "text") return "Pasted text";
  if (sourceHint === "youtube") return "YouTube video";
  if (sourceHint === "presentation") return "Presentation";
  return null;
}
