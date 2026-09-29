/**
 * Phase Learn 6.x — document-aware learn card count targets.
 */

import type { ComplexityLevel } from "@/server/intelligence/types";
import type { LearnCardCountRange } from "./types";
import { cardQuotaForChars } from "@/server/intelligence/sourceOutputQuota";

const SHORT_DOC_CHARS = 900;
const NORMAL_DOC_CHARS = 2400;

export type ResolveLearnCardTargetsInput = {
  complexity: ComplexityLevel;
  summary?: string;
  keyInsightCount?: number;
  isPresentation?: boolean;
  isYoutube?: boolean;
  /** Adaptive plan structure family — study packs get a higher floor. */
  structureFamily?: string;
  sourceChars?: number;
};

const STUDY_STRUCTURE_FAMILIES = new Set([
  "student_scientific",
  "student_literary",
  "student_historical",
]);

/**
 * Deck size scales with source length (see cardQuotaForChars) and complexity.
 * Base bands below are floors for thin sources; the quota lifts the floor,
 * target, and ceiling as the document grows.
 * Study discipline packs raise the YouTube/deck floor so definition/quiz sets aren't thin.
 */
export function resolveLearnCardTargets(input: ResolveLearnCardTargetsInput): LearnCardCountRange {
  const base = resolveBaseLearnCardTargets(input);
  const quota = cardQuotaForChars(input.sourceChars ?? 0);
  const min = Math.max(base.min, quota.min);
  const target = Math.max(base.target, quota.target, min);
  const max = Math.max(base.max, quota.max, target);
  return { min, target, max };
}

function resolveBaseLearnCardTargets(input: ResolveLearnCardTargetsInput): LearnCardCountRange {
  const summaryLen = (input.summary ?? "").length;
  const insightCount = input.keyInsightCount ?? 0;
  const contentSignal = summaryLen + insightCount * 120;
  const isStudyPack = Boolean(
    input.structureFamily && STUDY_STRUCTURE_FAMILIES.has(input.structureFamily),
  );

  if (input.isPresentation || input.isYoutube) {
    if (isStudyPack) {
      return { min: 8, target: 10, max: 14 };
    }
    return { min: 7, target: 9, max: 12 };
  }

  if (contentSignal < SHORT_DOC_CHARS) {
    return isStudyPack
      ? { min: 7, target: 9, max: 12 }
      : { min: 6, target: 8, max: 10 };
  }

  if (contentSignal >= NORMAL_DOC_CHARS * 1.4 || input.complexity === "high") {
    return { min: 12, target: 14, max: 18 };
  }

  if (input.complexity === "low" && contentSignal < NORMAL_DOC_CHARS * 0.7) {
    return isStudyPack
      ? { min: 8, target: 10, max: 12 }
      : { min: 7, target: 9, max: 11 };
  }

  return isStudyPack
    ? { min: 10, target: 12, max: 16 }
    : { min: 9, target: 11, max: 16 };
}

/** @deprecated Use resolveLearnCardTargets — kept for tests referencing complexity-only ranges. */
export function cardCountForComplexityLegacy(complexity: ComplexityLevel): LearnCardCountRange {
  switch (complexity) {
    case "low":
      return { min: 5, target: 7, max: 9 };
    case "high":
      return { min: 8, target: 10, max: 12 };
    default:
      return { min: 6, target: 8, max: 12 };
  }
}
