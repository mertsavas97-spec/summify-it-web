import type { MetadataRoute } from "next";
import { getSitemapBaseUrl } from "@/lib/sitemap/build-sitemap";
import { isIndexableHost, resolveRequestHost } from "@/lib/seo-host";
import { headers } from "next/headers";

/**
 * Crawl policy for public marketing site.
 * Sitemap URL uses `siteConfig.url` (NEXT_PUBLIC_SITE_URL → https://www.summify.app in production).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const hostname = resolveRequestHost({
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
  });
  const indexable = isIndexableHost(hostname);

  if (!indexable) {
    return {
      rules: {
        userAgent: "*",
        disallow: ["/"],
      },
    };
  }

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
