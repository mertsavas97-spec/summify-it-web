import { NextResponse } from "next/server";
import {
  requireAdminSession,
  AdminUnauthorizedError,
} from "@/lib/admin/requireAdmin";
import {
  getPublicSitemapUrls,
  getLatestBlogUrls,
  getNewBlogUrlsSinceLastSubmission,
  getSeoIndexingDebugInfo,
  submitUrlsToIndexNow,
} from "@/server/seo/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANONICAL_BASE = "https://www.summify.app";

type SubmitBody = {
  mode: "all_sitemap" | "urls" | "latest_blog" | "new_blog";
  urls?: string[];
};

function isValidBody(body: unknown): body is SubmitBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (
    b.mode !== "all_sitemap" &&
    b.mode !== "urls" &&
    b.mode !== "latest_blog" &&
    b.mode !== "new_blog"
  ) {
    return false;
  }
  if (b.mode === "urls") {
    if (!Array.isArray(b.urls)) return false;
    if (!b.urls.every((u: unknown) => typeof u === "string")) return false;
  }
  return true;
}

/**
 * POST /api/admin/seo/indexnow
 *
 * Admin-only endpoint to submit URLs to IndexNow.
 *
 * Body:
 * - mode: "all_sitemap" | "latest_blog" | "new_blog" | "urls"
 * - urls?: string[] (required when mode="urls")
 */
export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 },
      );
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Invalid body. Expected { mode: "all_sitemap" | "latest_blog" | "new_blog" | "urls", urls?: string[] }',
      },
      { status: 400 },
    );
  }

  try {
    let urlsToSubmit: string[];

    switch (body.mode) {
      case "all_sitemap": {
        urlsToSubmit = await getPublicSitemapUrls();
        break;
      }
      case "latest_blog": {
        urlsToSubmit = await getLatestBlogUrls(10);
        break;
      }
      case "new_blog": {
        urlsToSubmit = await getNewBlogUrlsSinceLastSubmission();
        break;
      }
      case "urls": {
        // Filter to only allow canonical www.summify.app URLs
        urlsToSubmit = (body.urls ?? []).filter((url) => {
          return url.startsWith(CANONICAL_BASE);
        });
        break;
      }
      default: {
        return NextResponse.json(
          { ok: false, message: "Unknown mode" },
          { status: 400 },
        );
      }
    }

    if (urlsToSubmit.length === 0) {
      return NextResponse.json({
        ok: true,
        submittedCount: 0,
        submittedUrls: [],
        skippedUrls: [],
        indexNowStatus: 200,
        submittedAt: new Date().toISOString(),
        message: "No URLs to submit",
      });
    }

    const actionType =
      body.mode === "all_sitemap"
        ? "sitemap"
        : body.mode === "new_blog"
          ? "new_blog"
          : "latest_blog";

    const result = await submitUrlsToIndexNow(urlsToSubmit, actionType);

    return NextResponse.json({
      ok: result.ok,
      submittedCount: result.submittedCount,
      submittedUrls: result.submittedUrls,
      skippedUrls: result.skippedUrls,
      indexNowStatus: result.indexNowStatus,
      indexNowResponseText: result.indexNowResponseText,
      submittedAt: result.submittedAt,
      actionType,
    });
  } catch (err) {
    console.error("[seo/indexnow] Unexpected error:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        message: "IndexNow submission failed. Check server logs.",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/seo/indexnow
 *
 * Returns the current IndexNow key status and sitemap info (no secrets exposed).
 */
export async function GET() {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 403 },
      );
    }
    throw e;
  }

  try {
    const debugInfo = await getSeoIndexingDebugInfo();

    return NextResponse.json({
      ok: true,
      indexNowKeyConfigured: true,
      sitemapUrl: `${CANONICAL_BASE}/sitemap.xml`,
      sitemapUrlCount: debugInfo.totalPublicUrls,
      latestBlogUrlCount: debugInfo.latest10BlogUrls.length,
      latestBlogUrls: debugInfo.latest10BlogUrls,
      totalPublicUrls: debugInfo.totalPublicUrls,
      totalBlogUrls: debugInfo.totalBlogUrls,
      latest10BlogUrls: debugInfo.latest10BlogUrls,
      newBlogUrlsSinceLastSubmission: debugInfo.newBlogUrlsSinceLastSubmission,
      missingPublishedBlogUrlsFromSitemap: debugInfo.missingPublishedBlogUrlsFromSitemap,
      lastSubmission: debugInfo.lastSubmission,
      sitemapGenerationMode: "build_deploy",
    });
  } catch (err) {
    console.error("[seo/indexnow] GET error:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to load SEO info",
      },
      { status: 500 },
    );
  }
}