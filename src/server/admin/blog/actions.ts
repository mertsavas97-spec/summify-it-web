"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog-posts";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { computeBlogSeoScore } from "@/lib/blog/seoScore";
import type {
  AdminBlogPostRecord,
  CmsBlogPostInput,
  CmsBlogListFilters,
} from "@/types/cms-blog";
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

function staticPostId(slug: string) {
  return `static-${slug}`;
}

function staticBodySeed(post: (typeof BLOG_POSTS)[number]) {
  const takeaways = post.keyTakeaways?.map((item) => `- ${item}`).join("\n");
  const links = post.relatedLinks
    .map((link) => `- [${link.label}](${link.href})`)
    .join("\n");

  return [
    `# ${post.title}`,
    "",
    post.description,
    takeaways ? `\n## Key takeaways\n${takeaways}` : "",
    links ? `\n## Related links\n${links}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function staticToAdminPost(post: (typeof BLOG_POSTS)[number]): AdminBlogPostRecord {
  return {
    id: staticPostId(post.slug),
    source: "static",
    slug: post.slug,
    title: post.title,
    excerpt: post.description,
    categoryId: post.categoryId,
    tags: post.tags,
    coverImageUrl: null,
    markdownBody: staticBodySeed(post),
    bodyFormat: "markdown",
    authorName: post.author.name,
    authorRole: post.author.role,
    authorBio: post.author.bio,
    authorHref: post.author.href ?? "/about",
    status: "published",
    seoTitle: post.title,
    seoDescription: post.description,
    ogTitle: post.title,
    ogDescription: post.description,
    canonicalUrl: absoluteUrl(`/blog/${post.slug}`),
    primaryKeyword: post.keywords[0] ?? null,
    faqs: post.faqs,
    publishedAt: post.date,
    createdAt: post.date,
    updatedAt: post.updatedAt,
  };
}

function filterStaticPosts(filters: CmsBlogListFilters) {
  const search = filters.search?.trim().toLowerCase();
  return BLOG_POSTS.map(staticToAdminPost).filter((post) => {
    if (filters.status && filters.status !== "all" && post.status !== filters.status) {
      return false;
    }
    if (filters.categoryId && post.categoryId !== filters.categoryId) {
      return false;
    }
    return !search || post.title.toLowerCase().includes(search) || post.slug.includes(search);
  });
}

function sortAdminPosts(posts: AdminBlogPostRecord[], sort: CmsBlogListFilters["sort"]) {
  return posts.sort((a, b) => {
    if (sort === "title_asc") return a.title.localeCompare(b.title);
    const updatedDelta = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    return sort === "updated_asc" ? updatedDelta : -updatedDelta;
  });
}

export async function adminListBlogPosts(filters: CmsBlogListFilters) {
  await requireAdminSession();
  const { posts, error } = await listCmsBlogPosts(filters);
  const slugs = await allSlugsExcept();
  const merged = new Map<string, AdminBlogPostRecord>();
  for (const post of filterStaticPosts(filters)) merged.set(post.slug, post);
  for (const post of posts) merged.set(post.slug, { ...post, source: "cms" });

  const enriched = sortAdminPosts([...merged.values()], filters.sort).map((post) => {
    const input: CmsBlogPostInput = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      categoryId: post.categoryId,
      tags: post.tags,
      markdownBody: post.markdownBody,
      bodyFormat: post.bodyFormat,
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
  return {
    posts: enriched,
    error,
  };
}

export async function adminGetBlogPost(id: string) {
  await requireAdminSession();
  if (id.startsWith("static-")) {
    const staticPost = BLOG_POSTS.find((post) => staticPostId(post.slug) === id);
    return { post: staticPost ? staticToAdminPost(staticPost) : null, error: undefined };
  }
  const result = await getCmsBlogPostById(id);
  return {
    ...result,
    post: result.post ? { ...result.post, source: "cms" as const } : null,
  };
}

export async function adminDuplicateStaticBlogPost(slug: string) {
  await requireAdminSession();
  const staticPost = BLOG_POSTS.find((post) => post.slug === slug);
  if (!staticPost) return { ok: false as const, error: "Static post not found." };

  const duplicate = staticToAdminPost(staticPost);
  const result = await createCmsBlogPost({
    slug: duplicate.slug,
    title: duplicate.title,
    excerpt: duplicate.excerpt,
    categoryId: duplicate.categoryId,
    tags: duplicate.tags,
    markdownBody: duplicate.markdownBody,
    bodyFormat: "markdown",
    authorName: duplicate.authorName,
    status: "draft",
    seoTitle: duplicate.seoTitle,
    seoDescription: duplicate.seoDescription,
    ogTitle: duplicate.ogTitle,
    ogDescription: duplicate.ogDescription,
    canonicalUrl: duplicate.canonicalUrl,
    primaryKeyword: duplicate.primaryKeyword,
    faqs: duplicate.faqs,
  });

  if (result.error || !result.post) {
    return { ok: false as const, error: result.error ?? "Duplicate failed." };
  }

  revalidateBlogPaths(result.post.slug);
  return { ok: true as const, post: result.post };
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
