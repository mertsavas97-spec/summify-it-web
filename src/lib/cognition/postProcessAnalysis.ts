import type { AnalysisResult } from "@/server/ai/schemas";
import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import {
  filterHallucinationBullets,
  filterHallucinationSummary,
} from "@/lib/cognition/genericHallucinationPatterns";

const STUDENT_STRUCTURE_PREFIX = "student_";
const MIN_SCIENTIFIC_INSIGHTS = 4;

function shouldFilterStudentHallucinations(structureFamily: string): boolean {
  return structureFamily.startsWith(STUDENT_STRUCTURE_PREFIX);
}

/** Split summary into concrete study bullets when keyInsights are too thin. */
function expandThinScientificInsights(
  summary: string,
  insights: string[],
): string[] {
  if (insights.length >= MIN_SCIENTIFIC_INSIGHTS) return insights;

  const existing = new Set(insights.map((i) => i.trim().toLowerCase()));
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 220);

  const next = [...insights];
  for (const sentence of sentences) {
    if (next.length >= MIN_SCIENTIFIC_INSIGHTS) break;
    const key = sentence.toLowerCase();
    if (existing.has(key)) continue;
    // Prefer mechanism-ish sentences over pure meta openers
    if (/^(this (lecture|video|document|article)|the speaker)\b/i.test(sentence)) {
      continue;
    }
    existing.add(key);
    next.push(sentence);
  }
  return next;
}

/**
 * Phase 11C — hard enforcement: empty risks/actions when plan suppresses them;
 * strip generic meta-language for student plans; pad thin scientific insights.
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

  if (plan.structureFamily === "student_scientific") {
    next = {
      ...next,
      keyInsights: expandThinScientificInsights(next.summary, next.keyInsights),
    };
  }

  return next;
}
