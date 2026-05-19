import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";

export type { BlogPost } from "@/data/blog-posts";

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
  return ["/blog", ...BLOG_POSTS.map((p) => `/blog/${p.slug}`)];
}

const RELATED_LIMIT = 3;

/** Related posts by shared tags, then category, excluding current slug. */
export function getRelatedBlogPosts(slug: string, limit = RELATED_LIMIT): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  if (!current) return [];

  const tagSet = new Set(current.tags);
  return BLOG_POSTS.filter((p) => p.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((t) => tagSet.has(t)).length;
      const categoryMatch = post.category === current.category ? 1 : 0;
      return { post, score: sharedTags * 2 + categoryMatch };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
    )
    .slice(0, limit)
    .map((s) => s.post);
}
