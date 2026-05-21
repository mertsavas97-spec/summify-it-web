import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { trackProductEventNonBlocking } from "@/server/usage/trackProductEvent";
import {
  extractPolarPriceIds,
  extractPolarProductIds,
  resolvePlanFromPolarPayload,
} from "@/lib/billing/polar/planResolution";
import { isActiveSubscriptionStatus } from "@/lib/billing/entitlements";
import type { BillingInterval, PlanId } from "@/types/plan";
import { devLog, devWarn } from "@/server/logging";
import type { SupabaseClient } from "@supabase/supabase-js";
import { finishPolarWebhookDebug } from "@/server/billing/polarWebhookDebugStore";

export type PolarUserResolutionSource =
  | "metadata"
  | "customer_metadata"
  | "external_customer_id"
  | "auth_email"
  | "profile_email";

export type ProfileBillingUpdate = {
  userId: string;
  plan?: PlanId;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  billingInterval?: BillingInterval | null;
};

export type PolarUserResolution = {
  userId: string;
  source: PolarUserResolutionSource;
};

export class PolarProfileSyncError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PolarProfileSyncError";
    this.code = code;
  }
}

function getAdminOrThrow(): SupabaseClient {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    throw new PolarProfileSyncError(
      error instanceof Error
        ? error.message
        : "SUPABASE_SERVICE_ROLE_KEY is not configured — cannot update profiles from webhooks.",
      "no_service_role",
    );
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(obj: Record<string, unknown> | null, key: string): string | null {
  const v = obj?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Emails from Polar customer / checkout payload (normalized lowercase). */
export function extractPolarCustomerEmails(data: Record<string, unknown>): string[] {
  const emails = new Set<string>();
  const push = (raw: string | null) => {
    if (!raw) return;
    const normalized = raw.trim().toLowerCase();
    if (normalized.includes("@")) emails.add(normalized);
  };

  const customer = asRecord(data.customer);
  push(readString(customer, "email"));
  push(readString(data, "customer_email"));
  push(readString(data, "email"));

  return [...emails];
}

/** Build a safe summary for debug logs (no secrets). */
export function summarizePolarPayload(
  data: Record<string, unknown>,
  eventType: string | null,
): Record<string, unknown> {
  const customer = asRecord(data.customer);
  const metadata = asRecord(data.metadata);
  const customerMeta = asRecord(customer?.metadata) ?? asRecord(data.customer_metadata);

  return {
    eventType,
    status: readString(data, "status"),
    subscriptionId: readString(data, "id") ?? readString(data, "subscription_id"),
    customerId: readString(customer, "id") ?? readString(data, "customer_id"),
    externalCustomerId:
      readString(data, "external_customer_id") ??
      readString(customer, "external_id") ??
      readString(customer, "external_customer_id"),
    customerEmails: extractPolarCustomerEmails(data),
    metadataKeys: metadata ? Object.keys(metadata) : [],
    summifyUserIdMeta: readString(metadata, "summify_user_id"),
    summifyPlanMeta: readString(metadata, "summify_plan"),
    customerMetadataKeys: customerMeta ? Object.keys(customerMeta) : [],
    summifyUserIdCustomerMeta: readString(customerMeta, "summify_user_id"),
    productIds: extractPolarProductIds(data),
    priceIds: extractPolarPriceIds(data),
  };
}

async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  const adminAuth = admin.auth.admin as {
    getUserByEmail?: (e: string) => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
  };

  if (typeof adminAuth.getUserByEmail === "function") {
    const { data, error } = await adminAuth.getUserByEmail(normalized);
    if (!error && data?.user?.id) return data.user.id;
  }

  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      devWarn("[summify.billing] polar_sync_auth_list_failed", {
        message: error.message,
        page,
      });
      break;
    }
    const match = data.users.find((u) => u.email?.trim().toLowerCase() === normalized);
    if (match?.id) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function findProfileIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    devWarn("[summify.billing] polar_sync_profile_email_lookup_failed", {
      message: error.message,
    });
    return null;
  }

  return data?.id ?? null;
}

/**
 * Resolve Supabase auth user id (= profiles.id) from Polar webhook payload.
 */
