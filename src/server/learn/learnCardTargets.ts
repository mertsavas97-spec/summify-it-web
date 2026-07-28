/**
 * Phase Learn 6.x — document-aware learn card count targets.
 */

import type { ComplexityLevel } from "@/server/intelligence/types";
import type { LearnCardCountRange } from "./types";

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
};

const STUDY_STRUCTURE_FAMILIES = new Set([
  "student_scientific",
  "student_literary",
  "student_historical",
]);

/**
 * Normal 2–5 page docs: target 8, min 6, max 12.
 * Very short sources may go lower; decks/transcripts stay tighter.
 * Study discipline packs raise the YouTube/deck floor so definition/quiz sets aren't thin.
 */
export function resolveLearnCardTargets(input: ResolveLearnCardTargetsInput): LearnCardCountRange {
  const summaryLen = (input.summary ?? "").length;
  const insightCount = input.keyInsightCount ?? 0;
  const contentSignal = summaryLen + insightCount * 120;
  const isStudyPack = Boolean(
    input.structureFamily && STUDY_STRUCTURE_FAMILIES.has(input.structureFamily),
  );

  if (input.isPresentation || input.isYoutube) {
    if (isStudyPack) {
      return { min: 6, target: 8, max: 12 };
    }
    return { min: 5, target: 7, max: 10 };
  }

  if (contentSignal < SHORT_DOC_CHARS) {
    return isStudyPack
      ? { min: 5, target: 7, max: 10 }
      : { min: 4, target: 6, max: 8 };
  }

  if (contentSignal >= NORMAL_DOC_CHARS * 1.4 || input.complexity === "high") {
    return { min: 8, target: 10, max: 12 };
  }

  if (input.complexity === "low" && contentSignal < NORMAL_DOC_CHARS * 0.7) {
    return isStudyPack
      ? { min: 6, target: 8, max: 10 }
      : { min: 5, target: 7, max: 9 };
  }

  return isStudyPack
    ? { min: 7, target: 9, max: 12 }
    : { min: 6, target: 8, max: 12 };
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
