import { canAccessMode } from "@/lib/mode-access";
import { getDefaultIntelligenceModeId } from "@/lib/mode-resolver";
import type { ExtractionMetadata } from "@/types/extraction";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { WorkspaceInputMode } from "@/types/extraction";

/**
 * Pick the best free-accessible intelligence mode for a source before analysis.
 * Falls back to General Summary when nothing better matches.
 */
export function suggestIntelligenceModeForSource({
  inputMode,
  metadata,
  fileName,
  entitlementPlanId,
}: {
  inputMode: WorkspaceInputMode;
  metadata: ExtractionMetadata | null;
  fileName?: string | null;
  entitlementPlanId: PlanId;
}): IntelligenceModeId {
  const candidates: IntelligenceModeId[] = [];

  if (inputMode === "youtube" || metadata?.sourceKind === "youtube") {
    candidates.push("the-creator", "the-student", "general-summary");
  } else if (
    metadata?.sourceKind === "presentation" ||
    (metadata?.sourceKind === "file" && metadata.fileType === "pptx")
  ) {
    candidates.push("executive-brief", "the-student", "general-summary");
  } else if (inputMode === "url" || metadata?.sourceKind === "url") {
    candidates.push("the-creator", "executive-brief", "general-summary");
  } else {
    const name = (fileName ?? (metadata?.sourceKind === "file" ? metadata.fileName : "") ?? "").toLowerCase();
    if (/contract|legal|nda|agreement|terms|policy/.test(name)) {
      candidates.push("contract-analyzer", "general-summary");
    } else if (/lecture|exam|study|course|notes|textbook|homework/.test(name)) {
      candidates.push("the-student", "general-summary");
    } else if (/deck|pitch|board|strategy|report|brief/.test(name)) {
      candidates.push("executive-brief", "general-summary");
    } else {
      candidates.push("general-summary", "the-student", "executive-brief");
    }
  }

  for (const id of candidates) {
    if (canAccessMode(id, entitlementPlanId)) return id;
  }

  return getDefaultIntelligenceModeId();
}
