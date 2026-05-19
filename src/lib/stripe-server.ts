import "server-only";
import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/types/plan";

export type CheckoutPlanId = Exclude<PlanId, "beta" | "free">;

export type StripePriceConfig = {
  plan: CheckoutPlanId;
  interval: BillingInterval;
  envKey: string;
  priceId: string;
};

const PRICE_ENV_MAP: Record<CheckoutPlanId, Record<BillingInterval, string>> = {
  scholar: {
    monthly: "STRIPE_SCHOLAR_MONTHLY_PRICE_ID",
    yearly: "STRIPE_SCHOLAR_YEARLY_PRICE_ID",
  },
  pro: {
    monthly: "STRIPE_PRO_MONTHLY_PRICE_ID",
    yearly: "STRIPE_PRO_YEARLY_PRICE_ID",
  },
  team: {
    monthly: "STRIPE_TEAM_MONTHLY_PRICE_ID",
    yearly: "STRIPE_TEAM_YEARLY_PRICE_ID",
  },
};

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getCheckoutPriceConfig(
  plan: string,
  interval: string,
): StripePriceConfig | null {
  if (!isCheckoutPlan(plan) || !isBillingInterval(interval)) return null;

  const envKey = PRICE_ENV_MAP[plan][interval];
  const priceId = process.env[envKey]?.trim();
  if (!priceId) return null;

  return {
    plan,
    interval,
    envKey,
    priceId,
  };
}

export function getPlanForStripePrice(priceId: string | null | undefined): {
  plan: CheckoutPlanId;
  interval: BillingInterval;
} | null {
  if (!priceId) return null;

  for (const plan of Object.keys(PRICE_ENV_MAP) as CheckoutPlanId[]) {
    for (const interval of Object.keys(PRICE_ENV_MAP[plan]) as BillingInterval[]) {
      if (process.env[PRICE_ENV_MAP[plan][interval]]?.trim() === priceId) {
        return { plan, interval };
      }
    }
  }

  return null;
}

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

function isCheckoutPlan(value: string): value is CheckoutPlanId {
  return value === "scholar" || value === "pro" || value === "team";
}

function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}
