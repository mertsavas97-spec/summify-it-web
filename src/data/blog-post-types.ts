import type { ComponentType } from "react";
import type { BlogCategoryId } from "@/data/blog-categories";
import type { BlogContentCluster } from "@/data/blog-clusters";

export type BlogTocItem = {
  id: string;
  label: string;
};

export type BlogFaqItem = {
  q: string;
  a: string;
};

export type BlogRelatedLink = {
  href: string;
  label: string;
  description?: string;
};

export type BlogAuthorInfo = {
  name: string;
  role: string;
  bio: string;
  href?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt: string;
  categoryId: BlogCategoryId;
  category: string;
  tags: string[];
  keywords: string[];
  clusters: BlogContentCluster[];
  readingTime: string;
  featured?: boolean;
  trending?: boolean;
  author: BlogAuthorInfo;
  faqs: BlogFaqItem[];
  relatedLinks: BlogRelatedLink[];
  keyTakeaways?: string[];
  toc: BlogTocItem[];
  workflowCluster?: BlogContentCluster;
  Content: ComponentType;
};
