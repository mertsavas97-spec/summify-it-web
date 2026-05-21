import { createClientIfConfigured } from "@/lib/supabase/server";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { ProductEventType } from "@/lib/analytics/productEventTypes";
import { devLog, devWarn } from "@/server/logging";
import type { UsageEventInsert } from "@/types/database";

export type ProductEventMetadata = Record<
  string,
  string | number | boolean | null
>;

export type TrackProductEventInput = {
  eventType: ProductEventType;
  userId?: string | null;
  sessionId?: string | null;
  sourceType?: string | null;
  intelligenceMode?: string | null;
  plan?: string | null;
  success?: boolean | null;
  failureStage?: string | null;
  metadata?: ProductEventMetadata;
  /** When true, allows session-only inserts via service role (analyze route for guests). */
  trustedServer?: boolean;
  /** When true, inserts with service role (webhooks — no user session). */
  insertViaServiceRole?: boolean;
};

const MAX_METADATA_KEYS = 8;
const MAX_METADATA_STRING = 120;

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function sanitizeMetadata(
  metadata: ProductEventMetadata | undefined,
): Record<string, string | number | boolean | null> {
  if (!metadata) return {};
  const out: Record<string, string | number | boolean | null> = {};
  const keys = Object.keys(metadata).slice(0, MAX_METADATA_KEYS);
  for (const key of keys) {
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
    if (!safeKey) continue;
    const value = metadata[key];
    if (value == null) {
      out[safeKey] = null;
      continue;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      out[safeKey] = value;
      continue;
    }
    if (typeof value === "string") {
      out[safeKey] = value.slice(0, MAX_METADATA_STRING);
    }
  }
  return out;
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

function buildInsertPayload(input: TrackProductEventInput): UsageEventInsert {
  return {
    user_id: input.userId ?? null,
    session_id: input.userId ? null : (input.sessionId ?? null),
    event_type: input.eventType,
    source_type: input.sourceType ?? null,
    source_kind: input.sourceType ?? null,
    intelligence_mode: input.intelligenceMode ?? null,
    plan: input.plan ?? null,
    success: input.success ?? null,
    failure_stage: input.failureStage ?? null,
    metadata: sanitizeMetadata(input.metadata),
    provider_used: null,
  };
}

/**
 * Inserts a lightweight product event. Never throws.
 */
export async function trackProductEvent(input: TrackProductEventInput): Promise<void> {
  try {
    const hasUser = Boolean(input.userId);
    const hasSession = Boolean(input.sessionId?.trim());

    if (!hasUser && !hasSession) {
      devLog("[summify.product_event] skipped", { reason: "no_actor", eventType: input.eventType });
      return;
    }

    const payload = buildInsertPayload(input);

    if (hasUser && input.insertViaServiceRole && isServiceRoleConfigured()) {
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("usage_events").insert(payload);
      if (error) {
        devWarn("[summify.product_event] insert_failed", {
          message: error.message,
          code: error.code,
          eventType: input.eventType,
        });
        return;
      }
      devLog("[summify.product_event] inserted", {
        eventType: input.eventType,
        userId: input.userId,
        via: "service_role",
      });
      return;
    }

    if (hasUser) {
      const supabase = await createClientIfConfigured();
      if (!supabase) {
        devWarn("[summify.product_event] insert_failed", { reason: "supabase_not_configured" });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!user || user.id !== input.userId || !session?.access_token) {
        devLog("[summify.product_event] skipped", {
          reason: "session_mismatch",
          eventType: input.eventType,
        });
        return;
      }

      const { error } = await supabase.from("usage_events").insert(payload);
      if (error) {
        devWarn("[summify.product_event] insert_failed", {
          message: error.message,
          code: error.code,
          eventType: input.eventType,
        });
        return;
      }

      if (input.eventType === "analysis_completed") {
        await incrementUserLimits(supabase, user.id);
      }

      devLog("[summify.product_event] inserted", {
        eventType: input.eventType,
        userId: user.id,
      });
      return;
    }

    if (!input.trustedServer || !isServiceRoleConfigured()) {
      devLog("[summify.product_event] skipped", {
        reason: "anonymous_requires_trusted_server",
        eventType: input.eventType,
      });
      return;
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("usage_events").insert(payload);
    if (error) {
      devWarn("[summify.product_event] insert_failed", {
        message: error.message,
        code: error.code,
        eventType: input.eventType,
      });
      return;
    }

    devLog("[summify.product_event] inserted", {
      eventType: input.eventType,
      sessionId: input.sessionId,
    });
  } catch (err) {
    devWarn("[summify.product_event] insert_failed", {
      message: err instanceof Error ? err.message : String(err),
      eventType: input.eventType,
    });
  }
}

export function trackProductEventNonBlocking(input: TrackProductEventInput): void {
  void trackProductEvent(input);
}
