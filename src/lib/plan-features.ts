import { ACTIVE_INTELLIGENCE_MODE_IDS, INTELLIGENCE_MODES } from "@/config/modes";
import { getPlanDefinition } from "@/data/pricingPlans";
import type { PlanId } from "@/types/plan";
import type { IntelligenceModeDefinition, IntelligenceModeId } from "@/types/modes";

const MODE_RUN_ORDER: IntelligenceModeId[] = [
  ...ACTIVE_INTELLIGENCE_MODE_IDS,
  ...INTELLIGENCE_MODES.filter((m) => m.availability !== "active").map((m) => m.id),
];

/**
 * Modes a plan may run (architecture only — workspace still uses availability flags for UI).
 * Beta: active modes only at runtime; Pro/Scholar expand the catalog per config.
 */
export function getAllowedModeIdsForPlan(planId: PlanId): IntelligenceModeId[] {
  const { intelligenceModesIncluded } = getPlanDefinition(planId).limits;

  if (intelligenceModesIncluded === "all") {
    return MODE_RUN_ORDER;
  }

  return MODE_RUN_ORDER.slice(0, intelligenceModesIncluded);
}

export function isModeIncludedInPlan(
  modeId: IntelligenceModeId,
  planId: PlanId,
): boolean {
  if (planId === "beta") {
    return ACTIVE_INTELLIGENCE_MODE_IDS.includes(
      modeId as (typeof ACTIVE_INTELLIGENCE_MODE_IDS)[number],
    );
  }
  return getAllowedModeIdsForPlan(planId).includes(modeId);
}

/** Which paid tier unlocks a locked mode in upgrade messaging. */
export function getUpgradePlanForMode(
  mode: IntelligenceModeDefinition,
): PlanId {
  if (mode.availability === "active") return "free";
  if (isModeIncludedInPlan(mode.id, "scholar") && !isModeIncludedInPlan(mode.id, "free")) {
    return "scholar";
  }
  return "pro";
}

export function getMaxFileSizeBytes(planId: PlanId): number {
  const mb = getPlanDefinition(planId).limits.maxFileSizeMb;
  return mb * 1024 * 1024;
}

export function getMaxLearnCardsForPlan(planId: PlanId): number {
  return getPlanDefinition(planId).limits.maxLearnCards;
}

export function getMaxSavedAnalysesForPlan(planId: PlanId): number | null {
  return getPlanDefinition(planId).limits.maxSavedAnalyses;
}

export function planHasFeature(
  planId: PlanId,
  feature: keyof Pick<
    ReturnType<typeof getPlanDefinition>["limits"],
    | "exportEnabled"
    | "mindMapEnabled"
    | "spacedRepetitionEnabled"
    | "emailRemindersEnabled"
    | "sharedLibrary"
    | "apiAccess"
    | "customModes"
    | "invoices"
  >,
): boolean {
  return getPlanDefinition(planId).limits[feature];
}

export const TOTAL_INTELLIGENCE_MODE_COUNT = INTELLIGENCE_MODES.length;
