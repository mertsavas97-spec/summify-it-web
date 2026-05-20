import type { BillingCheckoutPlanId } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { isBillingCheckoutPlan, isBillingInterval } from "@/lib/billing/planMapping";

const STORAGE_KEY = "summify_checkout_intent";

export type CheckoutIntent = {
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
};

export function saveCheckoutIntent(intent: CheckoutIntent): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function consumeCheckoutIntent(): CheckoutIntent | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as CheckoutIntent;
    if (!isBillingCheckoutPlan(parsed.planId) || !isBillingInterval(parsed.interval)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
