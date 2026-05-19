import type { MindMapGraphProfile } from "@/types/mindmap";

/** Map document + source signals to graph layout behavior. */
export function resolveMindMapProfile(
  documentTypeGuess?: string | null,
  sourceKind?: string | null,
): MindMapGraphProfile {
  const doc = (documentTypeGuess ?? "").toLowerCase();
  const source = (sourceKind ?? "").toLowerCase();

  if (doc === "meeting_notes" || doc.includes("meeting")) {
    return "meeting";
  }

  if (
    doc.includes("legal") ||
    doc.includes("contract") ||
    doc.includes("policy")
  ) {
    return "contract";
  }

  if (
    doc.includes("research") ||
    doc.includes("report") && !doc.includes("meeting")
  ) {
    return "research";
  }

  if (
    doc.includes("educational") ||
    doc.includes("lecture") && !source.includes("youtube")
  ) {
    return "educational";
  }

  if (
    source === "youtube" ||
    doc.includes("transcript") ||
    doc.includes("video") ||
    doc.includes("podcast") ||
    doc.includes("tutorial") ||
    doc.includes("interview")
  ) {
    return "narrative";
  }

  return "general";
}
