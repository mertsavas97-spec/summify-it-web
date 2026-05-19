import { createClientIfConfigured } from "@/lib/supabase/server";
import type { UsageEventInsert } from "@/types/database";

export type TrackUsageEventInput = {
  userId?: string | null;
  eventType: string;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  providerUsed?: string | null;
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

async function incrementUserLimits(
  supabase: NonNullable<Awaited<ReturnType<typeof createClientIfConfigured>>>,
  userId: string,
): Promise<void> {
  const today = utcToday();
  const thisMonth = utcYearMonth();

  const { data: row } = await supabase
    .from("user_limits")
    .select("daily_analysis_count, monthly_analysis_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) {
    await supabase.from("user_limits").upsert({
      user_id: userId,
      daily_analysis_count: 1,
      monthly_analysis_count: 1,
      last_reset_date: today,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const lastDate =
    typeof row.last_reset_date === "string"
      ? row.last_reset_date.slice(0, 10)
      : utcToday();

  const lastMonth = lastDate.slice(0, 7);
  const resetDaily = lastDate !== today;
  const resetMonthly = lastMonth !== thisMonth;

  const dailyCount = resetDaily ? 1 : (row.daily_analysis_count ?? 0) + 1;
  const monthlyCount = resetMonthly ? 1 : (row.monthly_analysis_count ?? 0) + 1;

  await supabase
    .from("user_limits")
    .update({
      daily_analysis_count: dailyCount,
      monthly_analysis_count: monthlyCount,
      last_reset_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Records a usage event for the authenticated user. Fails silently — never throws.
 * Anonymous callers should omit `userId` (no-op).
 */
export async function trackUsageEvent(input: TrackUsageEventInput): Promise<void> {
  try {
    if (!input.userId) return;

    const supabase = await createClientIfConfigured();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== input.userId) return;

    const payload: UsageEventInsert = {
      user_id: user.id,
      event_type: input.eventType,
      source_kind: input.sourceKind ?? null,
      intelligence_mode: input.intelligenceMode ?? null,
      provider_used: input.providerUsed ?? null,
    };

    const { error: insertError } = await supabase.from("usage_events").insert(payload);

    if (insertError) return;

    if (input.eventType === "analysis_completed") {
      await incrementUserLimits(supabase, user.id);
    }
  } catch {
    // Non-blocking — analysis must never fail because of tracking
  }
}

/** Fire-and-forget wrapper for API routes. */
export function trackUsageEventNonBlocking(input: TrackUsageEventInput): void {
  void trackUsageEvent(input);
}

export function trackAnalysisCompleted(input: {
  userId?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  providerUsed?: string | null;
}): void {
  trackUsageEventNonBlocking({
    userId: input.userId,
    eventType: "analysis_completed",
    sourceKind: input.sourceKind,
    intelligenceMode: input.intelligenceMode,
    providerUsed: input.providerUsed,
  });
}
