import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getAllIndexablePaths } from "@/lib/seo-paths";

/**
 * Production sitemap — all indexable marketing, guides, comparisons, use cases, modes, and blog.
 * Excludes: /dashboard, /account, /login, /auth, /api, /share (user-generated).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return getAllIndexablePaths().map((path) => ({
    url: absoluteUrl(path),
    lastModified:
      path.startsWith("/blog/") ? lastModified : lastModified,
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority:
      path === "/"
        ? 1
        : path === "/upload"
          ? 0.9
          : path.startsWith("/modes/")
            ? 0.7
            : path.startsWith("/guides/")
              ? 0.72
              : path.startsWith("/compare/")
                ? 0.68
              : path.startsWith("/use-cases/")
                ? 0.7
              : path === "/blog"
                ? 0.75
                : path.startsWith("/summarize-") || path.startsWith("/for-")
                  ? 0.85
                  : path.startsWith("/blog/")
                    ? 0.65
                    : 0.8,
  }));
}
