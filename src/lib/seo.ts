import type { Metadata } from "next";
import type { BlogPost } from "@/data/blog-posts";
import { getAllIndexablePaths } from "@/lib/seo-paths";
import { siteConfig } from "@/lib/site";

/**
 * SERP titles for CMS posts that otherwise keep generic CMS titles.
 * Base title stays under 50 chars so `| Summify` keeps the tag ≤60.
 * Commercial "pdf summarizer" stays on /summarize-pdf; this blog owns the list query.
 */
const BLOG_SERP_OVERRIDES: Record<
  string,
  { title: string; description: string; heading?: string }
> = {
  "best-ai-pdf-summarizers-2026": {
    title: "Best AI PDF Summarizer Tools in 2026",
    description:
      "Compare the best AI PDF summarizer tools in 2026: accuracy, study cards, pricing, and privacy. See what to test on your files, then try Summify free.",
    // CMS title leaks into the H1 ("…What to Look For") and cannibalizes the
    // evaluation guide. Keep the listicle intent in H1 too.
    heading: "Best AI PDF Summarizer Tools in 2026",
  },
  "best-ai-tools-for-academic-research": {
    title: "Best AI Tool for Academic Research 2026",
    description:
      "Find the best AI tool for academic research: summarize papers, pull key findings, and build study notes. See how to choose, then try Summify free.",
  },
};

export function getBlogSerpCopy(post: {
  slug: string;
  title: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): { title: string; description: string } {
  const override = BLOG_SERP_OVERRIDES[post.slug];
  return {
    title: override?.title || post.seoTitle?.trim() || post.title,
    description: override?.description || post.seoDescription?.trim() || post.description,
  };
}

/** Visible H1 — overridden only where the CMS title targets another query. */
export function getBlogHeading(post: { slug: string; title: string }): string {
  return BLOG_SERP_OVERRIDES[post.slug]?.heading || post.title;
}

export const SEO_BRAND = "Summify";

/** Update when a public Twitter/X handle is confirmed. */
export const TWITTER_SITE = "@summifyapp";
export const TWITTER_CREATOR = "@summifyapp";

export const SEO_DEFAULT_POSITIONING =
  "AI summarizer for PDFs, PowerPoint, YouTube, and web articles — with flashcards, quizzes, and optional audio lessons so you can study what you summarize.";

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
  if (/^https?:\/\//i.test(path)) return path;
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
        alt: "Summify AI Summary and Learn social preview",
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
    title: { absolute: fullTitle },
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical,
      // One English document for all English markets. Do not invent en-GB URLs.
      languages: {
        "en-US": canonical,
        "x-default": canonical,
      },
    },
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

export function buildBlogPostMetadata(
  post: BlogPost & {
    seoTitle?: string | null;
    seoDescription?: string | null;
    canonicalUrl?: string | null;
  },
): Metadata {
  const path = `/blog/${post.slug}`;
  const serp = getBlogSerpCopy(post);
  const rawTitle = serp.title;
  const rawDescription = serp.description;
  // Keep SERP-safe lengths (Ahrefs: title ~≤60 with brand; description ≤155–160).
  const title = rawTitle.length > 55 ? `${rawTitle.slice(0, 52).trimEnd()}…` : rawTitle;
  const description =
    rawDescription.length > 155 ? `${rawDescription.slice(0, 152).trimEnd()}…` : rawDescription;
  return buildPageMetadata({
    title,
    description,
    path,
    ogType: "article",
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
    keywords: post.keywords?.length ? post.keywords : post.tags,
  });
}

/** @deprecated Prefer `getAllIndexablePaths()` from `@/lib/seo-paths` for sitemap. */
export function getIndexableMarketingPaths(): string[] {
  return getAllIndexablePaths();
}

/** @deprecated Use `getIndexableMarketingPaths()` for sitemap; kept for imports. */
export const MARKETING_PATHS = getIndexableMarketingPaths();
