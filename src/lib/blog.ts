import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import {
  BLOG_CATEGORIES,
  getBlogCategory,
  type BlogCategory,
  type BlogCategoryId,
} from "@/data/blog-categories";
import type { BlogContentCluster } from "@/data/blog-clusters";
import { COMPARISON_SLUGS } from "@/data/comparisons/registry";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export type { BlogPost } from "@/data/blog-posts";

export type BlogProductLink = {
  href: string;
  label: string;
  description?: string;
};

const FORMAT_LINKS: BlogProductLink[] = [
  { href: "/summarize-pdf", label: "AI PDF summarizer", description: "Reports, papers, and lecture PDFs." },
  {
    href: "/summarize-youtube-video",
    label: "YouTube summarizer",
    description: "Lectures, explainers, and podcasts.",
  },
  {
    href: "/summarize-powerpoint",
    label: "PowerPoint summarizer",
    description: "Decks and slide intelligence.",
  },
  {
    href: "/summarize-web-articles",
    label: "Web article summarizer",
    description: "URLs and article text.",
  },
];

const WORKFLOW_LINKS: BlogProductLink[] = [
  { href: "/upload", label: "Document workspace", description: "Upload and analyze in one place." },
  { href: "/for-students", label: "Study & exam prep", description: "Learn cards and quizzes." },
  { href: "/for-researchers", label: "Research workflows", description: "Literature and paper skims." },
  { href: "/modes", label: "Intelligence modes", description: "29 lenses for PDFs and video." },
];

const COMPARISON_LINKS: BlogProductLink[] = COMPARISON_SLUGS.map((slug) => ({
  href: `/compare/${slug}`,
  label: `Summify vs ${slug === "chatpdf" ? "ChatPDF" : slug === "quillbot" ? "Quillbot" : "Notta"}`,
}));

const CLUSTER_FORMAT_MAP: Partial<Record<BlogContentCluster, string>> = {
  "ai-pdf-summarizer": "/summarize-pdf",
  "ai-youtube-summarizer": "/summarize-youtube-video",
  "pptx-summarizer": "/summarize-powerpoint",
  "study-workflows": "/for-students",
  "research-workflows": "/for-researchers",
};

const CATEGORY_FORMAT_MAP: Partial<Record<BlogCategoryId, string[]>> = {
  "pdf-workflows": ["/summarize-pdf"],
  "youtube-summaries": ["/summarize-youtube-video"],
  "pptx-documents": ["/summarize-powerpoint"],
  "study-learning": ["/for-students", "/upload"],
  "ai-research": ["/for-researchers", "/summarize-pdf"],
  comparisons: ["/summarize-pdf", "/compare/chatpdf"],
  productivity: ["/upload", "/for-teams"],
};

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

export function getBlogSitemapPaths(): string[] {
  const categoryPaths = BLOG_CATEGORIES.map((c) => `/blog/category/${c.slug}`);
  return ["/blog", ...categoryPaths, ...BLOG_POSTS.map((p) => `/blog/${p.slug}`)];
}

export function getPostsByCategory(categoryId: BlogCategoryId): BlogPost[] {
  return getAllBlogPosts().filter((p) => p.categoryId === categoryId);
}

export function getFeaturedBlogPost(): BlogPost {
  return getAllBlogPosts().find((p) => p.featured) ?? getAllBlogPosts()[0]!;
}

export function getTrendingBlogPosts(limit = 3): BlogPost[] {
  const trending = getAllBlogPosts().filter((p) => p.trending);
  return (trending.length > 0 ? trending : getAllBlogPosts()).slice(0, limit);
}

export function getComparisonBlogPosts(): BlogPost[] {
  return getPostsByCategory("comparisons");
}

export function getLearningWorkflowPosts(): BlogPost[] {
  return getAllBlogPosts().filter((p) =>
    ["study-learning", "pdf-workflows", "youtube-summaries"].includes(p.categoryId),
  );
}

export function getLatestBlogPosts(limit = 6): BlogPost[] {
  return getAllBlogPosts().slice(0, limit);
}

const RELATED_LIMIT = 3;

/** Related posts by shared tags, keywords, category, and clusters. */
export function getRelatedBlogPosts(slug: string, limit = RELATED_LIMIT): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  if (!current) return [];

  const tagSet = new Set(current.tags.map((t) => t.toLowerCase()));
  const keywordSet = new Set(current.keywords.map((k) => k.toLowerCase()));
  const clusterSet = new Set(current.clusters);

  return BLOG_POSTS.filter((p) => p.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((t) => tagSet.has(t.toLowerCase())).length;
      const sharedKeywords = post.keywords.filter((k) =>
        keywordSet.has(k.toLowerCase()),
      ).length;
      const sharedClusters = post.clusters.filter((c) => clusterSet.has(c)).length;
      const categoryMatch = post.categoryId === current.categoryId ? 2 : 0;
      const score = sharedTags * 2 + sharedKeywords * 2 + sharedClusters * 3 + categoryMatch;
      return { post, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
    )
    .slice(0, limit)
    .map((s) => s.post);
}

export function getRelatedProductLinks(post: BlogPost): {
  workflows: BlogProductLink[];
  formats: BlogProductLink[];
  comparisons: BlogProductLink[];
} {
  const formatHrefs = new Set<string>();

  for (const cluster of post.clusters) {
    const href = CLUSTER_FORMAT_MAP[cluster];
    if (href) formatHrefs.add(href);
  }
  for (const href of CATEGORY_FORMAT_MAP[post.categoryId] ?? []) {
    formatHrefs.add(href);
  }
  for (const link of post.relatedLinks) {
    if (link.href.startsWith("/summarize") || link.href.startsWith("/for-")) {
      formatHrefs.add(link.href);
    }
  }

  const formats = FORMAT_LINKS.filter((f) => formatHrefs.has(f.href)).slice(0, 4);
  if (formats.length === 0) {
    formats.push(FORMAT_LINKS[0], FORMAT_LINKS[1]);
  }

  const workflows = WORKFLOW_LINKS.filter((w) => {
    if (post.categoryId === "study-learning") return w.href.includes("students") || w.href === "/upload";
    if (post.categoryId === "ai-research") return w.href.includes("researchers");
    return true;
  }).slice(0, 3);

  const comparisons =
    post.categoryId === "comparisons"
      ? COMPARISON_LINKS.slice(0, 3)
      : COMPARISON_LINKS.slice(0, 2);

  return { workflows, formats, comparisons };
}

export function buildBlogCategoryMetadata(category: BlogCategory): Metadata {
  return buildPageMetadata({
    title: category.seoTitle,
    description: category.seoDescription,
    path: `/blog/category/${category.slug}`,
    keywords: [category.name, category.positioning],
  });
}

export function blogPostBreadcrumbItems(post: BlogPost) {
  const category = getBlogCategory(post.categoryId);
  return [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: category.name, path: `/blog/category/${category.slug}` },
    { name: post.title, path: `/blog/${post.slug}` },
  ];
}
