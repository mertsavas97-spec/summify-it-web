"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SeoInfo = {
  ok: boolean;
  indexNowKeyConfigured: boolean;
  sitemapUrl: string;
  sitemapUrlCount: number;
  latestBlogUrlCount: number;
  latestBlogUrls: string[];
  totalPublicUrls: number;
  totalBlogUrls: number;
  latest10BlogUrls: string[];
  newBlogUrlsSinceLastSubmission: string[];
  missingPublishedBlogUrlsFromSitemap?: string[];
  lastSubmission: {
    timestamp: string;
    submittedUrls: string[];
    count: number;
    actionType: "sitemap" | "latest_blog" | "new_blog";
  } | null;
  sitemapGenerationMode?: "build_deploy" | "runtime";
};

type SubmissionResult = {
  ok: boolean;
  submittedCount: number;
  submittedUrls: string[];
  skippedUrls: string[];
  indexNowStatus: number;
  indexNowResponseText?: string;
  submittedAt: string;
  actionType?: "sitemap" | "latest_blog" | "new_blog";
  message?: string;
};

export function SeoIndexingPanel() {
  const [seoInfo, setSeoInfo] = useState<SeoInfo | null>(null);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/seo/indexnow");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSeoInfo(data);
        }
      } catch {
        // Silently fail — panel will show unknown state
      } finally {
        if (!cancelled) setInfoLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (mode: "all_sitemap" | "latest_blog" | "new_blog") => {
      setLoading(true);
      setError(null);
      setLastResult(null);

      try {
        const res = await fetch("/api/admin/seo/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "IndexNow submission failed. Check server logs.");
          return;
        }

        setLastResult(data);
        const refreshed = await fetch("/api/admin/seo/indexnow");
        if (refreshed.ok) {
          const nextInfo = await refreshed.json();
          setSeoInfo(nextInfo);
        }
      } catch {
        setError("IndexNow submission failed. Check server logs.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const keyStatus = seoInfo?.indexNowKeyConfigured;
  const sitemapCount = seoInfo?.sitemapUrlCount ?? 0;
  const latest10 = seoInfo?.latest10BlogUrls ?? [];
  const newBlogUrls = seoInfo?.newBlogUrlsSinceLastSubmission ?? [];
  const missingFromSitemap = seoInfo?.missingPublishedBlogUrlsFromSitemap ?? [];
  const blogCount = latest10.length;
  const lastSubmission = seoInfo?.lastSubmission;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">SEO Indexing</h3>
        <Badge variant="accent" className="text-[10px]">
          IndexNow
        </Badge>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sitemap URL */}
        <Card compact>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Sitemap
          </p>
          <a
            href="https://www.summify.app/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 truncate text-xs text-violet-400 hover:text-violet-300"
          >
            /sitemap.xml
          </a>
          {!infoLoading && (
            <p className="mt-1 text-[11px] text-zinc-500">
              {sitemapCount} public URLs
            </p>
          )}
        </Card>

        {/* IndexNow key status */}
        <Card compact>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            IndexNow Key
          </p>
          <p className="mt-1 text-xs">
            {infoLoading ? (
              <span className="text-zinc-500">Loading...</span>
            ) : keyStatus ? (
              <span className="text-emerald-400">Configured</span>
            ) : (
              <span className="text-red-400">Missing</span>
            )}
          </p>
        </Card>

        {/* Last submission */}
        <Card compact>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Last Submission
          </p>
          {lastResult ? (
            <>
              <p className="mt-1 text-xs text-zinc-300">
                {new Date(lastResult.submittedAt).toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {lastResult.submittedCount} URLs submitted
              </p>
            </>
          ) : lastSubmission ? (
            <>
              <p className="mt-1 text-xs text-zinc-300">
                {new Date(lastSubmission.timestamp).toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {lastSubmission.actionType} · {lastSubmission.count} URLs
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">No submissions yet</p>
          )}
        </Card>

        {/* Latest blog count */}
        <Card compact>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Latest 10 Blog URLs
          </p>
          {!infoLoading ? (
            <p className="mt-1 text-xs text-zinc-300">
               {blogCount} available
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">Loading...</p>
          )}
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleSubmit("all_sitemap")}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit sitemap URLs to IndexNow"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleSubmit("latest_blog")}
          disabled={loading || blogCount === 0}
        >
          Submit latest 10 blog URLs
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleSubmit("new_blog")}
          disabled={loading || newBlogUrls.length === 0}
        >
          Submit new blog URLs
        </Button>
        <a
          href="https://search.google.com/search-console/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
        >
          Open Search Console ↗
        </a>
      </div>

      {/* Result / Error display */}
      {error && (
        <Card compact className="border-red-500/20 bg-red-950/20">
          <p className="text-xs text-red-400">{error}</p>
        </Card>
      )}

      {missingFromSitemap.length > 0 && (
        <Card compact className="border-amber-500/30 bg-amber-950/20">
          <p className="text-xs font-medium text-amber-300">
            Some published blog posts are missing from sitemap.
          </p>
          <ul className="mt-1 max-h-28 list-disc space-y-0.5 overflow-y-auto pl-4 text-[11px] text-amber-200/90">
            {missingFromSitemap.map((url) => (
              <li key={`missing-${url}`} className="truncate">
                {url}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {lastResult && !error && (
        <Card compact className="border-emerald-500/20 bg-emerald-950/20">
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-400">
              {lastResult.ok ? "Submission successful" : "Submission failed"}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-400">
              <span>Action:</span>
              <span>{lastResult.actionType ?? "unknown"}</span>
              <span>Status:</span>
              <span>{lastResult.indexNowStatus}</span>
              <span>Submitted:</span>
              <span>{lastResult.submittedCount} URLs</span>
              <span>Skipped:</span>
              <span>{lastResult.skippedUrls.length} URLs</span>
              <span>Time:</span>
              <span>
                {new Date(lastResult.submittedAt).toLocaleString()}
              </span>
            </div>
            {lastResult.submittedUrls.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-400">
                  Show submitted URLs ({lastResult.submittedUrls.length})
                </summary>
                <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[10px] text-zinc-500">
                  {lastResult.submittedUrls.map((url) => (
                    <li key={url} className="truncate">
                      {url}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {lastResult.indexNowResponseText && (
              <p className="mt-1 text-[10px] text-zinc-600">
                Response: {lastResult.indexNowResponseText.slice(0, 200)}
              </p>
            )}
          </div>
        </Card>
      )}

      <Card compact className="border-white/[0.04]">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Debug · Blog URL Selection
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] text-zinc-400 sm:grid-cols-2">
          <p>Total public URLs: {seoInfo?.totalPublicUrls ?? sitemapCount}</p>
          <p>Total blog URLs: {seoInfo?.totalBlogUrls ?? 0}</p>
          <p>
            Last submission: {lastSubmission?.actionType ?? "none"}
            {lastSubmission?.timestamp ? ` · ${new Date(lastSubmission.timestamp).toLocaleString()}` : ""}
          </p>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-400">
            Latest 10 blog URLs ({latest10.length})
          </summary>
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[10px] text-zinc-500">
            {latest10.map((url) => (
              <li key={`latest-${url}`} className="truncate">
                {url}
              </li>
            ))}
          </ul>
        </details>

        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-400">
            New blog URLs since last submission ({newBlogUrls.length})
          </summary>
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[10px] text-zinc-500">
            {newBlogUrls.map((url) => (
              <li key={`new-${url}`} className="truncate">
                {url}
              </li>
            ))}
          </ul>
        </details>
      </Card>

      {/* Search Console guidance */}
      <Card compact className="border-white/[0.04]">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Google Search Console
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          For Google indexing, use{" "}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300"
          >
            Search Console
          </a>{" "}
          to submit your sitemap and request indexing. The deprecated Google ping
          endpoint is no longer supported.
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          Sitemap URL:{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 text-[10px] text-zinc-400">
            https://www.summify.app/sitemap.xml
          </code>
        </p>
        {seoInfo?.sitemapGenerationMode === "build_deploy" && (
          <p className="mt-2 text-[11px] text-amber-300/90">Sitemap updates after deployment.</p>
        )}
      </Card>
    </div>
  );
}