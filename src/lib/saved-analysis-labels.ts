import { getModeLabel } from "@/lib/mode-resolver";
import type { IntelligenceModeId } from "@/types/modes";

const SOURCE_KIND_LABELS: Record<string, string> = {
  youtube: "YouTube",
  presentation: "Presentation",
  url: "Web article",
  file: "Upload",
  text: "Text",
};

export function getSourceKindLabel(sourceKind: string | null | undefined): string {
  if (!sourceKind) return "Document";
  return SOURCE_KIND_LABELS[sourceKind] ?? sourceKind;
}

export function getIntelligenceModeLabel(modeId: string | null | undefined): string {
  if (!modeId) return "Intelligence";
  try {
    return getModeLabel(modeId as IntelligenceModeId);
  } catch {
    return modeId;
  }
}

export function getSavedAnalysisPreview(
  summary: { summary?: string; title?: string } | null | undefined,
  maxLen = 140,
): string {
  const text = summary?.summary?.trim() || summary?.title?.trim() || "";
  if (!text) return "No preview available.";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trimEnd()}…`;
}
