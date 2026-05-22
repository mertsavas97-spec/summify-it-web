import type { MetadataRoute } from "next";
import { getSitemapBaseUrl } from "@/lib/sitemap/build-sitemap";

/**
 * Crawl policy for public marketing site.
 * Sitemap URL uses `siteConfig.url` (NEXT_PUBLIC_SITE_URL → https://summify.app in production).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSitemapBaseUrl();

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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
