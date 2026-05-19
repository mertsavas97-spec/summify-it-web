import type { BillingInterval, PlanId } from "@/types/plan";

export type BillingProvider = "none" | "paddle" | "lemon";

export type BillingCheckoutPlanId = Exclude<PlanId, "beta" | "free">;

export type BillingCheckoutRequest = {
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
};

export type BillingStatusCopy = {
  provider: BillingProvider;
  enabled: boolean;
  badge: string;
  headline: string;
  description: string;
  checkoutCta: string;
  accountNote: string;
};

export type BillingPlanMapping = {
  provider: Exclude<BillingProvider, "none">;
  planId: BillingCheckoutPlanId;
  interval: BillingInterval;
  checkoutUrl: string | null;
};
