import type { MetadataRoute } from "next";
import { absoluteUrl, MARKETING_PATHS } from "@/lib/seo";
import { BLOG_POSTS } from "@/data/blog-posts";

/** Served at /sitemap.xml — URLs use NEXT_PUBLIC_SITE_URL via absoluteUrl(). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const marketing = MARKETING_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority:
      path === "/"
        ? 1
        : path === "/upload"
          ? 0.9
          : path.startsWith("/modes/")
            ? 0.7
            : path === "/blog"
              ? 0.75
              : 0.8,
  }));

  const blogPosts = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt ?? post.date),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...marketing, ...blogPosts];
}
