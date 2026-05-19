import { createClientIfConfigured } from "@/lib/supabase/server";
import { addUtcDays, daysBetweenUtc, utcDateKey } from "@/lib/retention/date";
import type { RetentionStatsRow } from "@/types/retention";

type UpdateRetentionStatsResult = {
  beforeStreak: number;
  afterStreak: number;
  lastReviewDate: string;
};

export async function updateRetentionStatsForReview(
  userId: string,
  reviewedAt = new Date(),
): Promise<UpdateRetentionStatsResult | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const today = utcDateKey(reviewedAt);
  const { data } = await supabase
    .from("retention_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const existing = data as RetentionStatsRow | null;
  const beforeStreak = existing?.current_streak ?? 0;
  const lastReviewDate = existing?.last_review_date ?? null;

  let currentStreak = beforeStreak;
  if (!lastReviewDate) {
    currentStreak = 1;
  } else if (lastReviewDate === today) {
    currentStreak = Math.max(1, beforeStreak);
  } else if (daysBetweenUtc(lastReviewDate, today) === 1) {
    currentStreak = beforeStreak + 1;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(existing?.longest_streak ?? 0, currentStreak);
  const recoveryAvailableUntil =
    currentStreak === 1 && lastReviewDate && daysBetweenUtc(lastReviewDate, today) > 1
      ? addUtcDays(today, 2)
      : existing?.recovery_available_until ?? null;

  const row = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_review_date: today,
    streak_freezes_available: existing?.streak_freezes_available ?? 0,
    streak_freezes_used: existing?.streak_freezes_used ?? 0,
    recovery_available_until: recoveryAvailableUntil,
    reminder_preferences: existing?.reminder_preferences ?? null,
  };

  const { error } = await supabase.from("retention_stats").upsert(row, { onConflict: "user_id" });
  if (error) return null;

  return {
    beforeStreak,
    afterStreak: currentStreak,
    lastReviewDate: today,
  };
}
