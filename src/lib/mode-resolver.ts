import {
  getIntelligenceModeById,
  INTELLIGENCE_MODES,
  isActiveIntelligenceModeId,
  LEGACY_MODE_TO_INTELLIGENCE_ID,
} from "@/config/modes";
import type { IntelligenceModeId } from "@/types/modes";
import type { TextAnalysisMode } from "@/types/text-analysis";

export function getDefaultIntelligenceModeId(): IntelligenceModeId {
  return "executive-brief";
}

export function legacyFamilyToModeId(family: TextAnalysisMode): IntelligenceModeId {
  return LEGACY_MODE_TO_INTELLIGENCE_ID[family];
}

export function getModeLabel(id: IntelligenceModeId): string {
  return getIntelligenceModeById(id)?.label ?? id;
}

export function canRunAnalysis(id: IntelligenceModeId): boolean {
  return isActiveIntelligenceModeId(id);
}

export { INTELLIGENCE_MODES, getIntelligenceModeById, isActiveIntelligenceModeId };
