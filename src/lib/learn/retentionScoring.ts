/**
 * Phase Learn 6.4 — deterministic retention scoring for practice cards.
 */

import type {
  CardRetentionState,
  CardReviewOutcome,
  LearnRetentionDebugMeta,
  RetentionStrength,
} from "@/lib/learn/retentionTypes";
import type {
  LearnCognitiveLevel,
  LearnRetrievalType,
  RecallDifficultyLevel,
} from "@/types/adaptive-learn";

export type RetentionScoringInput = {
  cardId: string;
  outcome: CardReviewOutcome;
  recallDifficulty?: RecallDifficultyLevel;
  retrievalType?: LearnRetrievalType;
  cognitiveLevel?: LearnCognitiveLevel;
  previous?: CardRetentionState;
  reviewedAt?: string;
  analysisId?: string;
  userId?: string;
};

export type RetentionScoringResult = {
  state: CardRetentionState;
  reviewPriority: number;
};

const RETRIEVAL_WEIGHT: Record<string, number> = {
  recognition: 1,
  recall: 2,
  chronology: 2,
  mechanism: 3,
  comparison: 3,
  application: 4,
  synthesis: 4,
};

function hoursUntilNextReview(strength: RetentionStrength, difficulty?: RecallDifficultyLevel): number {
  const base =
    strength === "strong"
      ? 72
      : strength === "stable"
        ? 48
        : strength === "developing"
          ? 24
          : 12;
  if (difficulty === "hard") return Math.max(8, Math.round(base * 0.65));
  if (difficulty === "easy") return Math.round(base * 1.25);
  return base;
}

function computeStrength(
  gotItCount: number,
  reviewAgainCount: number,
  skippedCount: number,
  reviewCount: number,
  lastOutcome: CardReviewOutcome,
  difficulty?: RecallDifficultyLevel,
  retrievalType?: LearnRetrievalType,
): RetentionStrength {
  if (reviewAgainCount >= 2 || (reviewAgainCount >= 1 && gotItCount === 0 && reviewCount >= 2)) {
    return "weak";
  }

  if (lastOutcome === "review_again") {
    if (difficulty === "easy") return "weak";
    return reviewCount > 1 ? "weak" : "developing";
  }

  if (lastOutcome === "skipped") {
    if (gotItCount >= 2) return "stable";
    return reviewAgainCount > 0 ? "developing" : "developing";
  }

  if (gotItCount >= 2) return "strong";
  if (gotItCount === 1 && reviewAgainCount > 0) return "developing";

  if (lastOutcome === "got_it") {
    const hardSignal =
      difficulty === "hard" ||
      retrievalType === "synthesis" ||
      retrievalType === "comparison" ||
      retrievalType === "application";
    if (hardSignal && gotItCount >= 1) return "stable";
    if (gotItCount >= 1 && skippedCount === 0) return reviewCount > 1 ? "stable" : "developing";
  }

  return "developing";
}

function reviewPriorityScore(
  strength: RetentionStrength,
  outcome: CardReviewOutcome,
  difficulty?: RecallDifficultyLevel,
  retrievalType?: LearnRetrievalType,
): number {
  const strengthBase =
    strength === "weak" ? 100 : strength === "developing" ? 70 : strength === "stable" ? 35 : 10;
  const outcomeBoost = outcome === "review_again" ? 40 : outcome === "skipped" ? 12 : 0;
  const diffBoost = difficulty === "hard" ? 18 : difficulty === "easy" ? 4 : 10;
  const retrievalBoost = (RETRIEVAL_WEIGHT[retrievalType ?? "recall"] ?? 2) * 6;
  return strengthBase + outcomeBoost + diffBoost + retrievalBoost;
}

/** Score a single review event and return updated card retention state. */
export function scoreCardRetention(input: RetentionScoringInput): RetentionScoringResult {
  const reviewedAt = input.reviewedAt ?? new Date().toISOString();
  const prev = input.previous;

  const gotItCount = (prev?.gotItCount ?? 0) + (input.outcome === "got_it" ? 1 : 0);
  const reviewAgainCount = (prev?.reviewAgainCount ?? 0) + (input.outcome === "review_again" ? 1 : 0);
  const skippedCount = (prev?.skippedCount ?? 0) + (input.outcome === "skipped" ? 1 : 0);
  const reviewCount = (prev?.reviewCount ?? 0) + 1;

  const outcomeHistory = [
    ...(prev?.outcomeHistory ?? []),
    { outcome: input.outcome, reviewedAt },
  ].slice(-12);

  const retentionStrength = computeStrength(
    gotItCount,
    reviewAgainCount,
    skippedCount,
    reviewCount,
    input.outcome,
    input.recallDifficulty,
    input.retrievalType,
  );

  const nextMs = Date.now() + hoursUntilNextReview(retentionStrength, input.recallDifficulty) * 3600000;

  const reviewPriority = reviewPriorityScore(
    retentionStrength,
    input.outcome,
    input.recallDifficulty,
    input.retrievalType,
  );

  const state: CardRetentionState = {
    cardId: input.cardId,
    analysisId: input.analysisId ?? prev?.analysisId,
    userId: input.userId ?? prev?.userId,
    outcomeHistory,
    reviewCount,
    gotItCount,
    reviewAgainCount,
    skippedCount,
    retentionStrength,
    lastReviewedAt: reviewedAt,
    nextSuggestedReviewAt: new Date(nextMs).toISOString(),
    reviewPriority,
  };

  return { state, reviewPriority };
}

export function retentionDebugFromStates(states: CardRetentionState[]): LearnRetentionDebugMeta {
  const counts = { weak: 0, developing: 0, stable: 0, strong: 0 };

  for (const s of states) {
    counts[s.retentionStrength] += 1;
  }

  return {
    sessionReviewedCount: states.length,
    weakCount: counts.weak,
    developingCount: counts.developing,
    stableCount: counts.stable,
    strongCount: counts.strong,
    hardestRetrievalType: undefined,
    suggestedReviewCount: states.filter((s) => s.retentionStrength === "weak" || s.reviewAgainCount > 0)
      .length,
  };
}

export function mergeRetentionDebug(
  debug: LearnRetentionDebugMeta,
  hardestRetrievalType?: string,
): LearnRetentionDebugMeta {
  return { ...debug, hardestRetrievalType };
}
