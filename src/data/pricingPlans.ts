import type { BillingInterval, PlanId } from "@/types/plan";

/** Numeric limits — `null` means unlimited / fair-use (not hard-capped). */
export type PlanLimitsConfig = {
  analysesPerDay: number | null;
  maxFileSizeMb: number;
  intelligenceModesIncluded: number | "all";
  maxLearnCards: number;
  maxSavedAnalyses: number | null;
  exportEnabled: boolean;
  mindMapEnabled: boolean;
  spacedRepetitionEnabled: boolean;
  emailRemindersEnabled: boolean;
  teamSeatsIncluded: number;
  sharedLibrary: boolean;
  apiAccess: boolean;
  customModes: boolean;
  invoices: boolean;
};

export type PlanBillingOption = {
  amountCents: number;
  displayPrice: string;
  displayPeriod: string;
  /** Future provider price/variant ID — not wired yet. */
  providerPriceId: string | null;
  savingsLabel?: string;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  description: string;
  limits: PlanLimitsConfig;
  featureBullets: string[];
  /** When true, limits are informational only — no hard enforcement (beta). */
  enforceLimits: boolean;
  highlighted?: boolean;
  recommended?: boolean;
  comingSoon?: boolean;
  badge?: string;
  cta: string;
  ctaHref?: string;
  billing: Partial<Record<BillingInterval, PlanBillingOption>> | null;
  /** Future provider Checkout URL — not wired yet. */
  checkoutUrl: string | null;
  /** Future provider customer portal URL — not wired yet. */
  billingPortalUrl: string | null;
};

const FORMATS_ALL = "PDF, TXT, DOCX, YouTube, Web, PowerPoint";
const FORMATS_STANDARD = "PDF, DOCX, PPTX, TXT, YouTube, Web";

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  beta: {
    id: "beta",
    name: "Public Beta",
    tagline: "Full workspace access while we ship paid tiers",
    description:
      "Early access for invited testers with generous limits while paid tiers are prepared.",
    enforceLimits: false,
    limits: {
      analysesPerDay: null,
      maxFileSizeMb: 50,
      intelligenceModesIncluded: "all",
      maxLearnCards: 15,
      maxSavedAnalyses: null,
      exportEnabled: true,
      mindMapEnabled: true,
      spacedRepetitionEnabled: true,
      emailRemindersEnabled: true,
      teamSeatsIncluded: 1,
      sharedLibrary: false,
      apiAccess: false,
      customModes: false,
      invoices: false,
    },
    featureBullets: [
      "Unlimited analyses during beta",
      "All active intelligence modes in preview",
      "Saved analyses & dashboard",
      "No credit card required",
    ],
    badge: "Current",
    cta: "Open workspace",
    ctaHref: "/upload",
    billing: null,
    checkoutUrl: null,
    billingPortalUrl: null,
  },
  free: {
    id: "free",
    name: "Free",
    tagline: "Start summarizing instantly",
    description: "Core intelligence for occasional documents and study sessions.",
    enforceLimits: true,
    limits: {
      analysesPerDay: 3,
      maxFileSizeMb: 20,
      intelligenceModesIncluded: 5,
      maxLearnCards: 5,
      maxSavedAnalyses: 3,
      exportEnabled: false,
      mindMapEnabled: false,
      spacedRepetitionEnabled: false,
      emailRemindersEnabled: false,
      teamSeatsIncluded: 1,
      sharedLibrary: false,
      apiAccess: false,
      customModes: false,
      invoices: false,
    },
    featureBullets: [
      "3 analyses per day",
      "3 audio lessons per day",
      "1 podcast per day",
      "Max 20MB uploads",
      "Up to 50 pages",
      "Up to 80k extracted characters",
      "Standard analysis",
      FORMATS_STANDARD,
      "5 intelligence modes",
      "5 Learn cards per run",
      "Last 3 analyses saved",
      "Audio Study Mode locked (Pro)",
    ],
    cta: "Open workspace",
    ctaHref: "/upload",
    billing: {
      monthly: {
        amountCents: 0,
        displayPrice: "$0",
        displayPeriod: "/month",
        providerPriceId: null,
      },
    },
    checkoutUrl: null,
    billingPortalUrl: null,
  },
  scholar: {
    id: "scholar",
    name: "Scholar",
    tagline: "Built for students and exam prep",
    description:
      "More daily analyses, deeper modes, and full analysis history. Checkout opens when student access launches.",
    enforceLimits: true,
    comingSoon: true,
    badge: "Coming soon",
    limits: {
      analysesPerDay: 10,
      maxFileSizeMb: 20,
      intelligenceModesIncluded: 15,
      maxLearnCards: 12,
      maxSavedAnalyses: null,
      exportEnabled: false,
      mindMapEnabled: false,
      spacedRepetitionEnabled: false,
      emailRemindersEnabled: false,
      teamSeatsIncluded: 1,
      sharedLibrary: false,
      apiAccess: false,
      customModes: false,
      invoices: false,
    },
    featureBullets: [
      "10 analyses per day",
      "10 audio lessons per day",
      "5 podcasts per day",
      "Max 20MB uploads",
      "Up to 150 pages",
      "Same limits as Pro",
      "Research-focused workflows",
      FORMATS_STANDARD,
      "15 intelligence modes",
      "12 Learn cards per run",
      "Full analysis history",
      "Longer audio lessons",
      "Student verification (coming soon)",
    ],
    cta: "Coming soon",
    billing: {
      monthly: {
        amountCents: 499,
        displayPrice: "$4.99",
        displayPeriod: "/month",
        providerPriceId: null,
      },
      yearly: {
        amountCents: 3999,
        displayPrice: "$39.99",
        displayPeriod: "/year",
        providerPriceId: null,
        savingsLabel: "Save ~33% vs monthly",
      },
    },
    checkoutUrl: null,
    billingPortalUrl: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Professional document intelligence",
    description:
      "Generous fair-use access, every intelligence mode, and power-user workflows.",
    enforceLimits: true,
    recommended: true,
    highlighted: true,
    limits: {
      analysesPerDay: null,
      maxFileSizeMb: 20,
      intelligenceModesIncluded: "all",
      maxLearnCards: 15,
      maxSavedAnalyses: null,
      exportEnabled: true,
      mindMapEnabled: true,
      spacedRepetitionEnabled: true,
      emailRemindersEnabled: true,
      teamSeatsIncluded: 1,
      sharedLibrary: false,
      apiAccess: false,
      customModes: false,
      invoices: false,
    },
    featureBullets: [
      "Generous fair-use daily analyses",
      "Max 20MB uploads",
      "Up to 150 pages",
      "Long-form chunked analysis",
      "Advanced learning workflows",
      FORMATS_ALL,
      "All 29 intelligence modes",
      "15 Learn cards per run",
      "Export, mind map & spaced repetition",
      "Audio Study Mode",
      "Teacher-style audio lessons",
      "Unlimited audio lessons",
      "Unlimited podcasts",
      "Email reminders (roadmap)",
    ],
    badge: "Recommended",
    cta: "Start Pro",
    billing: {
      monthly: {
        amountCents: 799,
        displayPrice: "$7.99",
        displayPeriod: "/month",
        providerPriceId: null,
      },
      yearly: {
        amountCents: 5999,
        displayPrice: "$59.99",
        displayPeriod: "/year",
        providerPriceId: null,
        savingsLabel: "Save ~37% vs monthly",
      },
    },
    checkoutUrl: null,
    billingPortalUrl: null,
  },
  team: {
    id: "team",
    name: "Team",
    tagline: "Shared intelligence for groups",
    description:
      "Up to 5 seats with Pro-level intelligence. Billing is live; team invites and workspace tools roll out during beta.",
    enforceLimits: true,
    comingSoon: false,
    limits: {
      analysesPerDay: null,
      maxFileSizeMb: 20,
      intelligenceModesIncluded: "all",
      maxLearnCards: 15,
      maxSavedAnalyses: null,
      exportEnabled: true,
      mindMapEnabled: true,
      spacedRepetitionEnabled: true,
      emailRemindersEnabled: true,
      teamSeatsIncluded: 5,
      sharedLibrary: true,
      apiAccess: true,
      customModes: true,
      invoices: true,
    },
    featureBullets: [
      "Up to 5 seats included",
      "Up to 200 pages",
      "Advanced long-form intelligence",
      "Team workflows",
      "Everything in Pro",
      "Unlimited audio lessons",
      "Unlimited podcasts",
      "Longer audio lessons (6–10 min)",
      "Shared team library (rolling out)",
      "API access (rolling out)",
      "Custom intelligence modes (rolling out)",
      "Invoices via Polar",
    ],
    badge: "Team",
    cta: "Start Team",
    billing: {
      monthly: {
        amountCents: 2499,
        displayPrice: "$24.99",
        displayPeriod: "/month",
        providerPriceId: null,
      },
      yearly: {
        amountCents: 19999,
        displayPrice: "$199.99",
        displayPeriod: "/year",
        providerPriceId: null,
        savingsLabel: "Save ~33% vs monthly",
      },
    },
    checkoutUrl: null,
    billingPortalUrl: null,
  },
};

