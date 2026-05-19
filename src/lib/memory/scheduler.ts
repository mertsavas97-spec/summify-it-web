import type { ReviewDifficulty, ReviewItem, ReviewRating } from "@/types/memory";

type SchedulableReviewItem = Pick<
  ReviewItem,
  "ease_factor" | "interval_days" | "lapses" | "review_count" | "retention_score"
>;

export type ReviewScheduleResult = {
  difficulty: ReviewDifficulty;
  easeFactor: number;
  intervalDays: number;
  stabilityDays: number;
  retentionScore: number;
  lapses: number;
  nextReviewAt: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * MS_PER_DAY).toISOString();
}

function difficultyFor(input: {
  rating: ReviewRating;
  retentionScore: number;
  intervalDays: number;
  lapses: number;
}): ReviewDifficulty {
  if (input.rating === "again" || input.lapses >= 2 || input.retentionScore < 0.45) {
    return "difficult";
  }
  if (input.rating === "hard" || input.intervalDays <= 1) return "learning";
  if (input.rating === "easy" && input.retentionScore >= 0.88) return "mastered";
  return "steady";
}

export function scheduleReview(
  item: SchedulableReviewItem,
  rating: ReviewRating,
  reviewedAt = new Date(),
): ReviewScheduleResult {
  const currentEase = clamp(item.ease_factor || 2.3, 1.3, 3.0);
  const currentInterval = Math.max(0, item.interval_days || 0);
  const currentRetention = clamp(item.retention_score || 0.6, 0, 1);

  const easeDelta: Record<ReviewRating, number> = {
    again: -0.25,
    hard: -0.12,
    good: 0.02,
    easy: 0.12,
  };

  const retentionDelta: Record<ReviewRating, number> = {
    again: -0.22,
    hard: -0.08,
    good: 0.07,
    easy: 0.12,
  };

  const easeFactor = clamp(currentEase + easeDelta[rating], 1.3, 3.0);
  const retentionScore = clamp(currentRetention + retentionDelta[rating], 0, 0.98);
  const lapses = item.lapses + (rating === "again" ? 1 : 0);

  let intervalDays: number;
  if (rating === "again") {
    intervalDays = 0;
  } else if (rating === "hard") {
    intervalDays = Math.max(1, Math.ceil(currentInterval * 1.2));
  } else if (currentInterval <= 0) {
    intervalDays = rating === "easy" ? 4 : 1;
  } else {
    const multiplier = rating === "easy" ? easeFactor + 0.55 : easeFactor;
    intervalDays = Math.ceil(currentInterval * multiplier);
  }

  intervalDays = clamp(intervalDays, 0, 180);
  const stabilityDays = Math.max(1, Math.ceil(intervalDays * retentionScore || 1));
  const nextReviewAt =
    rating === "again"
      ? new Date(reviewedAt.getTime() + 10 * 60 * 1000).toISOString()
      : addDays(reviewedAt, intervalDays);

  return {
    difficulty: difficultyFor({ rating, retentionScore, intervalDays, lapses }),
    easeFactor,
    intervalDays,
    stabilityDays,
    retentionScore,
    lapses,
    nextReviewAt,
  };
}
