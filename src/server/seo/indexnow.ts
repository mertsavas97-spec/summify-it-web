import { buildSitemapEntries } from "@/lib/sitemap/build-sitemap";
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

/**
 * Fetches the live sitemap, parses all <loc> URLs, and returns only public
 * canonical URLs belonging to https://www.summify.app.
 */
export async function getPublicSitemapUrls(): Promise<string[]> {
  const entries = await buildSitemapEntries();

  return entries
    .map((e) => e.url)
    .filter((url) => {
      // Only canonical www.summify.app URLs
      if (!url.startsWith(CANONICAL_BASE)) return false;

      // Extract the path portion
      const path = url.replace(CANONICAL_BASE, "") || "/";

      // Exclude private / non-indexable routes
      for (const prefix of EXCLUDED_PATH_PREFIXES) {
        if (path === prefix || path.startsWith(`${prefix}/`)) {
          return false;
        }
      }

      return true;
    });
}

/**
 * Collects the latest blog post URLs (up to 10) from the sitemap,
 * sorted by lastModified descending.
 */
export async function getLatestBlogUrls(limit = 10): Promise<string[]> {
  const entries = await buildSitemapEntries();

  const blogEntries = entries
    .filter((e) => {
      if (!e.url.startsWith(CANONICAL_BASE)) return false;
      const path = e.url.replace(CANONICAL_BASE, "") || "/";
      return path.startsWith("/blog/");
    })
    .sort((a, b) => {
      const aTime = a.lastModified
        ? a.lastModified instanceof Date
          ? a.lastModified.getTime()
          : new Date(a.lastModified).getTime()
        : 0;
      const bTime = b.lastModified
        ? b.lastModified instanceof Date
          ? b.lastModified.getTime()
          : new Date(b.lastModified).getTime()
        : 0;
      return bTime - aTime;
    });

  return blogEntries.slice(0, limit).map((e) => e.url);
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

  for (const url of urls) {
    if (!url.startsWith(CANONICAL_BASE)) {
      skipped.push(url);
      continue;
    }

    const path = url.replace(CANONICAL_BASE, "") || "/";
    let excluded = false;
    for (const prefix of EXCLUDED_PATH_PREFIXES) {
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        excluded = true;
        break;
      }
    }

    if (excluded) {
      skipped.push(url);
    } else {
      valid.push(url);
    }
  }

  return [valid, skipped];
}

/**
 * Submits a list of URLs to the IndexNow API.
 * Only canonical https://www.summify.app URLs are allowed.
 */
export async function submitUrlsToIndexNow(
  urls: string[],
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

      return {
        ok: true,
        submittedCount: validUrls.length,
        submittedUrls: validUrls,
        skippedUrls: skippedFromValidation,
        indexNowStatus: response.status,
        indexNowResponseText: responseText || undefined,
        submittedAt,
      };
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

  const result = await submitUrlsToIndexNow(urls);

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