/** Plans shown on the public pricing page (excludes internal beta). */
export const PUBLIC_PRICING_PLAN_IDS: PlanId[] = ["free", "scholar", "pro", "team"];

export function getPlanDefinition(planId: string): PlanDefinition {
  if (planId in PLAN_DEFINITIONS) {
    return PLAN_DEFINITIONS[planId as PlanId];
  }
  return PLAN_DEFINITIONS.beta;
}

export function getPlanDisplayName(planId: string): string {
  return getPlanDefinition(planId).name;
}

/** @deprecated Use `PUBLIC_PRICING_PLAN_IDS` + `getPlanDefinition`. */
export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref?: string;
  comingSoon?: boolean;
  highlighted?: boolean;
  badge?: string;
  savings?: string;
};

export function getPricingPlansForInterval(
  interval: BillingInterval,
): Array<PlanDefinition & { displayPrice: string; displayPeriod: string; savings?: string }> {
  return PUBLIC_PRICING_PLAN_IDS.map((id) => {
    const plan = PLAN_DEFINITIONS[id];
    const option = plan.billing?.[interval] ?? plan.billing?.monthly;
    return {
      ...plan,
      displayPrice: option?.displayPrice ?? "$0",
      displayPeriod: option?.displayPeriod ?? "",
      savings: option?.savingsLabel,
    };
  });
}

export const pricingTeaserPlans = PUBLIC_PRICING_PLAN_IDS.map((id) => {
  const plan = PLAN_DEFINITIONS[id];
  const monthly = plan.billing?.monthly;
  return {
    id: plan.id,
    name: plan.name,
    price: monthly?.displayPrice ?? "$0",
    period: monthly?.displayPeriod,
    description: plan.tagline,
    highlighted: plan.highlighted,
    badge: plan.badge,
    savings: plan.billing?.yearly?.savingsLabel,
  };
});
