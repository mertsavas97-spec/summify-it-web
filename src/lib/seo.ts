import type { Metadata } from "next";
import type { BlogPost } from "@/data/blog-posts";
import { getAllIndexablePaths } from "@/lib/seo-paths";
import { siteConfig } from "@/lib/site";

export const SEO_BRAND = "Summify";

/** Update when a public Twitter/X handle is confirmed. */
export const TWITTER_SITE = "@summifyapp";
export const TWITTER_CREATOR = "@summifyapp";

export const SEO_DEFAULT_POSITIONING =
  "AI document intelligence for PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT.";

/** Open Graph / Twitter card image dimensions (public/og-default.png). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type SeoPageInput = {
  /** Page title without brand suffix (brand appended as `| Summify`). */
  title: string;
  description: string;
  /** Path starting with `/`, e.g. `/summarize-pdf`. */
  path: string;
  keywords?: string[];
  /** When true, page is excluded from indexing. */
  noindex?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPageTitle(title: string, options?: { includeBrand?: boolean }): string {
  const includeBrand = options?.includeBrand !== false;
  if (!includeBrand || title.includes(SEO_BRAND)) return title;
  return `${title} | ${SEO_BRAND}`;
}

export function buildCanonicalUrl(path: string): string {
  return absoluteUrl(path);
}

export type OpenGraphInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildOpenGraph(input: OpenGraphInput): Metadata["openGraph"] {
  const ogTitle = input.title.includes(SEO_BRAND)
    ? input.title
    : `${input.title} | ${SEO_BRAND}`;

  const ogType = input.type ?? "website";
  const articleTimes =
    ogType === "article" && input.publishedTime
      ? {
          publishedTime: input.publishedTime,
          ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
          authors: [SEO_BRAND],
        }
      : {};

  return {
    type: ogType,
    locale: "en_US",
    url: absoluteUrl(input.path),
    siteName: SEO_BRAND,
    title: ogTitle,
    description: input.description,
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: `${SEO_BRAND} — AI Document Intelligence Workspace`,
      },
    ],
    ...articleTimes,
  };
}

export function buildTwitterCard(input: {
  title: string;
  description: string;
}): Metadata["twitter"] {
  const twitterTitle = input.title.includes(SEO_BRAND)
    ? input.title
    : `${input.title} | ${SEO_BRAND}`;

  return {
    card: "summary_large_image",
    site: TWITTER_SITE,
    creator: TWITTER_CREATOR,
    title: twitterTitle,
    description: input.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  };
}

export function buildPageMetadata(input: SeoPageInput): Metadata {
  const fullTitle = buildPageTitle(input.title);
  const canonical = buildCanonicalUrl(input.path);

  return {
    title: fullTitle,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical },
    robots: input.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: buildOpenGraph({
      title: input.title,
      description: input.description,
      path: input.path,
      type: input.ogType,
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    }),
    twitter: buildTwitterCard({
      title: input.title,
      description: input.description,
    }),
  };
}

export function buildBlogPostMetadata(post: BlogPost): Metadata {
  const path = `/blog/${post.slug}`;
  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path,
    ogType: "article",
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
    keywords: post.tags,
  });
}

/** @deprecated Prefer `getAllIndexablePaths()` from `@/lib/seo-paths` for sitemap. */
export function getIndexableMarketingPaths(): string[] {
  return getAllIndexablePaths();
}

/** @deprecated Use `getIndexableMarketingPaths()` for sitemap; kept for imports. */
export const MARKETING_PATHS = getIndexableMarketingPaths();
