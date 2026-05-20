import {
  getIntelligenceModeById,
  INTELLIGENCE_MODES,
  isActiveIntelligenceModeId,
  LEGACY_MODE_TO_INTELLIGENCE_ID,
} from "@/config/modes";
import { canRunMode } from "@/lib/mode-access";
import type { IntelligenceModeId } from "@/types/modes";
import type { PlanId } from "@/types/plan";
import type { TextAnalysisMode } from "@/types/text-analysis";

export function getDefaultIntelligenceModeId(): IntelligenceModeId {
  return "general-summary";
}

export function legacyFamilyToModeId(family: TextAnalysisMode): IntelligenceModeId {
  return LEGACY_MODE_TO_INTELLIGENCE_ID[family];
}

export function getModeLabel(id: IntelligenceModeId): string {
  return getIntelligenceModeById(id)?.label ?? id;
}

/** Whether analysis can run for this mode under the user's entitlement plan. */
export function canRunAnalysis(
  id: IntelligenceModeId,
  entitlementPlanId?: PlanId,
): boolean {
  if (entitlementPlanId) {
    return canRunMode(id, entitlementPlanId);
  }
  return isActiveIntelligenceModeId(id);
}

export { INTELLIGENCE_MODES, getIntelligenceModeById, isActiveIntelligenceModeId };
