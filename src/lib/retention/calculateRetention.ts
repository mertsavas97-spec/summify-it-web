import {
  addUtcDays,
  daysBetweenUtc,
  lastSevenUtcDays,
  shortWeekday,
  utcDateKey,
} from "@/lib/retention/date";
import type {
  ComebackPrompt,
  FutureReminderHook,
  MasteryScore,
  RetentionDailyGoal,
  RetentionSnapshot,
  RetentionStatsRow,
  ReviewStreakState,
  ReviewVelocity,
  WeeklyActivityDay,
} from "@/types/retention";

export type RetentionReviewSample = {
  createdAt?: string | null;
  lastReviewedAt: string | null;
  retentionScore: number;
  reviewCount: number;
  lapses: number;
  difficulty?: string | null;
};

export type RetentionSessionSample = {
  startedAt: string;
  completedAt: string | null;
  cardsReviewed: number;
  retentionScore: number | null;
};

export type RetentionCalculationInput = {
  reviews: RetentionReviewSample[];
  sessions: RetentionSessionSample[];
  dueToday: number;
  totalActive: number;
  difficultCount: number;
  dailyReviewTarget: number;
  persisted?: Pick<
    RetentionStatsRow,
    | "current_streak"
    | "longest_streak"
    | "last_review_date"
    | "streak_freezes_available"
    | "streak_freezes_used"
    | "recovery_available_until"
  > | null;
  now?: Date;
};

