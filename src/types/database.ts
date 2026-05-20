/** Row shape for `public.profiles` (Supabase). */
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  billing_interval: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.user_limits` (Supabase). */
export type UserLimits = {
  user_id: string;
  daily_analysis_count: number;
  last_reset_date: string;
  monthly_analysis_count: number;
  updated_at: string;
};

/** Insert payload for `public.usage_events`. */
export type UsageEventInsert = {
  user_id: string;
  event_type: string;
  source_kind?: string | null;
  intelligence_mode?: string | null;
  provider_used?: string | null;
};

/** Row shape for `public.review_items` (private memory layer). */
export type ReviewItemRow = {
  id: string;
  user_id: string;
  analysis_id: string;
  source_kind: string;
  source_id: string;
  prompt: string;
  answer: string;
  context: string | null;
  difficulty: string;
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

/** Row shape for `public.review_sessions` (private memory layer). */
export type ReviewSessionRow = {
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
  metadata: Record<string, unknown> | null;
};

/** Row shape for `public.retention_stats` (private habit metadata). */
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
