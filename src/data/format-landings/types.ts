import type { ComponentType, ReactNode } from "react";
import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export type FormatLandingHero = {
  badge: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  mockVariant?: "default" | "learn";
};

export type FormatWorkflowStep = {
  title: string;
  description: string;
};

export type FormatFeature = {
  title: string;
  description: string;
};

export type FormatUseCase = {
  title: string;
  description: string;
};

export type FormatComparisonRow = {
  feature: string;
  summify: string | boolean;
  competitor: string | boolean;
};

export type FormatComparison = {
  title: string;
  subtitle?: string;
  competitorName: string;
  rows: FormatComparisonRow[];
};

export type SeoContentBlock = {
  heading?: string;
  body: ReactNode;
};

export type FormatLandingConfig = {
  path: string;
  breadcrumbLabel: string;
  iosCta?: {
    title: string;
    description: string;
    label?: string;
  };
  hero: FormatLandingHero;
  seoContent: {
    eyebrow: string;
    title: string;
    blocks: SeoContentBlock[];
  };
  workflow: {
    title: string;
    steps: FormatWorkflowStep[];
  };
  features: {
    title: string;
    items: FormatFeature[];
  };
  useCases: {
    title: string;
    subtitle?: string;
    cases: FormatUseCase[];
  };
  /** Optional side-by-side table; only use verified, defensible claims. */
  comparison?: FormatComparison;
  faqs: FaqItem[];
  relatedLinks: RelatedLinkItem[];
  cta: {
    title: string;
    description: string;
    primaryLabel?: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  };
  /** Optional custom hero aside; defaults to ProductMockCard */
  HeroAside?: ComponentType;
};
