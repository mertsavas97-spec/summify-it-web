/**
 * Phase Learn 6.4 — local persistence for practice retention summaries.
 */

import type { PracticeRetentionHint, PracticeRetentionSummary } from "@/lib/learn/retentionTypes";

const KEY_PREFIX = "summify.learn.retention.";

export function retentionStorageKey(analysisId: string, userId?: string | null): string {
  return userId ? `${KEY_PREFIX}${userId}.${analysisId}` : `${KEY_PREFIX}${analysisId}`;
}

export function loadPracticeRetentionSummary(
  analysisId: string,
  userId?: string | null,
): PracticeRetentionSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(retentionStorageKey(analysisId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeRetentionSummary;
    if (parsed?.analysisId !== analysisId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePracticeRetentionSummary(
  summary: PracticeRetentionSummary,
  userId?: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      retentionStorageKey(summary.analysisId, userId),
      JSON.stringify(summary),
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadPracticeRetentionHint(
  analysisId: string,
  userId?: string | null,
): PracticeRetentionHint | null {
  const summary = loadPracticeRetentionSummary(analysisId, userId);
  if (!summary) return null;
  const prompts = summary.cardPrompts ?? {};
  const gotItIds = summary.cardStates
    .filter((s) => s.retentionStrength === "strong" || s.retentionStrength === "stable")
    .map((s) => s.cardId);
  const weakIds = summary.cardStates
    .filter((s) => s.retentionStrength === "weak" || s.reviewAgainCount > 0)
    .map((s) => s.cardId);

  return {
    gotItCardIds: gotItIds,
    weakCardIds: weakIds,
    weakConcepts: summary.weakConcepts,
    gotItPrompts: gotItIds.map((id) => prompts[id]).filter(Boolean) as string[],
    weakPrompts: weakIds.map((id) => prompts[id]).filter(Boolean) as string[],
  };
}

export function countNeedsReview(summary: PracticeRetentionSummary | null): number {
  if (!summary) return 0;
  return summary.suggestedReviewCount || summary.weakCount + summary.developingCount;
}
