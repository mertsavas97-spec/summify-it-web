import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import { cmsRecordToPublicPost, staticToPublicPost, type PublicBlogPost } from "@/lib/blog/cmsToPublicPost";
import {
  getCmsBlogPostBySlug,
  listPublishedCmsBlogPosts,
  listAllCmsSlugs,
} from "@/server/blog/cmsBlogRepository";

export async function getPublicBlogPostBySlug(
  slug: string,
): Promise<PublicBlogPost | undefined> {
  const { post } = await getCmsBlogPostBySlug(slug, { publishedOnly: true });
  if (post) return cmsRecordToPublicPost(post);

  const staticPost = BLOG_POSTS.find((p) => p.slug === slug);
  if (staticPost) return staticToPublicPost(staticPost);
  return undefined;
}

export async function getAllPublicBlogPosts(): Promise<PublicBlogPost[]> {
  const staticPosts = BLOG_POSTS.map(staticToPublicPost);
  const cmsPosts = (await listPublishedCmsBlogPosts()).map(cmsRecordToPublicPost);
  const bySlug = new Map<string, PublicBlogPost>();

  for (const p of staticPosts) bySlug.set(p.slug, p);
  for (const p of cmsPosts) bySlug.set(p.slug, p);

  return [...bySlug.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getAllPublicBlogSlugs(): Promise<string[]> {
  const staticSlugs = BLOG_POSTS.map((p) => p.slug);
  const cmsSlugs = await listAllCmsSlugs();
  return [...new Set([...staticSlugs, ...cmsSlugs])];
}

export async function getPublishedCmsSlugs(): Promise<string[]> {
  return (await listPublishedCmsBlogPosts()).map((p) => p.slug);
}

/** Sync helpers for static-only callers */
export function getStaticBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
