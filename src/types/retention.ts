export type DailyGoalKind = "review_cards" | "complete_session" | "generate_review_set";

export type ComebackPromptKind = "waiting_concepts" | "streak_at_risk" | "streak_recovery" | "fresh_start";

export type ReminderHookKind = "email" | "push" | "daily_digest" | "calendar";

export type RetentionDailyGoal = {
  id: DailyGoalKind;
  label: string;
  target: number;
  completed: number;
  complete: boolean;
};

export type WeeklyActivityDay = {
  date: string;
  label: string;
  reviewed: number;
  sessions: number;
  goalComplete: boolean;
};

export type ReviewStreakState = {
  current: number;
  longest: number;
  lastReviewDate: string | null;
  atRisk: boolean;
  missedYesterday: boolean;
  freezeAvailable: number;
  freezeUsed: boolean;
  recoveryEligible: boolean;
};

export type MasteryScore = {
  score: number;
  retentionComponent: number;
  successComponent: number;
  consistencyComponent: number;
  difficultyPenalty: number;
};

export type ReviewVelocity = {
  today: number;
  sevenDayAverage: number;
  trend: "up" | "flat" | "down";
};

export type ComebackPrompt = {
  kind: ComebackPromptKind;
  title: string;
  body: string;
  severity: "low" | "medium" | "high";
};

export type FutureReminderHook = {
  kind: ReminderHookKind;
  enabled: boolean;
  label: string;
  metadata?: {
    preferredHourLocal?: number;
    timezone?: string;
    digestCadence?: "daily" | "weekdays" | "weekly";
  };
};

export type RetentionSnapshot = {
  today: string;
  streak: ReviewStreakState;
  dailyGoals: RetentionDailyGoal[];
  mastery: MasteryScore;
  velocity: ReviewVelocity;
  weeklyActivity: WeeklyActivityDay[];
  comebackPrompt: ComebackPrompt | null;
  reminderHooks: FutureReminderHook[];
};

export type RetentionStatsRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
  streak_freezes_available: number;
  streak_freezes_used: number;
  recovery_available_until: string | null;
  reminder_preferences: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
