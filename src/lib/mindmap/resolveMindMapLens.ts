import { getIntelligenceModeById } from "@/config/modes";
import type { MindMapGraphProfile } from "@/types/mindmap";
import type { IntelligenceModeId } from "@/types/modes";
import { resolveMindMapProfile } from "./resolveMindMapProfile";

/**
 * Which mind map structure fits the selected lens.
 *
 * The lens is what the user asked the analysis to be read through, so it wins
 * over the document guess whenever the lens has a clear point of view.
 * "general-summary" is the neutral lens — it keeps the document's own shape
 * (meeting notes → decisions map, contract → obligations map, and so on).
 * When no lens is known (older shares), fall back to the document signals.
 */
export function resolveMindMapLens(
  intelligenceMode: string | null | undefined,
  documentTypeGuess?: string | null,
  sourceKind?: string | null,
): MindMapGraphProfile {
  const documentProfile = resolveMindMapProfile(documentTypeGuess, sourceKind);

  if (!intelligenceMode) return documentProfile;
  if (intelligenceMode === "general-summary") return documentProfile;

  const family = getIntelligenceModeById(intelligenceMode as IntelligenceModeId)
    ?.intelligenceFamily;

  switch (family) {
    case "academic":
      return "educational";
    case "creator":
      return "narrative";
    case "legal":
      return "contract";
    case "executive":
      return "executive";
    default:
      return documentProfile;
  }
}
