import "server-only";

import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { BlogCategoryId } from "@/data/blog-categories";
import type { BlogFaqItem } from "@/data/blog-post-types";
import type {
  CmsBlogListFilters,
  CmsBlogPostInput,
  CmsBlogPostRecord,
  CmsBlogStatus,
} from "@/types/cms-blog";

type DbRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category_id: string;
  tags: string[] | null;
  cover_image_url: string | null;
  markdown_body: string;
  author_name: string | null;
  author_role: string | null;
  author_bio: string | null;
  author_href: string | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical_url: string | null;
  primary_keyword: string | null;
  faqs: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbRow): CmsBlogPostRecord {
  const faqs = Array.isArray(row.faqs)
    ? (row.faqs as BlogFaqItem[])
    : [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    categoryId: row.category_id as BlogCategoryId,
    tags: row.tags ?? [],
    coverImageUrl: row.cover_image_url,
    markdownBody: row.markdown_body ?? "",
    authorName: row.author_name ?? "Summify Editorial",
    authorRole: row.author_role ?? "Product & learning workflows",
    authorBio: row.author_bio,
    authorHref: row.author_href,
    status: row.status as CmsBlogStatus,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    canonicalUrl: row.canonical_url,
    primaryKeyword: row.primary_keyword,
    faqs,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbPayload(input: CmsBlogPostInput, now: string) {
  const publishedAt =
    input.status === "published"
      ? input.publishedAt ?? now
      : input.status === "draft"
        ? null
        : input.publishedAt ?? null;

  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || null,
    category_id: input.categoryId,
    tags: input.tags ?? [],
    cover_image_url: input.coverImageUrl?.trim() || null,
    markdown_body: input.markdownBody,
    author_name: input.authorName?.trim() || "Summify Editorial",
    author_role: input.authorRole?.trim() || "Product & learning workflows",
    author_bio: input.authorBio?.trim() || null,
    author_href: input.authorHref?.trim() || "/about",
    status: input.status,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    og_title: input.ogTitle?.trim() || null,
    og_description: input.ogDescription?.trim() || null,
    canonical_url: input.canonicalUrl?.trim() || null,
    primary_keyword: input.primaryKeyword?.trim() || null,
    faqs: input.faqs ?? [],
    published_at: publishedAt,
    updated_at: now,
  };
}

export function isCmsBlogConfigured(): boolean {
  return isServiceRoleConfigured();
}

export async function listCmsBlogPosts(
  filters: CmsBlogListFilters = {},
): Promise<{ posts: CmsBlogPostRecord[]; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { posts: [], error: "Supabase service role is not configured." };
  }

  try {
    const admin = getSupabaseAdmin();
    let query = admin.from("cms_blog_posts").select("*");

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/[%_]/g, "");
      if (term) {
        query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
      }
    }

    const ascending = filters.sort === "updated_asc" || filters.sort === "title_asc";
    const orderCol = filters.sort === "title_asc" ? "title" : "updated_at";
    query = query.order(orderCol, { ascending });

    const { data, error } = await query;
    if (error) {
      return { posts: [], error: error.message };
    }

    return { posts: (data as DbRow[]).map(mapRow) };
  } catch (e) {
    return {
      posts: [],
      error: e instanceof Error ? e.message : "Failed to list CMS posts.",
    };
  }
}

export async function getCmsBlogPostById(
  id: string,
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { post: null, error: "Supabase service role is not configured." };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("cms_blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { post: null, error: error.message };
  if (!data) return { post: null };
  return { post: mapRow(data as DbRow) };
}

export async function getCmsBlogPostBySlug(
  slug: string,
  options?: { publishedOnly?: boolean },
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { post: null };
  }

  let query = getSupabaseAdmin().from("cms_blog_posts").select("*").eq("slug", slug);
  if (options?.publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  if (error) return { post: null, error: error.message };
  if (!data) return { post: null };
  return { post: mapRow(data as DbRow) };
}

export async function listPublishedCmsBlogPosts(): Promise<CmsBlogPostRecord[]> {
  const { posts } = await listCmsBlogPosts({ status: "published", sort: "updated_desc" });
  return posts;
}

export async function listAllCmsSlugs(): Promise<string[]> {
  const { posts } = await listCmsBlogPosts();
  return posts.map((p) => p.slug);
}

export async function createCmsBlogPost(
  input: CmsBlogPostInput,
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { post: null, error: "Supabase service role is not configured." };
  }

  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("cms_blog_posts")
    .insert({ ...toDbPayload(input, now), created_at: now })
    .select("*")
    .single();

  if (error) return { post: null, error: error.message };
  return { post: mapRow(data as DbRow) };
}

export async function updateCmsBlogPost(
  id: string,
  input: CmsBlogPostInput,
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { post: null, error: "Supabase service role is not configured." };
  }

  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("cms_blog_posts")
    .update(toDbPayload(input, now))
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { post: null, error: error.message };
  return { post: mapRow(data as DbRow) };
}

export async function archiveCmsBlogPost(id: string): Promise<{ error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { error: "Supabase service role is not configured." };
  }

  const { error } = await getSupabaseAdmin()
    .from("cms_blog_posts")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  return error ? { error: error.message } : {};
}

export async function deleteCmsBlogPost(id: string): Promise<{ error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { error: "Supabase service role is not configured." };
  }

  const { error } = await getSupabaseAdmin().from("cms_blog_posts").delete().eq("id", id);
  return error ? { error: error.message } : {};
}