export async function resolvePolarUserId(
  data: Record<string, unknown>,
  admin?: SupabaseClient,
): Promise<PolarUserResolution | null> {
  const client = admin ?? getSupabaseAdmin();
  const attempted: string[] = [];

  const metadata = asRecord(data.metadata);
  const fromMeta =
    readString(metadata, "summify_user_id") ?? readString(metadata, "summifyUserId");
  attempted.push("metadata");
  if (fromMeta && isUuid(fromMeta)) {
    return { userId: fromMeta, source: "metadata" };
  }

  const customer = asRecord(data.customer);
  const customerMeta = asRecord(customer?.metadata) ?? asRecord(data.customer_metadata);
  const fromCustomerMeta =
    readString(customerMeta, "summify_user_id") ?? readString(customerMeta, "summifyUserId");
  attempted.push("customer_metadata");
  if (fromCustomerMeta && isUuid(fromCustomerMeta)) {
    return { userId: fromCustomerMeta, source: "customer_metadata" };
  }

  const externalId =
    readString(data, "external_customer_id") ??
    readString(customer, "external_id") ??
    readString(customer, "external_customer_id");
  attempted.push("external_customer_id");
  if (externalId && isUuid(externalId)) {
    return { userId: externalId, source: "external_customer_id" };
  }

  if (!client) {
    return null;
  }

  const emails = extractPolarCustomerEmails(data);
  for (const email of emails) {
    attempted.push(`auth_email:${email}`);
    const authUserId = await findAuthUserIdByEmail(client, email);
    if (authUserId) {
      return { userId: authUserId, source: "auth_email" };
    }
  }

  for (const email of emails) {
    attempted.push(`profile_email:${email}`);
    const profileId = await findProfileIdByEmail(client, email);
    if (profileId) {
      return { userId: profileId, source: "profile_email" };
    }
  }

  return null;
}

/** Resolve profiles.id from email (profile row, then auth.users). */
export async function resolveUserIdByEmailForAdmin(email: string): Promise<string> {
  const admin = getAdminOrThrow();
  const normalized = email.trim().toLowerCase();
  const fromProfile = await findProfileIdByEmail(admin, normalized);
  if (fromProfile) return fromProfile;
  const fromAuth = await findAuthUserIdByEmail(admin, normalized);
  if (fromAuth) return fromAuth;
  throw new PolarProfileSyncError(
    `No user found for email ${normalized}`,
    "user_unresolved",
  );
}

/** @deprecated Use resolvePolarUserId — sync extraction for tests. */
export function extractPolarUserId(data: Record<string, unknown>): string | null {
  const metadata = asRecord(data.metadata);
  const fromMeta =
    readString(metadata, "summify_user_id") ?? readString(metadata, "summifyUserId");
  if (fromMeta && isUuid(fromMeta)) return fromMeta;

  const customer = asRecord(data.customer);
  const customerMeta = asRecord(customer?.metadata) ?? asRecord(data.customer_metadata);
  const fromCustomerMeta =
    readString(customerMeta, "summify_user_id") ?? readString(customerMeta, "summifyUserId");
  if (fromCustomerMeta && isUuid(fromCustomerMeta)) return fromCustomerMeta;

  const externalId =
    readString(data, "external_customer_id") ??
    readString(customer, "external_id") ??
    readString(customer, "external_customer_id");
  if (externalId && isUuid(externalId)) return externalId;

  return null;
}

export async function ensureProfileRow(
  admin: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<void> {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.id) return;

  const { error } = await admin.from("profiles").insert({
    id: userId,
    email,
    plan: "free",
    updated_at: new Date().toISOString(),
  });

  if (error && error.code !== "23505") {
    throw new PolarProfileSyncError(
      `Could not create profile row for auth user ${userId}: ${error.message}`,
      "profile_create_failed",
    );
  }
}

