import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  extractPolarPriceIds,
  extractPolarProductIds,
  resolvePlanFromPolarPayload,
} from "@/lib/billing/polar/planResolution";
import { isActiveSubscriptionStatus } from "@/lib/billing/entitlements";
import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval, PlanId } from "@/types/plan";
import { devLog, devWarn } from "@/server/logging";

export type ProfileBillingUpdate = {
  userId: string;
  plan?: PlanId;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  billingInterval?: BillingInterval | null;
};

export class PolarProfileSyncError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PolarProfileSyncError";
    this.code = code;
  }
}

export async function syncProfileBilling(update: ProfileBillingUpdate): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    devWarn("[summify.billing] profile_sync_skipped", { reason: "no_service_role" });
    throw new PolarProfileSyncError(
      "SUPABASE_SERVICE_ROLE_KEY is not configured — cannot update profiles from webhooks.",
      "no_service_role",
    );
  }

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (update.plan !== undefined) row.plan = update.plan;
  if (update.polarCustomerId !== undefined) row.polar_customer_id = update.polarCustomerId;
  if (update.polarSubscriptionId !== undefined) {
    row.polar_subscription_id = update.polarSubscriptionId;
  }
  if (update.subscriptionStatus !== undefined) {
    row.subscription_status = update.subscriptionStatus;
  }
  if (update.currentPeriodEnd !== undefined) {
    row.current_period_end = update.currentPeriodEnd;
  }
  if (update.billingInterval !== undefined) {
    row.billing_interval = update.billingInterval;
  }

  const { error, data } = await admin
    .from("profiles")
    .update(row)
    .eq("id", update.userId)
    .select("id, plan, subscription_status")
    .maybeSingle();

  if (error) {
    devWarn("[summify.billing] profile_sync_failed", {
      userId: update.userId,
      message: error.message,
      code: error.code,
    });
    throw new PolarProfileSyncError(
      `Profile update failed: ${error.message}`,
      "profile_update_failed",
    );
  }

  if (!data) {
    throw new PolarProfileSyncError(
      `No profile row found for user ${update.userId}`,
      "profile_not_found",
    );
  }

  devLog("[summify.billing] profile_sync_success", {
    userId: update.userId,
    plan: update.plan,
    subscriptionStatus: update.subscriptionStatus,
    profilePlan: data.plan,
    profileStatus: data.subscription_status,
  });
  return true;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function extractPolarUserId(data: Record<string, unknown>): string | null {
  const metadata = asRecord(data.metadata);
  const fromMeta =
    readString(metadata, "summify_user_id") ?? readString(metadata, "summifyUserId");
  if (fromMeta) return fromMeta;

  const customer = asRecord(data.customer);
  const customerMeta = asRecord(customer?.metadata) ?? asRecord(data.customer_metadata);
  const fromCustomerMeta =
    readString(customerMeta, "summify_user_id") ?? readString(customerMeta, "summifyUserId");
  if (fromCustomerMeta) return fromCustomerMeta;

  const externalId =
    readString(data, "external_customer_id") ??
    readString(customer, "external_id") ??
    readString(customer, "external_customer_id");
  if (externalId) return externalId;

  return null;
}

function extractCustomerId(data: Record<string, unknown>): string | null {
  const customer = asRecord(data.customer);
  return readString(customer, "id") ?? readString(data, "customer_id");
}

