import { getPlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";

/** Minimum characters required to run analysis. */
export const ANALYSIS_INPUT_MIN_CHARS = 100;

/** Client-safe per-plan analysis character cap (paste + extracted text). */
export function getClientAnalysisInputLimits(planId: PlanId = "free") {
  return {
    minChars: ANALYSIS_INPUT_MIN_CHARS,
    maxChars: getPlanLimits(planId).maxCharacters,
  };
}

/** @deprecated Use getClientAnalysisInputLimits(planId) */
export const AI_INPUT_LIMITS = {
  minChars: ANALYSIS_INPUT_MIN_CHARS,
  maxChars: getPlanLimits("free").maxCharacters,
} as const;
