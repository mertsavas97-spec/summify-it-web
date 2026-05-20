import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanFromPolarPriceId } from "@/lib/billing/polar/prices";
import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { devLog, devWarn } from "@/server/logging";

export type ProfileBillingUpdate = {
  userId: string;
  plan?: BillingCheckoutPlanId | "beta" | "free";
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  billingInterval?: BillingInterval | null;
};

export async function syncProfileBilling(update: ProfileBillingUpdate): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    devWarn("[summify.billing] profile_sync_skipped", { reason: "no_service_role" });
    return false;
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

  const { error } = await admin.from("profiles").update(row).eq("id", update.userId);

  if (error) {
    devWarn("[summify.billing] profile_sync_failed", {
      userId: update.userId,
      message: error.message,
    });
    return false;
  }

  devLog("[summify.billing] profile_sync_success", { userId: update.userId, plan: update.plan });
  return true;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === "string" ? v : null;
}

function extractUserId(data: Record<string, unknown>): string | null {
  const metadata = asRecord(data.metadata);
  const fromMeta =
    readString(metadata, "summify_user_id") ?? readString(metadata, "summifyUserId");
  if (fromMeta) return fromMeta;

  const customer = asRecord(data.customer);
  const externalId =
    readString(customer, "external_id") ?? readString(customer, "external_customer_id");
  if (externalId) return externalId;

  return readString(data, "external_customer_id");
}

function extractCustomerId(data: Record<string, unknown>): string | null {
  const customer = asRecord(data.customer);
  return readString(customer, "id") ?? readString(data, "customer_id");
}

function extractPriceId(data: Record<string, unknown>): string | null {
  const price = asRecord(data.price);
  const productPrice = asRecord(data.product_price);

  const direct =
    readString(data, "price_id") ??
    readString(price, "id") ??
    readString(data, "product_price_id") ??
    readString(productPrice, "id");

  if (direct) return direct;

  const items = data.items;
  if (Array.isArray(items)) {
    for (const entry of items) {
      const item = asRecord(entry);
      const itemPrice = asRecord(item?.price);
      const found =
        readString(item, "price_id") ??
        readString(itemPrice, "id") ??
        readString(asRecord(item?.product_price), "id");
      if (found) return found;
    }
  }

  return null;
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

function isActiveSubscriptionStatus(status: string | null): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized === "active" || normalized === "trialing" || normalized === "uncanceled";
}

/** Apply subscription.* webhook payload to profiles. */
export async function applyPolarSubscriptionEvent(
  data: Record<string, unknown>,
): Promise<boolean> {
  const userId = extractUserId(data);
  if (!userId) {
    devWarn("[summify.billing] subscription_event_no_user", {});
    return false;
  }

  const priceId = extractPriceId(data);
  const mapped = resolvePlanFromPolarPriceId(priceId);
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
    billingInterval: mapped?.interval ?? null,
  };

  if (mapped && isActiveSubscriptionStatus(status)) {
    update.plan = mapped.planId;
  } else if (status && !isActiveSubscriptionStatus(status)) {
    update.plan = "beta";
  }

  return syncProfileBilling(update);
}

/** Apply order.paid when it includes subscription or checkout metadata. */
export async function applyPolarOrderPaidEvent(data: Record<string, unknown>): Promise<boolean> {
  const subscription = asRecord(data.subscription);
  if (subscription) {
    return applyPolarSubscriptionEvent({ ...subscription, customer: data.customer });
  }

  const userId = extractUserId(data);
  if (!userId) return false;

  const priceId = extractPriceId(data);
  const mapped = resolvePlanFromPolarPriceId(priceId);
  if (!mapped) return false;

  return syncProfileBilling({
    userId,
    plan: mapped.planId,
    polarCustomerId: extractCustomerId(data),
    subscriptionStatus: "active",
    billingInterval: mapped.interval,
  });
}
