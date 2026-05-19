import type { ComponentType } from "react";
import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export type GuideTocItem = {
  id: string;
  label: string;
};

export type GuideArticle = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  readingTime: string;
  category: string;
  tags: string[];
  keyTakeaways: string[];
  toc: GuideTocItem[];
  faqs: FaqItem[];
  relatedLinks: RelatedLinkItem[];
  Content: ComponentType;
};
