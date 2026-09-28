/**
 * Longer sources should return more insights and study cards.
 * Floors rise with length. Band maxes stay tight so a long source does not balloon.
 * Insight generation is still capped at 12 by the response schema.
 */

export type InsightQuota = { min: number; max: number };
export type CardQuota = { min: number; target: number; max: number };

/** Schema cap in normalize-response. The floor post-pass must not exceed this. */
export const INSIGHT_HARD_CAP = 12;

export function insightQuotaForChars(sourceChars: number): InsightQuota {
  if (sourceChars >= 40_000) return { min: 10, max: INSIGHT_HARD_CAP };
  if (sourceChars >= 18_000) return { min: 8, max: INSIGHT_HARD_CAP };
  if (sourceChars >= 8_000) return { min: 6, max: 8 };
  return { min: 4, max: 6 };
}

/**
 * Card floors by source length. Deck size scales with how much source there
 * is to cover: short notes stay small, long sources reach the plan ceiling
 * (25 on Pro). Max is what `Math.max` in resolveLearnCardTargets can lift a
 * thin base band to.
 */
export function cardQuotaForChars(sourceChars: number): CardQuota {
  if (sourceChars >= 40_000) return { min: 24, target: 25, max: 25 };
  if (sourceChars >= 18_000) return { min: 20, target: 22, max: 25 };
  if (sourceChars >= 8_000) return { min: 14, target: 16, max: 20 };
  return { min: 8, target: 8, max: 10 };
}

/**
 * Quiz length follows the transcript, on the same bands as insights and
 * cards: a long source earns a longer check, a short note stays quick.
 * Callers still pass the result through `openCards + 2` in
 * `generateAnalysisQuiz`, so the deck itself caps the ceiling.
 */
export function quizQuestionTargetForChars(sourceChars: number | null | undefined): number {
  const chars = typeof sourceChars === "number" && sourceChars > 0 ? sourceChars : 0;
  if (chars >= 40_000) return 15;
  if (chars >= 18_000) return 12;
  if (chars >= 8_000) return 8;
  return 6;
}

export function formatInsightQuotaLine(sourceChars: number): string {
  const quota = insightQuotaForChars(sourceChars);
  return `Key insight quota: write ${quota.min}–${quota.max} distinct keyInsights. Cover the whole source, not only the opening. Each bullet must add a different name, date, number, or causal claim. Do not restate the summary.`;
}

const META_OPENER =
  /^(this (lecture|video|document|article|paper|chapter)|the speaker|in this (lecture|video|document|article))\b/i;
const GENERIC_SHELL = /^(key insight|central topic|main point|main takeaway)\b/i;

function normalizeInsightKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function insightTokens(text: string): Set<string> {
  return new Set(
    normalizeInsightKey(text)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
}

function insightOverlap(a: string, b: string): number {
  const setA = insightTokens(a);
  const setB = insightTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const token of setA) {
    if (setB.has(token)) shared += 1;
  }
  return shared / Math.min(setA.size, setB.size);
}

function dedupeInsights(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = normalizeInsightKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Sentences already present in the summary. Same bounds as the scientific insight pad. */
function groundedSummarySentences(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 220)
    .filter((sentence) => !META_OPENER.test(sentence))
    .filter((sentence) => !GENERIC_SHELL.test(sentence));
}

export type InsightFloorInput = {
  insights: string[];
  summary: string;
  sourceChars: number;
};

/**
 * Drop insights that repeat the summary. Do not pad the list with summary sentences.
 * A short list stays short when the source does not yield more distinct claims.
 */
export function enforceKeyInsightFloor(input: InsightFloorInput): string[] {
  const summarySentences = groundedSummarySentences(input.summary);
  const kept = dedupeInsights(input.insights).filter((insight) => {
    const key = normalizeInsightKey(insight);
    return !summarySentences.some(
      (sentence) =>
        normalizeInsightKey(sentence) === key || insightOverlap(insight, sentence) >= 0.92,
    );
  });
  return kept.slice(0, INSIGHT_HARD_CAP);
}

/**
 * Cap an already-generated card list at the quota max.
 * Does not invent cards. `meetsFloor` is false when dedupe left the set thin.
 */
export function applyGeneratedLearnCardFloor<T>(
  cards: T[],
  range: { min: number; max: number },
): { cards: T[]; meetsFloor: boolean } {
  const max = Math.max(0, range.max);
  const capped = cards.slice(0, max);
  return { cards: capped, meetsFloor: capped.length >= range.min };
}
