import type { BillingCheckoutPlanId, BillingProvider, BillingStatusCopy } from "@/types/billing";
import { isPolarConfigured } from "@/lib/billing/polar/config";

const BILLING_PROVIDERS = ["none", "paddle", "lemon", "polar"] as const;

export function getBillingProvider(): BillingProvider {
  const raw = process.env.BILLING_PROVIDER?.trim().toLowerCase();
  if (raw && (BILLING_PROVIDERS as readonly string[]).includes(raw)) {
    return raw as BillingProvider;
  }
  return "none";
}

export function isBillingEnabled(): boolean {
  const provider = getBillingProvider();
  if (provider === "none") return false;
  if (provider === "polar") return isPolarConfigured();
  return true;
}

export function getBillingStatusCopy(): BillingStatusCopy {
  const provider = getBillingProvider();

  if (provider === "polar") {
    const configured = isPolarConfigured();
    return {
      provider,
      enabled: configured,
      badge: configured ? "Polar checkout" : "Polar setup required",
      headline: configured ? "Upgrade your workspace" : "Billing configuration needed",
      description: configured
        ? "Secure checkout powered by Polar. Subscriptions sync to your account automatically."
        : "Set POLAR_ACCESS_TOKEN and price IDs to enable checkout.",
      checkoutCta: configured ? "Subscribe" : "Billing unavailable",
      accountNote: configured
        ? "Manage your subscription, invoices, and renewal date through Polar."
        : "Polar billing is selected but not fully configured on this deployment.",
    };
  }

  if (provider === "paddle") {
    return {
      provider,
      enabled: true,
      badge: "Paddle checkout",
      headline: "Billing provider selected",
      description: "Checkout will route through the provider-neutral billing endpoint.",
      checkoutCta: "Continue to checkout",
      accountNote:
        "Billing is configured through Paddle. Subscription management will appear here after checkout is fully approved.",
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
      accountNote:
        "Billing is configured through Lemon Squeezy. Subscription management will appear here after checkout is fully approved.",
    };
  }

  return {
    provider: "none",
    enabled: false,
    badge: "Billing pending",
    headline: "Join beta",
    description: "Paid checkout is paused while billing provider review is pending.",
    checkoutCta: "Join beta",
    accountNote:
      "Billing is not enabled yet. Your current workspace access remains unchanged while provider review is pending.",
  };
}

/** CTA label for a paid plan card (pricing page). */
export function getPlanCheckoutLabel(
  planId: BillingCheckoutPlanId,
  billing: Pick<BillingStatusCopy, "provider" | "enabled">,
): string {
  if (billing.provider === "none" || !billing.enabled) {
    if (billing.provider === "polar" && !billing.enabled) {
      return "Billing unavailable";
    }
    return "Join beta";
  }

  if (billing.provider === "polar") {
    const labels: Record<BillingCheckoutPlanId, string> = {
      scholar: "Start Scholar",
      pro: "Start Pro",
      team: "Start Team",
    };
    return labels[planId];
  }

  return "Continue to checkout";
}
