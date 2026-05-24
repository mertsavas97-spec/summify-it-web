import type { Metadata } from "next";
import {
  absoluteUrl,
  buildCanonicalUrl,
  buildTwitterCard,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SEO_BRAND,
} from "./seo";
import { siteConfig } from "./site";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "",
  noIndex = false,
}: PageMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const canonicalPath = path || "/";
  const canonical = buildCanonicalUrl(canonicalPath);

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: siteConfig.name,
      title: pageTitle,
      description,
      images: [
        {
          url: absoluteUrl(siteConfig.ogImage),
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: "Summify AI Summary and Learn social preview",
        },
      ],
    },
    twitter: buildTwitterCard({
      title: title ?? SEO_BRAND,
      description,
    }),
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
