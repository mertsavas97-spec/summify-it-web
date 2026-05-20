/**
 * Supabase-backed Polar webhook debug log (serverless-safe).
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  extractPolarCustomerEmails,
  summarizePolarPayload,
} from "@/server/billing/syncProfileFromPolar";
import { devWarn } from "@/server/logging";

export type PolarWebhookDebugRow = {
  id: string;
  created_at: string;
  event_type: string | null;
  delivery_id: string | null;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  customer_email: string | null;
  resolved_user_id: string | null;
  resolved_plan: string | null;
  resolved_interval: string | null;
  sync_status: string;
  error_code: string | null;
  error_message: string | null;
  payload_summary: Record<string, unknown>;
};

export type BeginPolarWebhookDebugInput = {
  eventType: string;
  deliveryId?: string | null;
  data: Record<string, unknown>;
};

export type FinishPolarWebhookDebugInput = {
  syncStatus: "success" | "failed";
  resolvedUserId?: string | null;
  resolvedPlan?: string | null;
  resolvedInterval?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  customerEmail?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function idsFromSummary(summary: Record<string, unknown>): {
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  customerEmail: string | null;
} {
  const customerId = readString(summary, "customerId");
  const subscriptionId = readString(summary, "subscriptionId");
  const emails = summary.customerEmails;
  const firstEmail =
    Array.isArray(emails) && typeof emails[0] === "string" ? emails[0] : null;

  return {
    polarCustomerId: customerId,
    polarSubscriptionId: subscriptionId,
    customerEmail: firstEmail,
  };
}

function extractIdsFromData(data: Record<string, unknown>): {
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
} {
  const customer = asRecord(data.customer);
  return {
    polarCustomerId: readString(customer, "id") ?? readString(data, "customer_id"),
    polarSubscriptionId: readString(data, "id") ?? readString(data, "subscription_id"),
  };
}

/** Insert debug row at webhook start (monetization events only). */
export async function beginPolarWebhookDebug(
  input: BeginPolarWebhookDebugInput,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    devWarn("[summify.billing] polar_webhook_debug_skipped", { reason: "no_service_role" });
    return null;
  }

  const payloadSummary = summarizePolarPayload(input.data, input.eventType);
  const fromSummary = idsFromSummary(payloadSummary);
  const fromData = extractIdsFromData(input.data);
  const emails = extractPolarCustomerEmails(input.data);

  const row = {
    event_type: input.eventType,
    delivery_id: input.deliveryId ?? null,
    polar_customer_id: fromData.polarCustomerId ?? fromSummary.polarCustomerId,
    polar_subscription_id: fromData.polarSubscriptionId ?? fromSummary.polarSubscriptionId,
    customer_email: emails[0] ?? fromSummary.customerEmail,
    sync_status: "started",
    payload_summary: payloadSummary,
  };

  const { data, error } = await admin
    .from("polar_webhook_debug_events")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    devWarn("[summify.billing] polar_webhook_debug_insert_failed", {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return data?.id ?? null;
}

/** Update debug row after sync completes or fails. */
export async function finishPolarWebhookDebug(
  eventId: string | null,
  input: FinishPolarWebhookDebugInput,
): Promise<void> {
  if (!eventId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const patch: Record<string, unknown> = {
    sync_status: input.syncStatus,
  };

  if (input.resolvedUserId !== undefined) patch.resolved_user_id = input.resolvedUserId;
  if (input.resolvedPlan !== undefined) patch.resolved_plan = input.resolvedPlan;
  if (input.resolvedInterval !== undefined) patch.resolved_interval = input.resolvedInterval;
  if (input.errorCode !== undefined) patch.error_code = input.errorCode;
  if (input.errorMessage !== undefined) patch.error_message = input.errorMessage;
  if (input.polarCustomerId !== undefined) patch.polar_customer_id = input.polarCustomerId;
  if (input.polarSubscriptionId !== undefined) {
    patch.polar_subscription_id = input.polarSubscriptionId;
  }
  if (input.customerEmail !== undefined) patch.customer_email = input.customerEmail;

  const { error } = await admin
    .from("polar_webhook_debug_events")
    .update(patch)
    .eq("id", eventId);

  if (error) {
    devWarn("[summify.billing] polar_webhook_debug_update_failed", {
      eventId,
      message: error.message,
      code: error.code,
    });
  }
}

export type LatestPolarWebhookDebugQuery = {
  email?: string | null;
};

/** Latest debug event (newest first), optionally filtered by customer_email. */
export async function getLatestPolarWebhookDebugEvent(
  query?: LatestPolarWebhookDebugQuery,
): Promise<PolarWebhookDebugRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  let builder = admin
    .from("polar_webhook_debug_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const email = query?.email?.trim().toLowerCase();
  if (email) {
    builder = builder.eq("customer_email", email);
  }

  const { data, error } = await builder.maybeSingle();

  if (error) {
    devWarn("[summify.billing] polar_webhook_debug_read_failed", {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    created_at: data.created_at,
    event_type: data.event_type,
    delivery_id: data.delivery_id,
    polar_customer_id: data.polar_customer_id,
    polar_subscription_id: data.polar_subscription_id,
    customer_email: data.customer_email,
    resolved_user_id: data.resolved_user_id,
    resolved_plan: data.resolved_plan,
    resolved_interval: data.resolved_interval,
    sync_status: data.sync_status,
    error_code: data.error_code,
    error_message: data.error_message,
    payload_summary:
      data.payload_summary && typeof data.payload_summary === "object"
        ? (data.payload_summary as Record<string, unknown>)
        : {},
  };
}
