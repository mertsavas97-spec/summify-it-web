export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref?: string;
  /** When true, no checkout — CTA is informational only. */
  comingSoon?: boolean;
  highlighted?: boolean;
  badge?: string;
  savings?: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free (beta)",
    price: "$0",
    period: "during public beta",
    description: "Full workspace access while we validate the product — no card required.",
    features: [
      "Four active intelligence modes",
      "PDF, PPTX, YouTube, web, and text",
      "Structured analysis and Learn cards",
      "Copy results from the workspace",
    ],
    cta: "Open workspace",
    ctaHref: "/upload",
  },
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    price: "$19",
    period: "/month (planned)",
    description: "Planned tier for professionals who summarize documents every week.",
    features: [
      "All intelligence modes",
      "Long-document pipelines",
      "Export presets",
      "Workspace history",
    ],
    cta: "Pro Intelligence — coming soon",
    comingSoon: true,
  },
  {
    id: "pro-annual",
    name: "Pro Annual",
    price: "$190",
    period: "/year (planned)",
    description: "Planned annual tier for power users and teams.",
    features: [
      "Everything in Pro Monthly",
      "Priority processing queue",
      "Advanced analysis modes",
      "Batch upload (roadmap)",
      "Team seats (roadmap)",
    ],
    cta: "Pro Intelligence — coming soon",
    comingSoon: true,
    highlighted: true,
    badge: "Planned",
    savings: "2 months free (at launch)",
  },
];

export const pricingTeaserPlans = pricingPlans.map(
  ({ id, name, price, period, description, highlighted, badge, savings }) => ({
    id,
    name,
    price,
    period,
    description,
    highlighted,
    badge,
    savings,
  }),
);
