/**
 * Phase Learn 6.4 — practice retention types (client + server safe).
 */

export type CardReviewOutcome = "got_it" | "review_again" | "skipped";

export type RetentionStrength = "weak" | "developing" | "stable" | "strong";

export type CardRetentionState = {
  cardId: string;
  analysisId?: string;
  userId?: string;
  outcomeHistory: Array<{
    outcome: CardReviewOutcome;
    reviewedAt: string;
  }>;
  reviewCount: number;
  gotItCount: number;
  reviewAgainCount: number;
  skippedCount: number;
  retentionStrength: RetentionStrength;
  lastReviewedAt?: string;
  nextSuggestedReviewAt?: string;
  reviewPriority?: number;
};

/** Persisted summary after a practice session (localStorage). */
export type PracticeRetentionSummary = {
  analysisId: string;
  completedAt: string;
  sessionReviewedCount: number;
  cardStates: CardRetentionState[];
  strongConcepts: string[];
  weakConcepts: string[];
  hardestRetrievalType?: string;
  suggestedNextStep: string;
  weakCount: number;
  developingCount: number;
  stableCount: number;
  strongCount: number;
  suggestedReviewCount: number;
  cardPrompts?: Record<string, string>;
};

/** Hint for regenerating practice sets from recent session performance. */
export type PracticeRetentionHint = {
  gotItCardIds?: string[];
  weakCardIds?: string[];
  weakConcepts?: string[];
  /** Prompt text for matching on regeneration (review item ids may rotate). */
  gotItPrompts?: string[];
  weakPrompts?: string[];
};

export type { LearnRetentionDebugMeta } from "@/types/adaptive-learn";
