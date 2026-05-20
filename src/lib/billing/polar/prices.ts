import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";

const PLAN_ENV_PREFIX: Record<BillingCheckoutPlanId, string> = {
  scholar: "SCHOLAR",
  pro: "PRO",
  team: "TEAM",
};

const INTERVAL_ENV_KEY: Record<BillingInterval, string> = {
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

export function polarEnvKey(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
  suffix: "PRICE_ID" | "PRODUCT_ID",
): string {
  return `POLAR_${PLAN_ENV_PREFIX[planId]}_${INTERVAL_ENV_KEY[interval]}_${suffix}`;
}

/** Server-only: resolve Polar catalog price ID from env (never accept from client). */
export function getPolarPriceId(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): string | null {
  return process.env[polarEnvKey(planId, interval, "PRICE_ID")]?.trim() || null;
}

/** Server-only: optional Polar product ID for checkout (preferred for current Checkout API). */
export function getPolarProductId(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): string | null {
  return process.env[polarEnvKey(planId, interval, "PRODUCT_ID")]?.trim() || null;
}

export function isPolarPlanConfigured(
  planId: BillingCheckoutPlanId,
  interval: BillingInterval,
): boolean {
  return Boolean(getPolarProductId(planId, interval) || getPolarPriceId(planId, interval));
}

export function buildPolarPriceIdMap(): Map<string, { planId: BillingCheckoutPlanId; interval: BillingInterval }> {
  const map = new Map<string, { planId: BillingCheckoutPlanId; interval: BillingInterval }>();
  const plans: BillingCheckoutPlanId[] = ["scholar", "pro", "team"];
  const intervals: BillingInterval[] = ["monthly", "yearly"];

  for (const planId of plans) {
    for (const interval of intervals) {
      const priceId = getPolarPriceId(planId, interval);
      if (priceId) map.set(priceId, { planId, interval });
    }
  }

  return map;
}

let cachedPriceMap: Map<string, { planId: BillingCheckoutPlanId; interval: BillingInterval }> | null =
  null;

export function resolvePlanFromPolarPriceId(priceId: string | null | undefined): {
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
} | null {
  if (!priceId) return null;
  if (!cachedPriceMap) cachedPriceMap = buildPolarPriceIdMap();
  return cachedPriceMap.get(priceId) ?? null;
}
