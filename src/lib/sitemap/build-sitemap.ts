import type { MetadataRoute } from "next";
import { ACTIVE_INTELLIGENCE_MODE_IDS } from "@/config/modes";
import { BLOG_POSTS } from "@/data/blog-posts";
import { getAllBlogCategorySlugs } from "@/data/blog-categories";
import { COMPARISON_SLUGS } from "@/data/comparisons/registry";
import { FORMAT_LANDINGS } from "@/data/format-landings";
import { GUIDE_SLUGS } from "@/data/guides/registry";
import { USE_CASE_SLUGS } from "@/data/use-cases/registry";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

type SitemapEntryInput = {
  path: string;
  lastModified?: Date | string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

/** Core marketing routes (workspace = `/upload` in this app). */
const CORE_STATIC_PATHS = [
  "/",
  "/pricing",
  "/upload",
  "/blog",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
] as const;

const LEGAL_PATHS = new Set(["/privacy", "/terms"]);

const FORMAT_PATHS = [
  ...new Set([
    "/summarize-pdf",
    "/summarize-youtube-video",
    "/summarize-powerpoint",
    "/summarize-web-articles",
    "/summarize-docx",
    "/summarize-mp3",
    ...Object.values(FORMAT_LANDINGS).map((c) => c.path),
  ]),
];

const SEGMENT_PATHS = [
  "/for-students",
  "/for-creators",
  "/for-teams",
  "/for-freelancers",
  "/for-researchers",
] as const;

function toDate(value?: Date | string): Date {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

function entry(input: SitemapEntryInput): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(input.path),
    lastModified: toDate(input.lastModified),
    changeFrequency: input.changeFrequency,
    priority: input.priority,
  };
}

function collectStaticAndConfigPaths(): string[] {
  const modePaths = ["/modes", ...ACTIVE_INTELLIGENCE_MODE_IDS.map((id) => `/modes/${id}`)];
  const blogCategoryPaths = getAllBlogCategorySlugs().map((slug) => `/blog/category/${slug}`);
  const guidePaths = GUIDE_SLUGS.map((slug) => `/guides/${slug}`);
  const comparisonPaths = COMPARISON_SLUGS.map((slug) => `/compare/${slug}`);
  const useCasePaths = USE_CASE_SLUGS.map((slug) => `/use-cases/${slug}`);

  return [
    ...CORE_STATIC_PATHS,
    ...FORMAT_PATHS,
    ...SEGMENT_PATHS,
    ...modePaths,
    ...blogCategoryPaths,
    ...guidePaths,
    ...comparisonPaths,
    ...useCasePaths,
  ];
}

function metaForPath(path: string, lastModified?: Date | string): SitemapEntryInput {
  if (path === "/") {
    return { path, lastModified, changeFrequency: "daily", priority: 1 };
  }

  if (path === "/pricing" || path === "/upload") {
    return { path, lastModified, changeFrequency: "weekly", priority: 0.9 };
  }

  if (path === "/blog") {
    return { path, lastModified, changeFrequency: "daily", priority: 0.8 };
  }

  if (LEGAL_PATHS.has(path)) {
    return { path, lastModified, changeFrequency: "yearly", priority: 0.3 };
  }

  if (path.startsWith("/blog/")) {
    return { path, lastModified, changeFrequency: "weekly", priority: 0.8 };
  }

  if (
    (FORMAT_PATHS as readonly string[]).includes(path) ||
    path.startsWith("/modes") ||
    path.startsWith("/for-") ||
    path.startsWith("/use-cases/")
  ) {
    return { path, lastModified, changeFrequency: "weekly", priority: 0.8 };
  }

  if (path.startsWith("/guides/") || path.startsWith("/compare/")) {
    return { path, lastModified, changeFrequency: "weekly", priority: 0.75 };
  }

  return { path, lastModified, changeFrequency: "weekly", priority: 0.8 };
}

/**
 * Builds the full sitemap from local data modules (blog, formats, modes, segments).
 * Regenerates on each `next build` / deploy — no manual sitemap edits.
 */
export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  function push(input: SitemapEntryInput) {
    if (seen.has(input.path)) return;
    seen.add(input.path);
    entries.push(entry(input));
  }

  for (const path of collectStaticAndConfigPaths()) {
    push(metaForPath(path));
  }

  for (const post of BLOG_POSTS) {
    push(
      metaForPath(`/blog/${post.slug}`, post.updatedAt ?? post.date),
    );
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}

/** Base URL for robots/sitemap references (from `siteConfig.url`). */
export function getSitemapBaseUrl(): string {
  return siteConfig.url.replace(/\/$/, "");
}
