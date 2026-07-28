import type { BillingCheckoutPlanId } from "@/types/billing";

export const SCHOLAR_COMING_SOON_MESSAGE = "Scholar access is coming soon.";

export const SCHOLAR_EDU_REQUIRED_MESSAGE =
  "Scholar requires a .edu school email. Sign in with your student address to checkout.";

export const TEAM_PRICING_NOTE =
  "Includes up to 5 seats. Team invite management is rolling out during beta.";

export const TEAM_ACCOUNT_PLACEHOLDER =
  "Team workspace and invites are coming soon.";

/** Paid plans that may call `/api/billing/checkout` today. */
export function isPlanCheckoutEnabled(planId: BillingCheckoutPlanId): boolean {
  return planId === "pro" || planId === "team" || planId === "scholar";
}

/** @deprecated Scholar checkout is open with .edu verification — always false. */
export function isScholarCheckoutComingSoon(_planId: string): boolean {
  return false;
}

export function getPricingPlanFootnote(planId: string): string | null {
  if (planId === "scholar") return SCHOLAR_EDU_REQUIRED_MESSAGE;
  if (planId === "team") return TEAM_PRICING_NOTE;
  return null;
}
