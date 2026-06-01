import { buildSitemapEntries } from "@/lib/sitemap/build-sitemap";
import { getAllPublicBlogPosts } from "@/lib/blog/resolvePost";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { devLog, devWarn } from "@/server/logging";
import { notifyInternalNonBlocking } from "@/server/internalNotifications";

const CANONICAL_BASE = "https://www.summify.app";

const INDEXNOW_KEY = "6aa53ee88e974aa2a615fc53f08923a4";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Path prefixes that should never be submitted to search engines. */
const EXCLUDED_PATH_PREFIXES = [
  "/dashboard",
  "/api",
  "/login",
  "/account",
  "/memory",
  "/share",
  "/auth",
];

export type IndexNowSubmissionResult = {
  ok: boolean;
  submittedCount: number;
  submittedUrls: string[];
  skippedUrls: string[];
  indexNowStatus: number;
  indexNowResponseText?: string;
  submittedAt: string;
};

export type SeoSubmissionActionType = "sitemap" | "latest_blog" | "new_blog";

export type LastSeoSubmissionMetadata = {
  timestamp: string;
  submittedUrls: string[];
  count: number;
  actionType: SeoSubmissionActionType;
};

type BlogEntry = {
  url: string;
  modifiedAt: string;
};

function isBlogPostPath(path: string): boolean {
  return /^\/blog\/[^/]+$/.test(path);
}

const SEO_SUBMISSION_PROVIDER = "seo_indexnow_submission_meta";

function isPublicCanonicalUrl(url: string): boolean {
  if (!url.startsWith(CANONICAL_BASE)) return false;
  const path = url.replace(CANONICAL_BASE, "") || "/";
  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return false;
  }
  return true;
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

async function readLastSeoSubmissionMetadata(): Promise<LastSeoSubmissionMetadata | null> {
  if (!isServiceRoleConfigured()) return null;
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("admin_oauth_tokens")
      .select("refresh_token")
      .eq("provider", SEO_SUBMISSION_PROVIDER)
      .maybeSingle();

    if (error || !data?.refresh_token) return null;
    const parsed = JSON.parse(data.refresh_token) as LastSeoSubmissionMetadata;
    if (
      !parsed ||
      typeof parsed.timestamp !== "string" ||
      !Array.isArray(parsed.submittedUrls) ||
      typeof parsed.count !== "number" ||
      (parsed.actionType !== "sitemap" &&
        parsed.actionType !== "latest_blog" &&
        parsed.actionType !== "new_blog")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeLastSeoSubmissionMetadata(meta: LastSeoSubmissionMetadata): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();
    await admin.from("admin_oauth_tokens").upsert({
      provider: SEO_SUBMISSION_PROVIDER,
      refresh_token: JSON.stringify(meta),
      scope: "seo:indexnow",
      token_type: "metadata",
      connected_at: meta.timestamp,
      updated_at: now,
    });
  } catch {
    // best-effort persistence
  }
}

/**
 * Fetches the live sitemap, parses all <loc> URLs, and returns only public
 * canonical URLs belonging to https://www.summify.app.
 */
export async function getPublicSitemapUrls(): Promise<string[]> {
  const entries = await buildSitemapEntries();

  return dedupeStrings(entries.map((e) => e.url).filter(isPublicCanonicalUrl));
}

/**
 * Collects the latest blog post URLs (up to 10) from the sitemap,
 * sorted by lastModified descending.
 */
export async function getLatestBlogUrls(limit = 10): Promise<string[]> {
  const blogEntries = await getBlogEntriesSortedByModifiedDesc();
  return blogEntries.slice(0, limit).map((e) => e.url);
}

export async function getBlogEntriesSortedByModifiedDesc(): Promise<BlogEntry[]> {
  const entries = await buildSitemapEntries();

  const blogEntries = entries
    .filter((e) => {
      if (!isPublicCanonicalUrl(e.url)) return false;
      const path = e.url.replace(CANONICAL_BASE, "") || "/";
      return isBlogPostPath(path);
    })
    .map((e) => {
      const modified = e.lastModified
        ? e.lastModified instanceof Date
          ? e.lastModified
          : new Date(e.lastModified)
        : new Date(0);
      return {
        url: e.url,
        modifiedAt: modified.toISOString(),
      };
    })
    .sort((a, b) => {
      const aTime = new Date(a.modifiedAt).getTime();
      const bTime = new Date(b.modifiedAt).getTime();
      return bTime - aTime;
    });

  const byUrl = new Map<string, BlogEntry>();
  for (const entry of blogEntries) {
    if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
  }

  return [...byUrl.values()];
}

export async function getPublishedBlogUrlsFromCanonicalSource(): Promise<string[]> {
  const posts = await getAllPublicBlogPosts();
  return dedupeStrings(posts.map((post) => `${CANONICAL_BASE}/blog/${post.slug}`));
}

export async function getMissingPublishedBlogUrlsFromSitemap(): Promise<string[]> {
  const [publishedBlogUrls, sitemapBlogEntries] = await Promise.all([
    getPublishedBlogUrlsFromCanonicalSource(),
    getBlogEntriesSortedByModifiedDesc(),
  ]);

  const sitemapBlogUrlSet = new Set(sitemapBlogEntries.map((entry) => entry.url));
  return publishedBlogUrls.filter((url) => !sitemapBlogUrlSet.has(url));
}

