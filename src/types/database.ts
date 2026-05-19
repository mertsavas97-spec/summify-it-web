/** Row shape for `public.profiles` (Supabase). */
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
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
