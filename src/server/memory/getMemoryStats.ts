import { createClientIfConfigured } from "@/lib/supabase/server";
import { calculateRetentionSnapshot } from "@/lib/retention/calculateRetention";
import { utcDateKey } from "@/lib/retention/date";
import type { DifficultConcept, ReviewItem, ReviewStats } from "@/types/memory";
import type { RetentionStatsRow } from "@/types/retention";

const EMPTY_STATS: ReviewStats = {
  dueToday: 0,
  overdue: 0,
  totalActive: 0,
  cardsReviewed: 0,
  reviewStreak: 0,
  retentionEstimate: 0,
  difficultConcepts: [],
  retention: calculateRetentionSnapshot({
    reviews: [],
    sessions: [],
    dueToday: 0,
    totalActive: 0,
    difficultCount: 0,
    dailyReviewTarget: 8,
  }),
};

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function computeStreak(reviewedDates: string[]): number {
  const reviewed = new Set(reviewedDates.map(dateKey));
  let cursor = new Date(`${utcDateKey()}T00:00:00.000Z`);
  let streak = 0;

  if (!reviewed.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  while (reviewed.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

export async function getMemoryStats(userId: string, dailyReviewTarget = 8): Promise<ReviewStats> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return EMPTY_STATS;

  const now = new Date();
  const todayEnd = new Date(`${utcDateKey()}T00:00:00.000Z`);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const [dueResult, totalResult, reviewedResult, difficultResult, sessionsResult, persistedResult] =
    await Promise.all([
    supabase
      .from("review_items")
      .select("id, next_review_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .lte("next_review_at", todayEnd.toISOString()),
    supabase
      .from("review_items")
      .select("id, created_at, retention_score, review_count, lapses, difficulty, last_reviewed_at", { count: "exact" })
      .eq("user_id", userId)
      .is("archived_at", null),
    supabase
      .from("review_items")
      .select("last_reviewed_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .not("last_reviewed_at", "is", null)
      .order("last_reviewed_at", { ascending: false })
      .limit(400),
    supabase
      .from("review_items")
      .select("id, prompt, context, retention_score, lapses")
      .eq("user_id", userId)
      .is("archived_at", null)
      .or("difficulty.eq.difficult,lapses.gte.1,retention_score.lt.0.55")
      .order("retention_score", { ascending: true })
      .limit(4),
    supabase
      .from("review_sessions")
      .select("started_at, completed_at, cards_reviewed, retention_score")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(120),
    supabase
      .from("retention_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (dueResult.error || totalResult.error || reviewedResult.error || difficultResult.error) {
    return EMPTY_STATS;
  }

  const dueRows = (dueResult.data ?? []) as Pick<ReviewItem, "id" | "next_review_at">[];
  const totalRows = (totalResult.data ?? []) as Pick<
    ReviewItem,
    "id" | "created_at" | "retention_score" | "review_count" | "lapses" | "difficulty" | "last_reviewed_at"
  >[];
  const reviewedRows = (reviewedResult.data ?? []) as Pick<ReviewItem, "last_reviewed_at">[];
  const difficultRows = (difficultResult.data ?? []) as Pick<
    ReviewItem,
    "id" | "prompt" | "context" | "retention_score" | "lapses"
  >[];

  const retentionEstimate =
    totalRows.length > 0
      ? Math.round(
          (totalRows.reduce((sum, item) => sum + Number(item.retention_score ?? 0), 0) /
            totalRows.length) *
            100,
        )
      : 0;

  const difficultConcepts: DifficultConcept[] = difficultRows.map((item) => ({
    id: item.id,
    title: item.context || item.prompt,
    prompt: item.prompt,
    retentionScore: Number(item.retention_score ?? 0),
    lapses: item.lapses ?? 0,
  }));

  const retention = calculateRetentionSnapshot({
    reviews: totalRows.map((item) => ({
      createdAt: item.created_at,
      lastReviewedAt: item.last_reviewed_at,
      retentionScore: Number(item.retention_score ?? 0),
      reviewCount: item.review_count ?? 0,
      lapses: item.lapses ?? 0,
      difficulty: item.difficulty,
    })),
    sessions: ((sessionsResult.data ?? []) as {
      started_at: string;
      completed_at: string | null;
      cards_reviewed: number;
      retention_score: number | null;
    }[]).map((session) => ({
      startedAt: session.started_at,
      completedAt: session.completed_at,
      cardsReviewed: session.cards_reviewed,
      retentionScore: session.retention_score,
    })),
    dueToday: dueRows.length,
    totalActive: totalResult.count ?? totalRows.length,
    difficultCount: difficultRows.length,
    dailyReviewTarget,
    persisted: persistedResult.data as RetentionStatsRow | null,
  });

  return {
    dueToday: dueRows.length,
    overdue: dueRows.filter((item) => new Date(item.next_review_at).getTime() < now.getTime()).length,
    totalActive: totalResult.count ?? totalRows.length,
    cardsReviewed: reviewedRows.length,
    reviewStreak: computeStreak(
      reviewedRows
        .map((row) => row.last_reviewed_at)
        .filter((value): value is string => Boolean(value)),
    ),
    retentionEstimate,
    difficultConcepts,
    retention,
  };
}
