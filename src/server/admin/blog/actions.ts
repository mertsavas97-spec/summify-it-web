"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog-posts";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { computeBlogSeoScore } from "@/lib/blog/seoScore";
import type { CmsBlogPostInput, CmsBlogListFilters } from "@/types/cms-blog";
import {
  archiveCmsBlogPost,
  createCmsBlogPost,
  deleteCmsBlogPost,
  getCmsBlogPostById,
  listCmsBlogPosts,
  updateCmsBlogPost,
} from "@/server/blog/cmsBlogRepository";
import { absoluteUrl } from "@/lib/seo";

function revalidateBlogPaths(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/admin/blog");
}

async function allSlugsExcept(ignoreId?: string): Promise<string[]> {
  const staticSlugs = BLOG_POSTS.map((p) => p.slug);
  const { posts } = await listCmsBlogPosts();
  const cmsSlugs = posts.filter((p) => p.id !== ignoreId).map((p) => p.slug);
  return [...new Set([...staticSlugs, ...cmsSlugs])];
}

function withCanonicalDefaults(input: CmsBlogPostInput): CmsBlogPostInput {
  const slug = input.slug.trim();
  return {
    ...input,
    canonicalUrl:
      input.canonicalUrl?.trim() || (slug ? absoluteUrl(`/blog/${slug}`) : null),
    ogTitle: input.ogTitle?.trim() || input.seoTitle?.trim() || input.title.trim(),
    ogDescription:
      input.ogDescription?.trim() ||
      input.seoDescription?.trim() ||
      input.excerpt?.trim() ||
      null,
  };
}

export async function adminListBlogPosts(filters: CmsBlogListFilters) {
  await requireAdminSession();
  const { posts, error } = await listCmsBlogPosts(filters);
  const slugs = await allSlugsExcept();
  const enriched = posts.map((post) => {
    const input: CmsBlogPostInput = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      categoryId: post.categoryId,
      tags: post.tags,
      markdownBody: post.markdownBody,
      status: post.status,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      primaryKeyword: post.primaryKeyword,
      faqs: post.faqs,
      canonicalUrl: post.canonicalUrl,
      ogTitle: post.ogTitle,
      ogDescription: post.ogDescription,
    };
    const seo = computeBlogSeoScore({
      ...input,
      existingSlugs: slugs,
      ignoreSlug: post.slug,
    });
    return { ...post, seoScore: seo.score };
  });
  return { posts: enriched, error };
}

export async function adminGetBlogPost(id: string) {
  await requireAdminSession();
  return getCmsBlogPostById(id);
}

export async function adminSaveBlogPost(
  id: string | null,
  input: CmsBlogPostInput,
  options?: { forcePublish?: boolean },
) {
  await requireAdminSession();
  const payload = withCanonicalDefaults(input);
  const slugs = await allSlugsExcept(id ?? undefined);
  const seo = computeBlogSeoScore({
    ...payload,
    existingSlugs: slugs,
    ignoreSlug: payload.slug,
  });

  if (seo.publishBlocked.length > 0) {
    return { ok: false as const, error: seo.publishBlocked.join(" "), seo };
  }

  if (
    payload.status === "published" &&
    !options?.forcePublish &&
    seo.publishWarnings.length > 0
  ) {
    return { ok: false as const, needsConfirm: true as const, seo, warnings: seo.publishWarnings };
  }

  const result = id
    ? await updateCmsBlogPost(id, payload)
    : await createCmsBlogPost(payload);

  if (result.error || !result.post) {
    return { ok: false as const, error: result.error ?? "Save failed.", seo };
  }

  revalidateBlogPaths(result.post.slug);
  return { ok: true as const, post: result.post, seo };
}

export async function adminArchiveBlogPost(id: string) {
  await requireAdminSession();
  const { post } = await getCmsBlogPostById(id);
  const result = await archiveCmsBlogPost(id);
  if (!result.error && post) revalidateBlogPaths(post.slug);
  return result;
}

export async function adminDeleteBlogPost(id: string) {
  await requireAdminSession();
  const { post } = await getCmsBlogPostById(id);
  const result = await deleteCmsBlogPost(id);
  if (!result.error && post) revalidateBlogPaths(post.slug);
  return result;
}

export async function adminPreviewSeoScore(input: CmsBlogPostInput, ignoreId?: string) {
  await requireAdminSession();
  const slugs = await allSlugsExcept(ignoreId);
  return computeBlogSeoScore({
    ...withCanonicalDefaults(input),
    existingSlugs: slugs,
    ignoreSlug: input.slug,
  });
}

export async function adminRedirectIfUnauthorized(error: unknown) {
  if (error instanceof AdminUnauthorizedError) {
    redirect("/");
  }
}