function extractPeriodEnd(data: Record<string, unknown>): string | null {
  const end =
    readString(data, "current_period_end") ??
    readString(data, "current_period_end_at") ??
    readString(data, "ends_at");
  if (!end) return null;
  const date = new Date(end);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function logResolutionContext(
  eventKind: string,
  data: Record<string, unknown>,
  userId: string | null,
  resolved: ReturnType<typeof resolvePlanFromPolarPayload>,
): void {
  devLog("[summify.billing] webhook_resolve", {
    eventKind,
    userId,
    productIds: extractPolarProductIds(data),
    priceIds: extractPolarPriceIds(data),
    resolvedPlan: resolved?.planId ?? null,
    resolvedInterval: resolved?.interval ?? null,
    resolveSource: resolved?.source ?? null,
    status: readString(data, "status"),
  });
}

function planForPaidEvent(
  data: Record<string, unknown>,
  eventKind: string,
): { planId: BillingCheckoutPlanId; interval: BillingInterval } {
  const resolved = resolvePlanFromPolarPayload(data);
  const userId = extractPolarUserId(data);

  logResolutionContext(eventKind, data, userId, resolved);

  if (!resolved) {
    throw new PolarProfileSyncError(
      `Could not resolve Summify plan from Polar payload (event=${eventKind}). ` +
        `Set POLAR_*_PRODUCT_ID or POLAR_*_PRICE_ID for this catalog item, or pass metadata.summify_plan.`,
      "plan_unresolved",
    );
  }

  return { planId: resolved.planId, interval: resolved.interval };
}

/** Apply subscription.* webhook payload to profiles. */
export async function applyPolarSubscriptionEvent(
  data: Record<string, unknown>,
  eventKind = "subscription",
): Promise<boolean> {
  const userId = extractPolarUserId(data);
  if (!userId) {
    throw new PolarProfileSyncError(
      "No Supabase user id in webhook (metadata.summify_user_id, customer_metadata, or external_customer_id).",
      "user_unresolved",
    );
  }

  const status = readString(data, "status");
  const subscriptionId = readString(data, "id");
  const customerId = extractCustomerId(data);
  const periodEnd = extractPeriodEnd(data);

  const update: ProfileBillingUpdate = {
    userId,
    polarCustomerId: customerId,
    polarSubscriptionId: subscriptionId,
    subscriptionStatus: status,
    currentPeriodEnd: periodEnd,
  };

  if (isActiveSubscriptionStatus(status)) {
    const mapped = planForPaidEvent(data, eventKind);
    update.plan = mapped.planId;
    update.billingInterval = mapped.interval;
  } else if (status) {
    update.plan = "free";
    update.billingInterval = null;
  }

  return syncProfileBilling(update);
}

/** Apply order.paid / checkout success payloads. */
export async function applyPolarOrderPaidEvent(
  data: Record<string, unknown>,
  eventKind = "order.paid",
): Promise<boolean> {
  const subscription = asRecord(data.subscription);
  if (subscription) {
    return applyPolarSubscriptionEvent(
      {
        ...subscription,
        customer: data.customer ?? subscription.customer,
        metadata: subscription.metadata ?? data.metadata,
        customer_metadata: data.customer_metadata,
        external_customer_id: data.external_customer_id,
      },
      eventKind,
    );
  }

  const userId = extractPolarUserId(data);
  if (!userId) {
    throw new PolarProfileSyncError(
      "No Supabase user id on paid order/checkout payload.",
      "user_unresolved",
    );
  }

  const mapped = planForPaidEvent(data, eventKind);
  const status = readString(data, "status");

  return syncProfileBilling({
    userId,
    plan: mapped.planId,
    polarCustomerId: extractCustomerId(data),
    polarSubscriptionId: readString(data, "subscription_id"),
    subscriptionStatus: isActiveSubscriptionStatus(status) ? status : "active",
    billingInterval: mapped.interval,
    currentPeriodEnd: extractPeriodEnd(data),
  });
}

/** checkout.updated with status succeeded — metadata-first activation. */
export async function applyPolarCheckoutSucceededEvent(
  data: Record<string, unknown>,
): Promise<boolean> {
  const subscriptionId = readString(data, "subscription_id");
  const subscription = asRecord(data.subscription);

  if (subscription) {
    return applyPolarSubscriptionEvent(
      {
        ...subscription,
        metadata: subscription.metadata ?? data.metadata,
        customer: data.customer ?? subscription.customer,
        external_customer_id: data.external_customer_id,
      },
      "checkout.updated",
    );
  }

  if (subscriptionId) {
    return applyPolarOrderPaidEvent(
      {
        ...data,
        subscription_id: subscriptionId,
        status: "active",
      },
      "checkout.updated",
    );
  }

  return applyPolarOrderPaidEvent(data, "checkout.updated");
}
