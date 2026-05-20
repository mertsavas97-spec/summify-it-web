import { getPlanDefinition } from "@/data/pricingPlans";
import type { Profile } from "@/types/database";
import type { PlanId } from "@/types/plan";
import { isPlanId } from "@/types/plan";
import { resolvePlanId } from "@/lib/plan-limits";

const PAID_PLAN_IDS: readonly PlanId[] = ["scholar", "pro", "team"];

export function isPaidPlanId(planId: PlanId): boolean {
  return PAID_PLAN_IDS.includes(planId);
}

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return (
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "uncanceled"
  );
}

/**
 * Whether the profile should receive paid-tier entitlements (modes, exports, limits).
 */
export function hasActivePaidEntitlement(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  const planId = resolvePlanId(profile.plan);
  if (!isPaidPlanId(planId)) return false;

  if (isActiveSubscriptionStatus(profile.subscription_status)) return true;

  // Webhook lag: plan already upgraded and Polar subscription linked.
  if (profile.polar_subscription_id && !profile.subscription_status) return true;

  return false;
}

/** Plan id used for limits/modes — never show beta when paid entitlement is active. */
export function resolveEntitlementPlanId(
  storedPlan: string | null | undefined,
  subscriptionStatus?: string | null,
  polarSubscriptionId?: string | null,
): PlanId {
  const planId = resolvePlanId(storedPlan);

  if (
    isPaidPlanId(planId) &&
    (isActiveSubscriptionStatus(subscriptionStatus) ||
      Boolean(polarSubscriptionId && !subscriptionStatus))
  ) {
    return planId;
  }

  if (planId === "beta") return "beta";
  return "free";
}

export function resolveEntitlementPlanIdFromProfile(profile: Profile | null | undefined): PlanId {
  if (!profile) return "free";

  if (hasActivePaidEntitlement(profile)) {
    return resolveEntitlementPlanId(
      profile.plan,
      profile.subscription_status,
      profile.polar_subscription_id,
    );
  }

  return resolveEntitlementPlanId(profile.plan, null, null);
}

/** Account/dashboard label — Public Beta only when actually on beta without paid access. */
export function getAccountPlanLabel(profile: Profile | null | undefined): string {
  if (!profile) return getPlanDefinition("free").name;

  const planId = resolvePlanId(profile.plan);

  if (hasActivePaidEntitlement(profile)) {
    return getPlanDefinition(planId).name;
  }

  if (planId === "beta") return getPlanDefinition("beta").name;

  return getPlanDefinition(planId).name;
}

export function getPlanEntitlements(planId: string) {
  const id = isPlanId(planId) ? planId : resolvePlanId(planId);
  return getPlanDefinition(id).limits;
}
