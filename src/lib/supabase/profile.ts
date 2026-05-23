import type { User } from "@supabase/supabase-js";
import { getAccountPlanLabel } from "@/lib/billing/entitlements";
import { getPlanDisplayName } from "@/data/pricingPlans";
import { resolvePlanId } from "@/lib/plan-limits";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";
import type { Profile, UserLimits } from "@/types/database";
import { devLog, devWarn } from "@/server/logging";
import { createClientIfConfigured } from "@/lib/supabase/server";

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureUserLimitsRow(
  supabase: NonNullable<Awaited<ReturnType<typeof createClientIfConfigured>>>,
  userId: string,
): Promise<void> {
  const today = utcToday();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_limits")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("user_limits").insert({
    user_id: userId,
    daily_analysis_count: 0,
    daily_audio_lesson_count: 0,
    daily_podcast_count: 0,
    monthly_analysis_count: 0,
    last_reset_date: today,
    updated_at: now,
  });

  if (error) {
    devWarn("[summify.profile] profile_ensure_limits_failed", {
      message: error.message,
      code: error.code,
    });
  }
}

/**
 * Ensures `profiles` and `user_limits` rows exist for the signed-in user.
 * Uses the Supabase server client session (cookies) — do not rely on a client-passed user alone.
 */
export async function ensureProfileForUser(passedUser?: User): Promise<Profile | null> {
  devLog("[summify.profile] profile_ensure_start", {
    passedUserId: passedUser?.id ?? null,
  });

  const supabase = await createClientIfConfigured();
  if (!supabase) {
    devWarn("[summify.profile] profile_ensure_upsert_failed", {
      reason: "supabase_not_configured",
    });
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    devWarn("[summify.profile] profile_ensure_upsert_failed", {
      reason: "no_authenticated_user",
      message: userError?.message,
    });
    return null;
  }

  devLog("[summify.profile] profile_ensure_user_found", { userId: user.id });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    devLog("[summify.profile] profile_ensure_session_found", {
      userId: user.id,
      expiresAt: session.expires_at ?? null,
    });
  } else {
    devWarn("[summify.profile] profile_ensure_upsert_failed", {
      reason: "no_session_access_token",
      userId: user.id,
    });
    return null;
  }

  if (passedUser && passedUser.id !== user.id) {
    devWarn("[summify.profile] profile_ensure_upsert_failed", {
      reason: "passed_user_mismatch",
      passedUserId: passedUser.id,
      sessionUserId: user.id,
    });
    return null;
  }

  const email = user.email ?? null;
  const now = new Date().toISOString();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let profile: Profile | null = null;
  let profileError: { message: string; code?: string } | null = null;

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ email, updated_at: now })
      .eq("id", user.id)
      .select()
      .single();

    profile = data as Profile | null;
    profileError = error;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email,
        plan: DEFAULT_PAID_PREVIEW_PLAN,
        updated_at: now,
      })
      .select()
      .single();

    profile = data as Profile | null;
    profileError = error;

    if (error?.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("profiles")
        .update({ email, updated_at: now })
        .eq("id", user.id)
        .select()
        .single();
      profile = retry as Profile | null;
      profileError = retryError;
    }
  }

  if (profileError || !profile) {
    devWarn("[summify.profile] profile_ensure_upsert_failed", {
      message: profileError?.message ?? "unknown",
      code: profileError?.code,
      hint:
        "Run GRANT + RLS policies from docs/SUPABASE_SCHEMA.md (permission denied usually means missing GRANT to authenticated role).",
    });
    console.error("[summify.profile] upsert failed", profileError?.message ?? "unknown");
    return null;
  }

  devLog("[summify.profile] profile_ensure_upsert_success", { userId: user.id });

  await ensureUserLimitsRow(supabase, user.id);

  return profile;
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

/** Human-readable plan label for account/dashboard UI. */
export function formatPlanLabel(plan: string, profile?: Profile | null): string {
  if (profile) return getAccountPlanLabel(profile);
  return getPlanDisplayName(resolvePlanId(plan));
}