function countReviewsByDate(reviews: RetentionReviewSample[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    if (!review.lastReviewedAt) continue;
    const key = utcDateKey(new Date(review.lastReviewedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function countSessionsByDate(sessions: RetentionSessionSample[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const date = utcDateKey(new Date(session.completedAt ?? session.startedAt));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return counts;
}

function computeStreak(input: {
  countsByDate: Map<string, number>;
  today: string;
  persisted?: RetentionCalculationInput["persisted"];
}): ReviewStreakState {
  const yesterday = addUtcDays(input.today, -1);
  const reviewedToday = (input.countsByDate.get(input.today) ?? 0) > 0;
  const reviewedYesterday = (input.countsByDate.get(yesterday) ?? 0) > 0;
  const lastReviewDate = [...input.countsByDate.keys()].sort().at(-1) ?? input.persisted?.last_review_date ?? null;

  let cursor = reviewedToday ? input.today : yesterday;
  let current = 0;
  while ((input.countsByDate.get(cursor) ?? 0) > 0) {
    current += 1;
    cursor = addUtcDays(cursor, -1);
  }

  const missedYesterday = Boolean(lastReviewDate && !reviewedToday && !reviewedYesterday);
  if (missedYesterday) current = 0;

  const persistedLongest = input.persisted?.longest_streak ?? 0;
  const freezeAvailable = input.persisted?.streak_freezes_available ?? 0;
  const recoveryUntil = input.persisted?.recovery_available_until ?? null;
  const recoveryEligible = Boolean(
    recoveryUntil && daysBetweenUtc(input.today, recoveryUntil) >= 0 && missedYesterday,
  );

  return {
    current,
    longest: Math.max(persistedLongest, current),
    lastReviewDate,
    atRisk: !reviewedToday && reviewedYesterday,
    missedYesterday,
    freezeAvailable,
    freezeUsed: false,
    recoveryEligible,
  };
}

function dailyGoals(input: {
  todayReviews: number;
  todaySessions: number;
  dailyReviewTarget: number;
  generatedToday: boolean;
}): RetentionDailyGoal[] {
  return [
    {
      id: "review_cards",
      label: `Review ${input.dailyReviewTarget} cards`,
      target: input.dailyReviewTarget,
      completed: Math.min(input.todayReviews, input.dailyReviewTarget),
      complete: input.todayReviews >= input.dailyReviewTarget,
    },
    {
      id: "complete_session",
      label: "Complete 1 memory session",
      target: 1,
      completed: Math.min(input.todaySessions, 1),
      complete: input.todaySessions >= 1,
    },
    {
      id: "generate_review_set",
      label: "Create 1 practice set",
      target: 1,
      completed: input.generatedToday ? 1 : 0,
      complete: input.generatedToday,
    },
  ];
}

function masteryScore(input: {
  reviews: RetentionReviewSample[];
  streak: number;
  weeklyGoalDays: number;
  difficultCount: number;
}): MasteryScore {
  if (input.reviews.length === 0) {
    return {
      score: 0,
      retentionComponent: 0,
      successComponent: 0,
      consistencyComponent: 0,
      difficultyPenalty: 0,
    };
  }

  const retentionComponent =
    input.reviews.reduce((sum, review) => sum + review.retentionScore, 0) / input.reviews.length;
  const reviewed = input.reviews.filter((review) => review.reviewCount > 0);
  const successful = reviewed.filter((review) => review.retentionScore >= 0.62 && review.lapses === 0);
  const successComponent = reviewed.length > 0 ? successful.length / reviewed.length : 0;
  const consistencyComponent = Math.min(1, (input.streak * 0.08) + (input.weeklyGoalDays / 7) * 0.55);
  const difficultyPenalty = Math.min(0.22, input.difficultCount * 0.025);
  const score = Math.round(
    Math.max(
      0,
      Math.min(1, retentionComponent * 0.5 + successComponent * 0.3 + consistencyComponent * 0.2 - difficultyPenalty),
    ) * 100,
  );

  return {
    score,
    retentionComponent: Math.round(retentionComponent * 100),
    successComponent: Math.round(successComponent * 100),
    consistencyComponent: Math.round(consistencyComponent * 100),
    difficultyPenalty: Math.round(difficultyPenalty * 100),
  };
}

function velocity(weeklyActivity: WeeklyActivityDay[]): ReviewVelocity {
  const today = weeklyActivity.at(-1)?.reviewed ?? 0;
  const sevenDayAverage =
    weeklyActivity.reduce((sum, day) => sum + day.reviewed, 0) / Math.max(1, weeklyActivity.length);
  const previousThree = weeklyActivity.slice(0, 3).reduce((sum, day) => sum + day.reviewed, 0) / 3;
  const latestThree = weeklyActivity.slice(-3).reduce((sum, day) => sum + day.reviewed, 0) / 3;
  const delta = latestThree - previousThree;

  return {
    today,
    sevenDayAverage: Math.round(sevenDayAverage * 10) / 10,
    trend: delta >= 1 ? "up" : delta <= -1 ? "down" : "flat",
  };
}

function comebackPrompt(input: {
  dueToday: number;
  streak: ReviewStreakState;
  totalActive: number;
}): ComebackPrompt | null {
  if (input.streak.atRisk) {
    return {
      kind: "streak_at_risk",
      title: "Your memory streak is at risk",
      body: "Review one card today to keep the habit alive.",
      severity: "high",
    };
  }

  if (input.streak.recoveryEligible) {
    return {
      kind: "streak_recovery",
      title: "A quick review can recover your rhythm",
      body: "One focused session will restart your daily learning loop.",
      severity: "medium",
    };
  }

  if (input.dueToday > 0) {
    return {
      kind: "waiting_concepts",
      title: `${input.dueToday} concepts waiting`,
      body: "A short review will clear today’s queue.",
      severity: input.dueToday >= 12 ? "medium" : "low",
    };
  }

  if (input.totalActive === 0) {
    return {
      kind: "fresh_start",
      title: "Build today’s memory stack",
      body: "Create a practice set from any saved analysis.",
      severity: "low",
    };
  }

  return null;
}

function reminderHooks(): FutureReminderHook[] {
  return [
    { kind: "email", enabled: false, label: "Email reminder" },
    { kind: "push", enabled: false, label: "Push notification" },
    { kind: "daily_digest", enabled: false, label: "Daily digest", metadata: { digestCadence: "daily" } },
    { kind: "calendar", enabled: false, label: "Calendar review block" },
  ];
}

export function calculateRetentionSnapshot(input: RetentionCalculationInput): RetentionSnapshot {
  const today = utcDateKey(input.now ?? new Date());
  const reviewsByDate = countReviewsByDate(input.reviews);
  const sessionsByDate = countSessionsByDate(input.sessions);
  const week = lastSevenUtcDays(today);
  const weeklyActivity = week.map((date): WeeklyActivityDay => {
    const reviewed = reviewsByDate.get(date) ?? 0;
    return {
      date,
      label: date === today ? "Today" : shortWeekday(date),
      reviewed,
      sessions: sessionsByDate.get(date) ?? 0,
      goalComplete: reviewed >= input.dailyReviewTarget,
    };
  });

  const streak = computeStreak({ countsByDate: reviewsByDate, today, persisted: input.persisted });
  const todayReviews = reviewsByDate.get(today) ?? 0;
  const todaySessions = sessionsByDate.get(today) ?? 0;
  const generatedToday = input.reviews.some((review) => review.createdAt && utcDateKey(new Date(review.createdAt)) === today);
  const goals = dailyGoals({
    todayReviews,
    todaySessions,
    dailyReviewTarget: input.dailyReviewTarget,
    generatedToday,
  });
  const weeklyGoalDays = weeklyActivity.filter((day) => day.goalComplete).length;

  return {
    today,
    streak,
    dailyGoals: goals,
    mastery: masteryScore({
      reviews: input.reviews,
      streak: streak.current,
      weeklyGoalDays,
      difficultCount: input.difficultCount,
    }),
    velocity: velocity(weeklyActivity),
    weeklyActivity,
    comebackPrompt: comebackPrompt({
      dueToday: input.dueToday,
      streak,
      totalActive: input.totalActive,
    }),
    reminderHooks: reminderHooks(),
  };
}
