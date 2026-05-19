import { createClientIfConfigured } from "@/lib/supabase/server";
import { scheduleReview } from "@/lib/memory/scheduler";
import { updateRetentionStatsForReview } from "@/server/retention/updateRetentionStats";
import type { ReviewItem, ReviewRating } from "@/types/memory";

type RecordReviewInput = {
  itemId: string;
  userId: string;
  rating: ReviewRating;
  sessionId?: string | null;
};

type RecordReviewResult = {
  success: boolean;
  item?: ReviewItem;
  sessionId?: string;
  retention?: {
    streakBefore: number;
    streakAfter: number;
    lastReviewDate: string;
    retentionEstimate: number;
  };
  error?: string;
};

const ratingColumns: Record<ReviewRating, string> = {
  again: "again_count",
  hard: "hard_count",
  good: "good_count",
  easy: "easy_count",
};

export async function recordReview(input: RecordReviewInput): Promise<RecordReviewResult> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return { success: false, error: "Supabase is not configured." };

  const { data: itemData, error: itemError } = await supabase
    .from("review_items")
    .select("*")
    .eq("id", input.itemId)
    .eq("user_id", input.userId)
    .is("archived_at", null)
    .maybeSingle();

  if (itemError || !itemData) return { success: false, error: "Review item not found." };

  const item = itemData as ReviewItem;
  const reviewedAt = new Date();
  const schedule = scheduleReview(item, input.rating, reviewedAt);
  const retentionUpdate = await updateRetentionStatsForReview(input.userId, reviewedAt);

  const { data: updated, error: updateError } = await supabase
    .from("review_items")
    .update({
      difficulty: schedule.difficulty,
      ease_factor: schedule.easeFactor,
      interval_days: schedule.intervalDays,
      stability_days: schedule.stabilityDays,
      retention_score: schedule.retentionScore,
      lapses: schedule.lapses,
      review_count: item.review_count + 1,
      last_reviewed_at: reviewedAt.toISOString(),
      next_review_at: schedule.nextReviewAt,
    })
    .eq("id", input.itemId)
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (updateError || !updated) return { success: false, error: updateError?.message ?? "Review failed." };

  let sessionId = input.sessionId ?? null;
  if (!sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("review_sessions")
      .insert({ user_id: input.userId, cards_reviewed: 0, retention_score: schedule.retentionScore })
      .select("id")
      .single();

    if (sessionError || !session) return { success: false, error: sessionError?.message ?? "Session failed." };
    sessionId = session.id;
  }

  const { data: sessionData } = await supabase
    .from("review_sessions")
    .select("cards_reviewed, again_count, hard_count, good_count, easy_count, retention_score")
    .eq("id", sessionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (sessionData) {
    const cardsReviewed = Number(sessionData.cards_reviewed ?? 0) + 1;
    const previousAverage = Number(sessionData.retention_score ?? schedule.retentionScore);
    const retentionAverage =
      cardsReviewed <= 1
        ? schedule.retentionScore
        : (previousAverage * (cardsReviewed - 1) + schedule.retentionScore) / cardsReviewed;
    const ratingColumn = ratingColumns[input.rating];

    await supabase
      .from("review_sessions")
      .update({
        cards_reviewed: cardsReviewed,
        [ratingColumn]: Number(sessionData[ratingColumn as keyof typeof sessionData] ?? 0) + 1,
        retention_score: retentionAverage,
        completed_at: new Date().toISOString(),
        metadata: {
          retentionSummary: {
            cardsReviewed,
            retentionEstimate: Math.round(retentionAverage * 100),
            difficultConcepts: [],
            streakBefore: retentionUpdate?.beforeStreak ?? 0,
            streakAfter: retentionUpdate?.afterStreak ?? 0,
            dailyGoalComplete: cardsReviewed >= 1,
          },
        },
      })
      .eq("id", sessionId)
      .eq("user_id", input.userId);
  }

  return {
    success: true,
    item: updated as ReviewItem,
    sessionId: sessionId ?? undefined,
    retention: retentionUpdate
      ? {
          streakBefore: retentionUpdate.beforeStreak,
          streakAfter: retentionUpdate.afterStreak,
          lastReviewDate: retentionUpdate.lastReviewDate,
          retentionEstimate: Math.round(schedule.retentionScore * 100),
        }
      : undefined,
  };
}
