import { ACTIVE_INTELLIGENCE_MODE_IDS } from "@/config/modes";
import { BLOG_POSTS } from "@/data/blog-posts";
import { getAllBlogCategorySlugs } from "@/data/blog-categories";
import { FORMAT_LANDINGS } from "@/data/format-landings";
import { GUIDE_SLUGS } from "@/data/guides/registry";
import { COMPARISON_SLUGS } from "@/data/comparisons/registry";
import { USE_CASE_SLUGS } from "@/data/use-cases/registry";

/** Core marketing routes always indexable. */
const STATIC_MARKETING_PATHS = [
  "/",
  "/upload",
  "/pricing",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/blog",
  "/modes",
  "/summarize-pdf",
  "/summarize-youtube-video",
  "/summarize-powerpoint",
  "/summarize-web-articles",
  "/summarize-docx",
  "/summarize-mp3",
  // /pdf-summarizer 301 → /summarize-pdf (do not list both)
  "/video-summarizer",
  "/best-ai-for-studying",
  "/pdf-to-podcast",
  "/youtube-video-summarizer",
  "/ai-note-tool",
  "/for-students",
  "/for-creators",
  "/for-teams",
  "/for-freelancers",
  "/for-researchers",
] as const;

const FORMAT_PATHS = Object.values(FORMAT_LANDINGS).map((c) => c.path);

const SEGMENT_PATHS = [
  "/for-students",
  "/for-creators",
  "/for-teams",
  "/for-freelancers",
  "/for-researchers",
] as const;

const MODE_PATHS = ACTIVE_INTELLIGENCE_MODE_IDS.map((id) => `/modes/${id}`);

const GUIDE_PATHS = GUIDE_SLUGS.map((slug) => `/guides/${slug}`);

const COMPARISON_PATHS = COMPARISON_SLUGS.map((slug) => `/compare/${slug}`);

const USE_CASE_PATHS = USE_CASE_SLUGS.map((slug) => `/use-cases/${slug}`);

const BLOG_CATEGORY_PATHS = getAllBlogCategorySlugs().map(
  (slug) => `/blog/category/${slug}`,
);
const BLOG_PATHS = [
  ...BLOG_CATEGORY_PATHS,
  ...BLOG_POSTS.map((post) => `/blog/${post.slug}`),
];

/** All public indexable paths for sitemap and SEO audits. */
export function getAllIndexablePaths(): string[] {
  const paths = new Set<string>([
    ...STATIC_MARKETING_PATHS,
    ...FORMAT_PATHS,
    ...SEGMENT_PATHS,
    ...MODE_PATHS,
    ...GUIDE_PATHS,
    ...COMPARISON_PATHS,
    ...USE_CASE_PATHS,
    ...BLOG_PATHS,
  ]);
  return [...paths].sort();
}

export {
  STATIC_MARKETING_PATHS,
  FORMAT_PATHS,
  SEGMENT_PATHS,
  MODE_PATHS,
  GUIDE_PATHS,
  COMPARISON_PATHS,
  USE_CASE_PATHS,
  BLOG_PATHS,
};
