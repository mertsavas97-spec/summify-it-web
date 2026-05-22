import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getServerSupabaseAdmin,
  isServerSupabaseAdminConfigured,
} from "@/server/supabase/admin";
import type { BlogCategoryId } from "@/data/blog-categories";
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
  category: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  body: string;
  author: string | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

let publicCmsClient: SupabaseClient | null = null;

function mapRow(row: DbRow): CmsBlogPostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    categoryId: (row.category ?? "study-learning") as BlogCategoryId,
    tags: row.tags ?? [],
    coverImageUrl: row.cover_image_url,
    markdownBody: row.body ?? "",
    authorName: row.author ?? "Summify Editorial",
    authorRole: "Product & learning workflows",
    authorBio: null,
    authorHref: "/about",
    status: row.status as CmsBlogStatus,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    canonicalUrl: row.canonical_url,
    primaryKeyword: null,
    faqs: [],
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
    category: input.categoryId,
    tags: input.tags ?? [],
    cover_image_url: input.coverImageUrl?.trim() || null,
    body: input.markdownBody,
    author: input.authorName?.trim() || "Summify Editorial",
    status: input.status,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    og_title: input.ogTitle?.trim() || null,
    og_description: input.ogDescription?.trim() || null,
    canonical_url: input.canonicalUrl?.trim() || null,
    published_at: publishedAt,
    updated_at: now,
  };
}

export function isCmsBlogConfigured(): boolean {
  return isServerSupabaseAdminConfigured();
}

function isMissingCmsBlogTableError(error: { code?: string | null; message?: string | null }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("cms_blog_posts") &&
      (message.includes("schema cache") || message.includes("does not exist"))
  );
}

function isCmsBlogPermissionError(error: { message?: string | null }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("permission denied") && message.includes("cms_blog_posts");
}

async function getPublicCmsClient() {
  if (!isSupabaseConfigured()) return null;

  publicCmsClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return publicCmsClient;
}

export async function listCmsBlogPosts(
  filters: CmsBlogListFilters = {},
): Promise<{ posts: CmsBlogPostRecord[]; error?: string; tableMissing?: boolean }> {
  if (!isCmsBlogConfigured()) {
    return { posts: [], tableMissing: true };
  }

  try {
    const admin = getServerSupabaseAdmin();
    let query = admin.from("cms_blog_posts").select("*");

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.categoryId) {
      query = query.eq("category", filters.categoryId);
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
      if (isMissingCmsBlogTableError(error) || isCmsBlogPermissionError(error)) {
        return { posts: [], tableMissing: true };
      }
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

  const { data, error } = await getServerSupabaseAdmin()
    .from("cms_blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingCmsBlogTableError(error) || isCmsBlogPermissionError(error)) {
      return { post: null };
    }
    return { post: null, error: error.message };
  }
  if (!data) return { post: null };
  return { post: mapRow(data as DbRow) };
}

export async function getCmsBlogPostBySlug(
  slug: string,
  options?: { publishedOnly?: boolean },
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  const publicClient = await getPublicCmsClient();
  if (!publicClient) {
    return { post: null };
  }

  let query = publicClient.from("cms_blog_posts").select("*").eq("slug", slug);
  query = query.eq("status", "published");
  if (!options?.publishedOnly) query = query.limit(1);

  const { data, error } = await query.maybeSingle();
  if (error) {
    if (isMissingCmsBlogTableError(error) || isCmsBlogPermissionError(error)) {
      return { post: null };
    }
    return { post: null };
  }
  if (!data) return { post: null };
  return { post: mapRow(data as DbRow) };
}

export async function listPublishedCmsBlogPosts(): Promise<CmsBlogPostRecord[]> {
  const publicClient = await getPublicCmsClient();
  if (!publicClient) return [];

  const { data, error } = await publicClient
    .from("cms_blog_posts")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data as DbRow[]).map(mapRow);
}

export async function listAllCmsSlugs(): Promise<string[]> {
  return (await listPublishedCmsBlogPosts()).map((post) => post.slug);
}

export async function createCmsBlogPost(
  input: CmsBlogPostInput,
): Promise<{ post: CmsBlogPostRecord | null; error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { post: null, error: "Supabase service role is not configured." };
  }

  const now = new Date().toISOString();
  const { data, error } = await getServerSupabaseAdmin()
    .from("cms_blog_posts")
    .insert({ ...toDbPayload(input, now), created_at: now })
    .select("*")
    .single();

  if (error) {
    if (isMissingCmsBlogTableError(error)) {
      return { post: null, error: "Create the CMS blog table before saving dashboard posts." };
    }
    if (isCmsBlogPermissionError(error)) {
      return { post: null, error: "Run the CMS RLS migration to allow admin blog saves." };
    }
    return { post: null, error: error.message };
  }
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
  const { data, error } = await getServerSupabaseAdmin()
    .from("cms_blog_posts")
    .update(toDbPayload(input, now))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingCmsBlogTableError(error)) {
      return { post: null, error: "Create the CMS blog table before saving dashboard posts." };
    }
    if (isCmsBlogPermissionError(error)) {
      return { post: null, error: "Run the CMS RLS migration to allow admin blog saves." };
    }
    return { post: null, error: error.message };
  }
  return { post: mapRow(data as DbRow) };
}

export async function archiveCmsBlogPost(id: string): Promise<{ error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { error: "Supabase service role is not configured." };
  }

  const { error } = await getServerSupabaseAdmin()
    .from("cms_blog_posts")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error && isMissingCmsBlogTableError(error)) {
    return { error: "Create the CMS blog table before archiving dashboard posts." };
  }
  if (error && isCmsBlogPermissionError(error)) {
    return { error: "Run the CMS RLS migration to allow admin blog archiving." };
  }
  return error ? { error: error.message } : {};
}

export async function deleteCmsBlogPost(id: string): Promise<{ error?: string }> {
  if (!isCmsBlogConfigured()) {
    return { error: "Supabase service role is not configured." };
  }

  const { error } = await getServerSupabaseAdmin().from("cms_blog_posts").delete().eq("id", id);
  if (error && isMissingCmsBlogTableError(error)) {
    return { error: "Create the CMS blog table before deleting dashboard posts." };
  }
  if (error && isCmsBlogPermissionError(error)) {
    return { error: "Run the CMS RLS migration to allow admin blog deletes." };
  }
  return error ? { error: error.message } : {};
}
