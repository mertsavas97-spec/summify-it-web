import { getPlanDefinition } from "@/data/pricingPlans";
import { isScholarCheckoutComingSoon } from "@/lib/billing/plan-availability";
import type { PlanId } from "@/types/plan";

export function formatPlanBadgeLabel(planId: PlanId): string {
  switch (planId) {
    case "scholar":
      return "SCHOLAR";
    case "team":
      return "TEAM";
    case "pro":
      return "PRO";
    default:
      return "PRO";
  }
}

export type UpgradeModalContent = {
  badge: string;
  title: string;
  description: string;
  planName: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  footnote?: string;
};

export function getUpgradePricingHref(planId: PlanId): string {
  return `/pricing?plan=${planId}`;
}

export function getUpgradeModalContent(input: {
  requiredPlanId: PlanId;
  isAuthenticated: boolean;
  isComingSoon: boolean;
  modeLabel: string;
}): UpgradeModalContent {
  const { requiredPlanId, isAuthenticated, isComingSoon, modeLabel } = input;
  const plan = getPlanDefinition(requiredPlanId);

  if (isComingSoon) {
    return {
      badge: "Coming soon",
      title: modeLabel,
      description:
        "This intelligence mode is not available for analysis yet. Choose an unlocked mode from the catalog.",
      planName: plan.name,
      primaryCta: "Browse modes",
      primaryHref: "/modes",
      secondaryCta: "View plans",
      secondaryHref: "/pricing",
    };
  }

  const pricingHref = getUpgradePricingHref(requiredPlanId);
  const scholarSoon = isScholarCheckoutComingSoon(requiredPlanId);

  let primaryCta: string;
  if (!isAuthenticated) {
    primaryCta = "Sign in to upgrade";
  } else if (requiredPlanId === "pro") {
    primaryCta = "Upgrade to Pro";
  } else if (requiredPlanId === "team") {
    primaryCta = "Upgrade to Team";
  } else if (scholarSoon) {
    primaryCta = "View Scholar plan";
  } else {
    primaryCta = "Upgrade to Scholar";
  }

  const primaryHref = !isAuthenticated
    ? `/login?next=${encodeURIComponent(pricingHref)}`
    : pricingHref;

  return {
    badge: formatPlanBadgeLabel(requiredPlanId),
    title: modeLabel,
    description: "Upgrade to unlock this intelligence mode.",
    planName: plan.name,
    primaryCta,
    primaryHref,
    secondaryCta: isAuthenticated ? "View all plans" : "View plans",
    secondaryHref: "/pricing",
    footnote: scholarSoon
      ? "Scholar checkout is not open yet — preview the plan and start Pro checkout today."
      : undefined,
  };
}

export type WorkspaceBannerContent = {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  primaryCta: string;
  primaryHref: string | null;
  primaryAction: "link" | "portal";
  showLock: boolean;
};

export function getWorkspaceEntitlementBannerContent(input: {
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive: boolean;
  billingEnabled: boolean;
}): WorkspaceBannerContent {
  const { entitlementPlanId, isAuthenticated, isPaidActive, billingEnabled } = input;

  if (isPaidActive && entitlementPlanId === "team") {
    return {
      eyebrow: "Team",
      title: "Team active",
      description:
        "Your workspace includes Team access, Pro intelligence modes, and collaboration features as they roll out.",
      features: [
        "All Pro intelligence modes",
        "Up to 5 seats included",
        "Shared library & API (rolling out)",
      ],
      primaryCta: billingEnabled ? "Manage billing" : "View account",
      primaryHref: billingEnabled ? null : "/account",
      primaryAction: billingEnabled ? "portal" : "link",
      showLock: false,
    };
  }

  if (isPaidActive && entitlementPlanId === "scholar") {
    return {
      eyebrow: "Scholar",
      title: "Scholar active",
      description:
        "Your workspace includes Scholar intelligence modes and study-focused limits.",
      features: [
        "15 intelligence modes",
        "12 Learn cards per run",
        "Full analysis history",
      ],
      primaryCta: billingEnabled ? "Manage billing" : "View account",
      primaryHref: billingEnabled ? null : "/account",
      primaryAction: billingEnabled ? "portal" : "link",
      showLock: false,
    };
  }

  if (isPaidActive && entitlementPlanId === "pro") {
    return {
      eyebrow: "Pro",
      title: "Pro active",
      description:
        "Your workspace includes Pro intelligence modes, larger uploads, and paid-plan limits.",
      features: [
        "28+ intelligence modes",
        "50MB uploads & fair-use analyses",
        "Export & mind map in workspace",
      ],
      primaryCta: billingEnabled ? "Manage billing" : "View account",
      primaryHref: billingEnabled ? null : "/account",
      primaryAction: billingEnabled ? "portal" : "link",
      showLock: false,
    };
  }

  if (!isAuthenticated) {
    return {
      eyebrow: "Pro",
      title: "Unlock Pro intelligence",
      description:
        "Sign in to save analyses, unlock paid modes, and manage your workspace.",
      features: [
        "All Pro intelligence modes",
        "Larger uploads & saved history",
        "Export & advanced workspace tools",
      ],
      primaryCta: "View plans",
      primaryHref: "/pricing",
      primaryAction: "link",
      showLock: true,
    };
  }

  return {
    eyebrow: "Pro",
    title: "Unlock Pro intelligence",
    description:
      "Upgrade for all Pro intelligence modes, larger uploads, export, and advanced workspace features.",
    features: [
      "28+ intelligence modes",
      "50MB uploads",
      "Export, mind map & spaced repetition",
    ],
    primaryCta: "View plans",
    primaryHref: "/pricing",
    primaryAction: "link",
    showLock: true,
  };
}
