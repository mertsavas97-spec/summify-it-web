import type {
  BillingCheckoutPlanId,
  BillingPlanMapping,
  BillingProvider,
} from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { getBillingProvider } from "@/lib/billing/provider";

const PLAN_ENV_PREFIX: Record<BillingCheckoutPlanId, string> = {
  scholar: "SCHOLAR",
  pro: "PRO",
  team: "TEAM",
};

const INTERVAL_ENV_KEY: Record<BillingInterval, string> = {
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

export function getCheckoutUrl(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): string | null {
  const provider = getBillingProvider();
  if (provider === "none") return null;

  const mapping = getBillingPlanMapping(provider, planId, interval);
  return mapping?.checkoutUrl ?? null;
}

export function getBillingPlanMapping(
  provider: BillingProvider,
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): BillingPlanMapping | null {
  if (provider === "none") return null;

  const providerPrefix = provider === "paddle" ? "PADDLE" : "LEMON";
  const envKey = `${providerPrefix}_${PLAN_ENV_PREFIX[planId]}_${INTERVAL_ENV_KEY[interval]}_CHECKOUT_URL`;
  const checkoutUrl = process.env[envKey]?.trim() || null;

  return {
    provider,
    planId,
    interval,
    checkoutUrl,
  };
}

export function isBillingCheckoutPlan(value: string): value is BillingCheckoutPlanId {
  return value === "scholar" || value === "pro" || value === "team";
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}