export async function getNewBlogUrlsSinceLastSubmission(): Promise<string[]> {
  const entries = await getBlogEntriesSortedByModifiedDesc();
  const last = await readLastSeoSubmissionMetadata();
  const lastTs = last ? new Date(last.timestamp).getTime() : 0;
  const lastSubmitted = new Set(last?.submittedUrls ?? []);

  return entries
    .filter((entry) => {
      const modified = new Date(entry.modifiedAt).getTime();
      return !lastSubmitted.has(entry.url) || modified > lastTs;
    })
    .map((entry) => entry.url);
}

export async function getSeoIndexingDebugInfo(): Promise<{
  totalPublicUrls: number;
  totalBlogUrls: number;
  latest10BlogUrls: string[];
  newBlogUrlsSinceLastSubmission: string[];
  missingPublishedBlogUrlsFromSitemap: string[];
  lastSubmission: LastSeoSubmissionMetadata | null;
}> {
  const [publicUrls, blogEntries, lastSubmission, missingPublishedBlogUrlsFromSitemap] = await Promise.all([
    getPublicSitemapUrls(),
    getBlogEntriesSortedByModifiedDesc(),
    readLastSeoSubmissionMetadata(),
    getMissingPublishedBlogUrlsFromSitemap(),
  ]);

  const latest10BlogUrls = blogEntries.slice(0, 10).map((entry) => entry.url);
  const newBlogUrlsSinceLastSubmission = await getNewBlogUrlsSinceLastSubmission();

  return {
    totalPublicUrls: publicUrls.length,
    totalBlogUrls: blogEntries.length,
    latest10BlogUrls,
    newBlogUrlsSinceLastSubmission,
    missingPublishedBlogUrlsFromSitemap,
    lastSubmission,
  };
}

/**
 * Validates that all URLs belong to the canonical domain and are public.
 * Returns [valid, skipped] tuple.
 */
function validateUrls(
  urls: string[],
): [valid: string[], skipped: string[]] {
  const valid: string[] = [];
  const skipped: string[] = [];

  for (const url of dedupeStrings(urls)) {
    if (isPublicCanonicalUrl(url)) {
      valid.push(url);
      continue;
    }
    skipped.push(url);
  }

  return [valid, skipped];
}

/**
 * Submits a list of URLs to the IndexNow API.
 * Only canonical https://www.summify.app URLs are allowed.
 */
export async function submitUrlsToIndexNow(
  urls: string[],
  actionType: SeoSubmissionActionType = "latest_blog",
): Promise<IndexNowSubmissionResult> {
  const submittedAt = new Date().toISOString();
  const [validUrls, skippedFromValidation] = validateUrls(urls);

  if (validUrls.length === 0) {
    return {
      ok: true,
      submittedCount: 0,
      submittedUrls: [],
      skippedUrls: skippedFromValidation,
      indexNowStatus: 200,
      submittedAt,
    };
  }

  const payload = {
    host: "www.summify.app",
    key: INDEXNOW_KEY,
    keyLocation: `${CANONICAL_BASE}/${INDEXNOW_KEY}.txt`,
    urlList: validUrls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text().catch(() => "");

    devLog("[seo.indexnow] submission", {
      status: response.status,
      urlCount: validUrls.length,
    });

    if (response.ok || response.status === 202) {
      // Send internal notification (non-blocking, best-effort)
      notifyInternalNonBlocking({
        title: "IndexNow Submission",
        summary: `Submitted ${validUrls.length} URLs to IndexNow.`,
        slackEmoji: ":mag:",
        pushoverTitle: "IndexNow",
        context: {
          submittedCount: validUrls.length,
          mode: "custom",
        },
      });

      const successResult: IndexNowSubmissionResult = {
        ok: true,
        submittedCount: validUrls.length,
        submittedUrls: validUrls,
        skippedUrls: skippedFromValidation,
        indexNowStatus: response.status,
        indexNowResponseText: responseText || undefined,
        submittedAt,
      };

      await writeLastSeoSubmissionMetadata({
        timestamp: submittedAt,
        submittedUrls: successResult.submittedUrls,
        count: successResult.submittedCount,
        actionType,
      });

      return successResult;
    }

    devWarn("[seo.indexnow] submission failed", {
      status: response.status,
      responseText: responseText.slice(0, 200),
    });

    return {
      ok: false,
      submittedCount: 0,
      submittedUrls: [],
      skippedUrls: [...skippedFromValidation, ...validUrls],
      indexNowStatus: response.status,
      indexNowResponseText: responseText || undefined,
      submittedAt,
    };
  } catch (err) {
    devWarn("[seo.indexnow] submission error", {
      message: err instanceof Error ? err.message : String(err),
    });

    return {
      ok: false,
      submittedCount: 0,
      submittedUrls: [],
      skippedUrls: [...skippedFromValidation, ...validUrls],
      indexNowStatus: 0,
      indexNowResponseText:
        err instanceof Error ? err.message : "Unknown error",
      submittedAt,
    };
  }
}

/**
 * Fetches all public sitemap URLs and submits them to IndexNow.
 */
export async function submitSitemapUrlsToIndexNow(): Promise<IndexNowSubmissionResult> {
  const urls = await getPublicSitemapUrls();
  devLog("[seo.indexnow] submitSitemapUrls", { urlCount: urls.length });

  const result = await submitUrlsToIndexNow(urls, "sitemap");

  // Send notification with sitemap mode
  if (result.ok && result.submittedCount > 0) {
    notifyInternalNonBlocking({
      title: "IndexNow Sitemap Submission",
      summary: `Submitted ${result.submittedCount} sitemap URLs to IndexNow.`,
      slackEmoji: ":sitemap:",
      pushoverTitle: "IndexNow Sitemap",
      context: {
        submittedCount: result.submittedCount,
        mode: "all_sitemap",
      },
    });
  }

  return result;
}