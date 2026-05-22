import { getBlogCategory, type BlogCategoryId } from "@/data/blog-categories";
import type { BlogFaqItem, BlogPost, BlogTocItem } from "@/data/blog-post-types";
import type { CmsBlogPostRecord } from "@/types/cms-blog";
import { analyzeBlogContent } from "@/lib/blog/contentMetrics";
import { sanitizeCmsBlogHtml } from "@/lib/blog/cmsBody";

export type PublicBlogPost = BlogPost & {
  source: "cms" | "static";
  markdownBody?: string;
  bodyFormat?: CmsBlogPostRecord["bodyFormat"];
  coverImageUrl?: string | null;
  primaryKeyword?: string | null;
  canonicalUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
};

function extractTocFromMarkdown(markdown: string): BlogTocItem[] {
  const items: BlogTocItem[] = [];
  for (const line of markdown.split("\n")) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const label = h2[1].trim();
      const id = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (id) items.push({ id, label });
    }
  }
  return items;
}

function extractTocFromHtml(html: string): BlogTocItem[] {
  const items: BlogTocItem[] = [];
  for (const match of sanitizeCmsBlogHtml(html).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)) {
    const label = match[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (id) items.push({ id, label });
  }
  return items;
}

export function cmsRecordToPublicPost(record: CmsBlogPostRecord): PublicBlogPost {
  const metrics = analyzeBlogContent(record.markdownBody, record.bodyFormat);
  const date = record.publishedAt ?? record.createdAt;
  const description =
    record.seoDescription?.trim() ||
    record.excerpt?.trim() ||
    record.title;

  return {
    source: "cms",
    slug: record.slug,
    title: record.title,
    description,
    date: date.slice(0, 10),
    updatedAt: record.updatedAt.slice(0, 10),
    categoryId: record.categoryId as BlogCategoryId,
    category: getBlogCategory(record.categoryId).name,
    tags: record.tags,
    keywords: record.primaryKeyword
      ? [record.primaryKeyword, ...record.tags]
      : record.tags,
    clusters: [],
    readingTime: metrics.readingTimeLabel,
    featured: false,
    trending: false,
    author: {
      name: record.authorName,
      role: record.authorRole,
      bio: record.authorBio ?? "",
      href: record.authorHref ?? "/about",
    },
    faqs: record.faqs as BlogFaqItem[],
    relatedLinks: [],
    toc:
      record.bodyFormat === "html"
        ? extractTocFromHtml(record.markdownBody)
        : extractTocFromMarkdown(record.markdownBody),
    Content: () => null,
    markdownBody: record.markdownBody,
    bodyFormat: record.bodyFormat,
    coverImageUrl: record.coverImageUrl,
    primaryKeyword: record.primaryKeyword,
    canonicalUrl: record.canonicalUrl,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    ogTitle: record.ogTitle,
    ogDescription: record.ogDescription,
  };
}

export function staticToPublicPost(post: BlogPost): PublicBlogPost {
  return { ...post, source: "static" };
}
