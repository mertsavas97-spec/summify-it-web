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
