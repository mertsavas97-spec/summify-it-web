import type { MetadataRoute } from "next";
import { absoluteUrl, MARKETING_PATHS } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return MARKETING_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority:
      path === "/"
        ? 1
        : path === "/upload"
          ? 0.9
          : path.startsWith("/modes/")
            ? 0.7
            : 0.8,
  }));
}
