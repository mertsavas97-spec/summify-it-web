import { getIntelligenceModeById } from "@/config/modes";
import type { IntelligenceModeId } from "@/types/modes";

export function getLearnModeLabel(modeId: IntelligenceModeId): string {
  return getIntelligenceModeById(modeId)?.label ?? modeId;
}

export function getLearnModeHelperText(modeId: IntelligenceModeId): string {
  const def = getIntelligenceModeById(modeId);
  if (def?.learnEmphasis) return def.learnEmphasis;
  return "Cards ranked by importance and deduplicated for this session.";
}
