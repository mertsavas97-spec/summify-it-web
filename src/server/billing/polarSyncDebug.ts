/**
 * In-memory snapshot of the last Polar → profile sync attempt (server process).
 * Used by POST /api/admin/debug-polar-last-event only.
 */

export type PolarUserResolutionSource =
  | "metadata"
  | "customer_metadata"
  | "external_customer_id"
  | "auth_email"
  | "profile_email";

export type PolarSyncDebugSnapshot = {
  at: string;
  eventType: string | null;
  payloadSummary: Record<string, unknown>;
  userResolution: {
    userId: string | null;
    source: PolarUserResolutionSource | null;
    attemptedSources: string[];
  } | null;
  planResolution: {
    planId: string | null;
    interval: string | null;
    source: string | null;
  } | null;
  profileUpdate: {
    success: boolean;
    userId: string | null;
    plan: string | null;
    subscriptionStatus: string | null;
    billingInterval: string | null;
    polarCustomerId: string | null;
    polarSubscriptionId: string | null;
    currentPeriodEnd: string | null;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

let lastSnapshot: PolarSyncDebugSnapshot | null = null;

export function getLastPolarSyncSnapshot(): PolarSyncDebugSnapshot | null {
  return lastSnapshot;
}

export function recordPolarSyncSnapshot(snapshot: PolarSyncDebugSnapshot): void {
  lastSnapshot = snapshot;
}

export function patchPolarSyncSnapshot(
  patch: Partial<Omit<PolarSyncDebugSnapshot, "at">> & { at?: string },
): void {
  lastSnapshot = {
    at: patch.at ?? new Date().toISOString(),
    eventType: patch.eventType ?? lastSnapshot?.eventType ?? null,
    payloadSummary: patch.payloadSummary ?? lastSnapshot?.payloadSummary ?? {},
    userResolution: patch.userResolution ?? lastSnapshot?.userResolution ?? null,
    planResolution: patch.planResolution ?? lastSnapshot?.planResolution ?? null,
    profileUpdate: patch.profileUpdate ?? lastSnapshot?.profileUpdate ?? null,
    error: patch.error ?? lastSnapshot?.error ?? null,
  };
}
