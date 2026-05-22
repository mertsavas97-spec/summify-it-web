import type { BlogCategoryId } from "@/data/blog-categories";
import type { BlogFaqItem } from "@/data/blog-post-types";

export type CmsBlogStatus = "draft" | "published" | "archived";

export type CmsBlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  categoryId: BlogCategoryId;
  tags: string[];
  coverImageUrl: string | null;
  markdownBody: string;
  authorName: string;
  authorRole: string;
  authorBio: string | null;
  authorHref: string | null;
  status: CmsBlogStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  primaryKeyword: string | null;
  faqs: BlogFaqItem[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBlogPostRecord = CmsBlogPostRecord & {
  source: "cms" | "static";
  seoScore?: number;
};

export type CmsBlogPostInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  categoryId: BlogCategoryId;
  tags?: string[];
  coverImageUrl?: string | null;
  markdownBody: string;
  authorName?: string;
  authorRole?: string;
  authorBio?: string | null;
  authorHref?: string | null;
  status: CmsBlogStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
  primaryKeyword?: string | null;
  faqs?: BlogFaqItem[];
  publishedAt?: string | null;
};

export type CmsBlogListFilters = {
  search?: string;
  categoryId?: BlogCategoryId;
  status?: CmsBlogStatus | "all";
  sort?: "updated_desc" | "updated_asc" | "title_asc";
};
