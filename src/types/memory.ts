import type { LearnCardOutput } from "@/types/text-analysis";
import type { RetentionSnapshot } from "@/types/retention";

export type ReviewSourceKind = "learn_card" | "key_insight" | "important_concept";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export type ReviewDifficulty = "new" | "learning" | "steady" | "difficult" | "mastered";

export type ReminderChannel = "email" | "daily_digest" | "push";

export type ReviewItem = {
  id: string;
  user_id: string;
  analysis_id: string;
  source_kind: ReviewSourceKind;
  source_id: string;
  prompt: string;
  answer: string;
  context: string | null;
  difficulty: ReviewDifficulty;
  retention_score: number;
  ease_factor: number;
  interval_days: number;
  stability_days: number;
  lapses: number;
  review_count: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ReviewItemInsert = {
  user_id: string;
  analysis_id: string;
  source_kind: ReviewSourceKind;
  source_id: string;
  prompt: string;
  answer: string;
  context?: string | null;
  difficulty?: ReviewDifficulty;
  retention_score?: number;
  ease_factor?: number;
  interval_days?: number;
  stability_days?: number;
  next_review_at?: string;
};

export type ReviewSession = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  cards_reviewed: number;
  again_count: number;
  hard_count: number;
  good_count: number;
  easy_count: number;
  retention_score: number | null;
  metadata: ReviewSessionMetadata | null;
};

export type ReviewSessionMetadata = {
  analysisIds?: string[];
  reminderIntent?: ReminderIntent;
  retentionSummary?: ReviewSessionSummary;
};

export type ReminderIntent = {
  enabled: boolean;
  channel: ReminderChannel;
  preferredHourLocal?: number;
  timezone?: string;
  lastQueuedAt?: string | null;
};

export type ReviewStats = {
  dueToday: number;
  overdue: number;
  totalActive: number;
  cardsReviewed: number;
  reviewStreak: number;
  retentionEstimate: number;
  difficultConcepts: DifficultConcept[];
  retention: RetentionSnapshot;
};

export type DifficultConcept = {
  id: string;
  title: string;
  prompt: string;
  retentionScore: number;
  lapses: number;
};

export type GeneratedReviewItem = Omit<
  ReviewItemInsert,
  "user_id" | "analysis_id" | "difficulty" | "retention_score" | "ease_factor" | "interval_days" | "stability_days"
> & {
  seedCard?: LearnCardOutput;
};

export type MemoryPlanLimits = {
  maxReviewItems: number | null;
  dailyReviewTarget: number;
  remindersEnabled: boolean;
  spacedRepetitionEnabled: boolean;
};

export type ReviewSessionSummary = {
  cardsReviewed: number;
  retentionEstimate: number;
  difficultConcepts: DifficultConcept[];
  streakBefore: number;
  streakAfter: number;
  dailyGoalComplete: boolean;
};
