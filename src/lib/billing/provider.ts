import type { BillingProvider, BillingStatusCopy } from "@/types/billing";

const BILLING_PROVIDERS = ["none", "paddle", "lemon"] as const;

export function getBillingProvider(): BillingProvider {
  const raw = process.env.BILLING_PROVIDER?.trim().toLowerCase();
  if (raw && (BILLING_PROVIDERS as readonly string[]).includes(raw)) {
    return raw as BillingProvider;
  }
  return "none";
}

export function isBillingEnabled(): boolean {
  return getBillingProvider() !== "none";
}

export function getBillingStatusCopy(): BillingStatusCopy {
  const provider = getBillingProvider();

  if (provider === "paddle") {
    return {
      provider,
      enabled: true,
      badge: "Paddle checkout",
      headline: "Billing provider selected",
      description: "Checkout will route through the provider-neutral billing endpoint.",
      checkoutCta: "Continue to checkout",
      accountNote: "Billing is configured through Paddle. Subscription management will appear here after checkout is fully approved.",
    };
  }

  if (provider === "lemon") {
    return {
      provider,
      enabled: true,
      badge: "Lemon Squeezy checkout",
      headline: "Billing provider selected",
      description: "Checkout will route through the provider-neutral billing endpoint.",
      checkoutCta: "Continue to checkout",
      accountNote: "Billing is configured through Lemon Squeezy. Subscription management will appear here after checkout is fully approved.",
    };
  }

  return {
    provider: "none",
    enabled: false,
    badge: "Billing pending",
    headline: "Join beta",
    description: "Paid checkout is paused while billing provider review is pending.",
    checkoutCta: "Join beta",
    accountNote: "Billing is not enabled yet. Your current workspace access remains unchanged while provider review is pending.",
  };
}
