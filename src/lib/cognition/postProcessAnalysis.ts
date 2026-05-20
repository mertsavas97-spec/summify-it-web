import type { AnalysisResult } from "@/server/ai/schemas";
import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import {
  filterHallucinationBullets,
  filterHallucinationSummary,
} from "@/lib/cognition/genericHallucinationPatterns";

const STUDENT_STRUCTURE_PREFIX = "student_";

function shouldFilterStudentHallucinations(structureFamily: string): boolean {
  return structureFamily.startsWith(STUDENT_STRUCTURE_PREFIX);
}

/**
 * Phase 11C — hard enforcement: empty risks/actions when plan suppresses them;
 * strip generic meta-language for student plans.
 */
export function applyAdaptivePlanPostProcess(
  result: AnalysisResult,
  plan: PersonaAdaptivePlan | undefined,
): AnalysisResult {
  if (!plan) return result;

  let next: AnalysisResult = { ...result };

  if (plan.suppressedDefaultSections.includes("risks")) {
    next = { ...next, risksOrWarnings: [] };
  }
  if (plan.suppressedDefaultSections.includes("actions")) {
    next = { ...next, actionItems: [] };
  }

  if (shouldFilterStudentHallucinations(plan.structureFamily)) {
    next = {
      ...next,
      summary: filterHallucinationSummary(next.summary),
      keyInsights: filterHallucinationBullets(next.keyInsights),
      risksOrWarnings: filterHallucinationBullets(next.risksOrWarnings),
      actionItems: filterHallucinationBullets(next.actionItems),
    };
  }

  return next;
}