export async function syncProfileBilling(update: ProfileBillingUpdate): Promise<boolean> {
  const admin = getAdminOrThrow();

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
    .select(
      "id, plan, subscription_status, billing_interval, polar_customer_id, polar_subscription_id, current_period_end",
    )
    .maybeSingle();

  if (error) {
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

  devLog("[summify.billing] polar_sync_profile_updated", {
    userId: update.userId,
    plan: data.plan,
    subscriptionStatus: data.subscription_status,
    billingInterval: data.billing_interval,
    polarCustomerId: data.polar_customer_id,
    polarSubscriptionId: data.polar_subscription_id,
    currentPeriodEnd: data.current_period_end,
  });

  return true;
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

function planForPaidEvent(data: Record<string, unknown>, eventKind: string) {
  const resolved = resolvePlanFromPolarPayload(data);
  if (!resolved) {
    throw new PolarProfileSyncError(
      `Could not resolve Summify plan from Polar payload (event=${eventKind}). ` +
        `Set POLAR_*_PRODUCT_ID or POLAR_*_PRICE_ID, or metadata.summify_plan.`,
      "plan_unresolved",
    );
  }
  return resolved;
}

type SyncContext = {
  eventKind: string;
  data: Record<string, unknown>;
  debugEventId?: string | null;
};

async function runPolarSync(
  ctx: SyncContext,
  buildUpdate: (input: {
    user: PolarUserResolution;
    admin: SupabaseClient;
  }) => Promise<ProfileBillingUpdate>,
): Promise<boolean> {
  const { eventKind, data, debugEventId } = ctx;
  const admin = getAdminOrThrow();
  const payloadSummary = summarizePolarPayload(data, eventKind);

  devLog("[summify.billing] polar_sync_start", { eventKind, payloadSummary, debugEventId });

  let resolvedUserId: string | null = null;

  try {
    const user = await resolvePolarUserId(data, admin);
    if (!user) {
      throw new PolarProfileSyncError(
        "No Supabase user resolved (metadata, external_customer_id, auth email, or profile email).",
        "user_unresolved",
      );
    }

    resolvedUserId = user.userId;

    devLog("[summify.billing] polar_sync_user_resolved", {
      userId: user.userId,
      source: user.source,
    });

    const emails = extractPolarCustomerEmails(data);
    await ensureProfileRow(admin, user.userId, emails[0] ?? null);

    const update = await buildUpdate({ user, admin });

    const resolvedPlan = resolvePlanFromPolarPayload(data);

    devLog("[summify.billing] polar_sync_plan_resolved", {
      planId: update.plan ?? resolvedPlan?.planId ?? null,
      interval: update.billingInterval ?? resolvedPlan?.interval ?? null,
      source: resolvedPlan?.source ?? null,
    });

    await syncProfileBilling(update);

    trackProductEventNonBlocking({
      eventType: "subscription_changed",
      userId: update.userId,
      plan: update.plan ?? null,
      insertViaServiceRole: true,
      metadata: {
        status: update.subscriptionStatus ?? null,
        interval: update.billingInterval ?? null,
      },
    });

    await finishPolarWebhookDebug(debugEventId ?? null, {
      syncStatus: "success",
      resolvedUserId: update.userId,
      resolvedPlan: update.plan ?? null,
      resolvedInterval: update.billingInterval ?? null,
      polarCustomerId: update.polarCustomerId ?? null,
      polarSubscriptionId: update.polarSubscriptionId ?? null,
      customerEmail: emails[0] ?? null,
    });

    return true;
  } catch (error) {
    const syncError =
      error instanceof PolarProfileSyncError
        ? error
        : new PolarProfileSyncError(
            error instanceof Error ? error.message : "Unknown sync error",
            "handler_error",
          );

    await finishPolarWebhookDebug(debugEventId ?? null, {
      syncStatus: "failed",
      resolvedUserId,
      errorCode: syncError.code,
      errorMessage: syncError.message,
    });

    devWarn("[summify.billing] polar_sync_failed", {
      eventKind,
      code: syncError.code,
      message: syncError.message,
    });

    throw syncError;
  }
}

/** Apply subscription.* webhook payload to profiles. */
export async function applyPolarSubscriptionEvent(
  data: Record<string, unknown>,
  eventKind = "subscription",
  debugEventId?: string | null,
): Promise<boolean> {
  return runPolarSync({ eventKind, data, debugEventId }, async ({ user }) => {
    const status = readString(data, "status");
    const subscriptionId = readString(data, "id");
    const customerId = extractCustomerId(data);
    const periodEnd = extractPeriodEnd(data);

    const update: ProfileBillingUpdate = {
      userId: user.userId,
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

    return update;
  });
}

/** Apply order.paid / checkout success payloads. */
export async function applyPolarOrderPaidEvent(
  data: Record<string, unknown>,
  eventKind = "order.paid",
  debugEventId?: string | null,
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
        customer_email: data.customer_email,
      },
      eventKind,
      debugEventId,
    );
  }

  return runPolarSync({ eventKind, data, debugEventId }, async ({ user }) => {
    const mapped = planForPaidEvent(data, eventKind);
    const status = readString(data, "status");

    return {
      userId: user.userId,
      plan: mapped.planId,
      polarCustomerId: extractCustomerId(data),
      polarSubscriptionId: readString(data, "subscription_id"),
      subscriptionStatus: isActiveSubscriptionStatus(status) ? status : "active",
      billingInterval: mapped.interval,
      currentPeriodEnd: extractPeriodEnd(data),
    };
  });
}

/** checkout.updated with status succeeded — metadata-first activation. */
export async function applyPolarCheckoutSucceededEvent(
  data: Record<string, unknown>,
  debugEventId?: string | null,
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
        customer_email: data.customer_email,
      },
      "checkout.updated",
      debugEventId,
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
      debugEventId,
    );
  }

  return applyPolarOrderPaidEvent(data, "checkout.updated", debugEventId);
}
