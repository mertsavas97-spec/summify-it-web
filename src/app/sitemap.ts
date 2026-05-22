import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap/build-sitemap";

/**
 * Dynamic sitemap — derived at build/deploy from blog posts, format landings,
 * intelligence modes, use cases, and core marketing routes.
 * Excludes dashboard, auth, API, and user-generated share URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
