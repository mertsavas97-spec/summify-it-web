import { canAccessMode } from "@/lib/mode-access";
import { looksLikeEducationalSource } from "@/lib/educational-source";
import { getDefaultIntelligenceModeId } from "@/lib/mode-resolver";
import type { ExtractionMetadata } from "@/types/extraction";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { WorkspaceInputMode } from "@/types/extraction";

/**
 * Pick the best free-accessible intelligence mode for a source before analysis.
 * Falls back to General Summary when nothing better matches.
 * Educational / lecture signals prefer The Student over Creator.
 */
export function suggestIntelligenceModeForSource({
  inputMode,
  metadata,
  fileName,
  entitlementPlanId,
  textSnippet,
}: {
  inputMode: WorkspaceInputMode;
  metadata: ExtractionMetadata | null;
  fileName?: string | null;
  entitlementPlanId: PlanId;
  /** Used when YouTube/URL title is missing so lecture transcripts still route to Student. */
  textSnippet?: string | null;
}): IntelligenceModeId {
  const educational = looksLikeEducationalSource({
    inputMode,
    metadata,
    fileName,
    textSnippet,
  });
  const candidates: IntelligenceModeId[] = [];

  if (inputMode === "youtube" || metadata?.sourceKind === "youtube") {
    candidates.push(
      ...(educational
        ? (["the-student", "the-creator", "general-summary"] as const)
        : (["the-creator", "the-student", "general-summary"] as const)),
    );
  } else if (
    metadata?.sourceKind === "presentation" ||
    (metadata?.sourceKind === "file" && metadata.fileType === "pptx")
  ) {
    candidates.push(
      ...(educational
        ? (["the-student", "executive-brief", "general-summary"] as const)
        : (["executive-brief", "the-student", "general-summary"] as const)),
    );
  } else if (inputMode === "url" || metadata?.sourceKind === "url") {
    candidates.push(
      ...(educational
        ? (["the-student", "executive-brief", "general-summary"] as const)
        : (["the-creator", "executive-brief", "general-summary"] as const)),
    );
  } else {
    const name = (fileName ?? (metadata?.sourceKind === "file" ? metadata.fileName : "") ?? "").toLowerCase();
    if (/contract|legal|nda|agreement|terms|policy/.test(name)) {
      candidates.push("contract-analyzer", "general-summary");
    } else if (educational || /lecture|exam|study|course|notes|textbook|homework/.test(name)) {
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

/** Short human reason for the suggested lens chip (upload UX). */
export function explainModeSuggestionReason(input: {
  modeId: IntelligenceModeId;
  inputMode: WorkspaceInputMode;
  metadata: ExtractionMetadata | null;
  fileName?: string | null;
  textSnippet?: string | null;
}): string | null {
  const educational = looksLikeEducationalSource({
    inputMode: input.inputMode,
    metadata: input.metadata,
    fileName: input.fileName,
    textSnippet: input.textSnippet,
  });

  if (input.modeId === "the-student" && educational) {
    return "lecture / STEM signals";
  }
  if (input.modeId === "the-creator") {
    return "video or media-style source";
  }
  if (input.modeId === "executive-brief") {
    return "deck or briefing-style source";
  }
  if (input.modeId === "contract-analyzer") {
    return "contract / legal filename cues";
  }
  if (input.modeId === "general-summary") {
    return "balanced default for this source";
  }
  return "best match for this source";
}

