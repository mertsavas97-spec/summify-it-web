import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Crawl policy for summify.app
 * - Allow all public marketing pages
 * - Block app, auth, API, and user-generated share URLs
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/account",
        "/dashboard",
        "/dashboard/",
        "/billing/",
        "/share/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
