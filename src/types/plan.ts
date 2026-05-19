/** Subscription / entitlement plan identifiers stored on `profiles.plan`. */
export type PlanId = "beta" | "free" | "scholar" | "pro" | "team";

export type BillingInterval = "monthly" | "yearly";

export const PLAN_IDS = ["beta", "free", "scholar", "pro", "team"] as const satisfies readonly PlanId[];

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

/** Default plan for new signups once billing launches (current users stay on beta). */
export const DEFAULT_PAID_PREVIEW_PLAN: PlanId = "free";
