import {
  CORE_PRODUCT_LENS_MODE_IDS,
  FREE_CORE_MODE_IDS,
  INTELLIGENCE_MODES,
  PAID_PRIMARY_LENS_MODE_IDS,
} from "@/config/modes";
import { getPlanDefinition } from "@/data/pricingPlans";
import { getMaxUploadBytes, getPlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";
import type { IntelligenceModeDefinition, IntelligenceModeId } from "@/types/modes";

const MODE_RUN_ORDER: IntelligenceModeId[] = [
  ...FREE_CORE_MODE_IDS,
  ...PAID_PRIMARY_LENS_MODE_IDS,
  ...INTELLIGENCE_MODES.filter(
    (m) =>
      !(FREE_CORE_MODE_IDS as readonly string[]).includes(m.id) &&
      !(PAID_PRIMARY_LENS_MODE_IDS as readonly string[]).includes(m.id),
  ).map((m) => m.id),
];

/** Scholar: 4 free cores + Contract/Exam + adjacent study lenses. */
const SCHOLAR_MODE_IDS: readonly IntelligenceModeId[] = [
  ...FREE_CORE_MODE_IDS,
  ...PAID_PRIMARY_LENS_MODE_IDS,
  "flashcard-builder",
  "quiz-generator",
  "the-researcher",
  "concept-explainer",
  "key-points",
  "deep-dive",
];

function uniqueModeIds(ids: readonly IntelligenceModeId[]): IntelligenceModeId[] {
  return [...new Set(ids)];
}

/**
 * Modes a plan may run.
 * Free/beta: 4 core lenses (Study included).
 * Scholar: cores + Contract/Exam + study-adjacent.
 * Pro/Team: full runnable catalog.
 */
export function getAllowedModeIdsForPlan(planId: PlanId): IntelligenceModeId[] {
  if (planId === "free" || planId === "beta") {
    return [...FREE_CORE_MODE_IDS];
  }

  if (planId === "scholar") {
    return uniqueModeIds(SCHOLAR_MODE_IDS);
  }

  const { intelligenceModesIncluded } = getPlanDefinition(planId).limits;
  if (intelligenceModesIncluded === "all") {
    return MODE_RUN_ORDER.filter((id) => {
      const mode = INTELLIGENCE_MODES.find((m) => m.id === id);
      return mode?.availability !== "coming_soon";
    });
  }

  return MODE_RUN_ORDER.slice(0, intelligenceModesIncluded);
}

export function isModeIncludedInPlan(
  modeId: IntelligenceModeId,
  planId: PlanId,
): boolean {
  return getAllowedModeIdsForPlan(planId).includes(modeId);
}

export function isFreeCoreMode(modeId: IntelligenceModeId): boolean {
  return (FREE_CORE_MODE_IDS as readonly string[]).includes(modeId);
}

export function isCoreProductLens(modeId: IntelligenceModeId): boolean {
  return (CORE_PRODUCT_LENS_MODE_IDS as readonly string[]).includes(modeId);
}

/** Minimum paid tier required to run a mode (for badges and upgrade CTAs). */
export function getMinimumUpgradePlanForMode(modeId: IntelligenceModeId): PlanId {
  if (isModeIncludedInPlan(modeId, "free")) return "free";
  if (
    isModeIncludedInPlan(modeId, "scholar") &&
    !isModeIncludedInPlan(modeId, "free")
  ) {
    return "scholar";
  }
  if (
    isModeIncludedInPlan(modeId, "team") &&
    !isModeIncludedInPlan(modeId, "pro")
  ) {
    return "team";
  }
  return "pro";
}

/** Which paid tier unlocks a locked mode in upgrade messaging. */
export function getUpgradePlanForMode(
  mode: IntelligenceModeDefinition,
): PlanId {
  return getMinimumUpgradePlanForMode(mode.id);
}

export function getMaxFileSizeBytes(planId: PlanId): number {
  return getMaxUploadBytes(planId);
}

export function getAnalysisCharacterLimit(planId: PlanId): number {
  return getPlanLimits(planId).maxCharacters;
}

export function getAnalysisPageLimit(planId: PlanId): number {
  return getPlanLimits(planId).maxPages;
}

export function getMaxLearnCardsForPlan(planId: PlanId): number {
  return getPlanDefinition(planId).limits.maxLearnCards;
}

/** Upper bound for learn-card generation (independent of free practice access cap). */
export function getLearnCardsGenerationCap(): number {
  return getMaxLearnCardsForPlan("pro");
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
export const CORE_PRODUCT_LENS_COUNT = CORE_PRODUCT_LENS_MODE_IDS.length;
export const FREE_CORE_MODE_COUNT = FREE_CORE_MODE_IDS.length;
