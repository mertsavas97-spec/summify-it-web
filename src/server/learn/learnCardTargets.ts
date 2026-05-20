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
};

/**
 * Normal 2–5 page docs: target 8, min 6, max 12.
 * Very short sources may go lower; decks/transcripts stay tighter.
 */
export function resolveLearnCardTargets(input: ResolveLearnCardTargetsInput): LearnCardCountRange {
  const summaryLen = (input.summary ?? "").length;
  const insightCount = input.keyInsightCount ?? 0;
  const contentSignal = summaryLen + insightCount * 120;

  if (input.isPresentation || input.isYoutube) {
    return { min: 5, target: 7, max: 10 };
  }

  if (contentSignal < SHORT_DOC_CHARS) {
    return { min: 4, target: 6, max: 8 };
  }

  if (input.complexity === "high" || contentSignal >= NORMAL_DOC_CHARS * 1.4) {
    return { min: 8, target: 10, max: 12 };
  }

  if (input.complexity === "low" && contentSignal < NORMAL_DOC_CHARS * 0.7) {
    return { min: 5, target: 7, max: 9 };
  }

  return { min: 6, target: 8, max: 12 };
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
