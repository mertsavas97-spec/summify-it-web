import type { ReactNode } from "react";
import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export type UseCaseLandingConfig = {
  slug: string;
  path: string;
  badge: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  seoBlocks: { heading?: string; body: ReactNode }[];
  workflow: { title: string; steps: { title: string; description: string }[] };
  features: { title: string; description: string }[];
  formats: { title: string; description: string; href: string }[];
  faqs: FaqItem[];
  relatedLinks: RelatedLinkItem[];
  cta: { title: string; description: string; primaryLabel?: string };
};
