import type { User } from "@supabase/supabase-js";
import type { Profile, UserLimits } from "@/types/database";
import { createClientIfConfigured } from "@/lib/supabase/server";

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Ensures `profiles` and `user_limits` rows exist for the signed-in user.
 * Safe to call after login or on /account.
 */
export async function ensureProfileForUser(user: User): Promise<Profile | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const email = user.email ?? null;
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        plan: "beta",
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (profileError) {
    console.error("[summify.profile] upsert failed", profileError.message);
    return null;
  }

  const { error: limitsError } = await supabase.from("user_limits").upsert(
    {
      user_id: user.id,
      daily_analysis_count: 0,
      last_reset_date: utcToday(),
      monthly_analysis_count: 0,
      updated_at: now,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (limitsError) {
    console.error("[summify.profile] user_limits init failed", limitsError.message);
  }

  return profile as Profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export async function getUserLimits(userId: string): Promise<UserLimits | null> {
  const supabase = await createClientIfConfigured();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserLimits;
}

/** Human-readable plan label for account UI. */
export function formatPlanLabel(plan: string): string {
  if (plan === "beta") return "Public Beta";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
