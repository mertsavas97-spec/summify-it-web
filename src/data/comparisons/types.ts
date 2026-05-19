import type { ComponentType } from "react";
import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export type ComparisonTableRow = {
  feature: string;
  summify: string | boolean;
  competitor: string | boolean;
};

export type ComparisonPageConfig = {
  slug: string;
  competitorName: string;
  title: string;
  description: string;
  date: string;
  idealUsers: string[];
  summifyStrengths: string[];
  summifyLimitations: string[];
  competitorStrengths: string[];
  competitorLimitations: string[];
  tableRows: ComparisonTableRow[];
  faqs: FaqItem[];
  relatedLinks: RelatedLinkItem[];
  Content: ComponentType;
};
