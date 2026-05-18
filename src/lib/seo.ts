import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const SEO_BRAND = "Summify.it";

export const SEO_DEFAULT_POSITIONING =
  "AI document intelligence workspace for PDFs, YouTube videos, PowerPoint decks, web articles, and study materials.";

export type SeoPageInput = {
  /** Page title without brand suffix (brand appended automatically). */
  title: string;
  description: string;
  /** Path starting with `/`, e.g. `/summarize-pdf`. */
  path: string;
  keywords?: string[];
  /** When true, page is excluded from indexing. */
  noindex?: boolean;
  ogType?: "website" | "article";
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
};

export function buildOpenGraph(input: OpenGraphInput): Metadata["openGraph"] {
  return {
    type: input.type ?? "website",
    locale: "en_US",
    url: absoluteUrl(input.path),
    siteName: SEO_BRAND,
    title: input.title,
    description: input.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 512,
        height: 512,
        alt: `${SEO_BRAND} — ${SEO_DEFAULT_POSITIONING}`,
      },
    ],
  };
}

export function buildTwitterCard(input: {
  title: string;
  description: string;
}): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title: input.title,
    description: input.description,
    images: [siteConfig.ogImage],
  };
}

export function buildPageMetadata(input: SeoPageInput): Metadata {
  const fullTitle = buildPageTitle(input.title);
  const canonical = buildCanonicalUrl(input.path);
  const ogTitle = input.title.includes(SEO_BRAND) ? input.title : `${input.title} — ${SEO_BRAND}`;

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
      title: ogTitle,
      description: input.description,
      path: input.path,
      type: input.ogType,
    }),
    twitter: buildTwitterCard({
      title: ogTitle,
      description: input.description,
    }),
  };
}

/** All indexable marketing routes for sitemap generation. */
export const MARKETING_PATHS = [
  "/",
  "/upload",
  "/pricing",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/summarize-pdf",
  "/summarize-youtube-video",
  "/summarize-powerpoint",
  "/for-students",
  "/for-creators",
  "/modes",
  "/modes/executive-brief",
  "/modes/the-student",
  "/modes/the-creator",
  "/modes/contract-analyzer",
] as const;
