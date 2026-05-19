import { siteConfig } from "@/lib/site";
import { absoluteUrl, SEO_BRAND } from "@/lib/seo";
import type { FaqItem } from "@/data/faqs";
import type { BlogPost } from "@/data/blog-posts";

const ORGANIZATION_LOGO = "/brand-icon.png";

export type JsonLdObject = Record<string, unknown>;

const SOFTWARE_DESCRIPTION =
  "AI document intelligence workspace for PDFs, YouTube videos, PowerPoint decks, web articles, DOCX and TXT.";

const BETA_OFFER = {
  "@type": "Offer",
  price: "0",
  priceCurrency: "USD",
  description: "Free during public beta",
} as const;

export function organizationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    logo: absoluteUrl(ORGANIZATION_LOGO),
    description: siteConfig.description,
  };
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
  };
}

export function softwareApplicationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SEO_BRAND,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    url: absoluteUrl("/"),
    description: SOFTWARE_DESCRIPTION,
    offers: {
      ...BETA_OFFER,
      url: absoluteUrl("/upload"),
    },
    publisher: {
      "@type": "Organization",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
  };
}

export function webApplicationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${SEO_BRAND} Workspace`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/upload"),
    description:
      "Upload and analyze PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT with intelligence modes.",
    isPartOf: {
      "@type": "SoftwareApplication",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
    offers: BETA_OFFER,
  };
}

export function webPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
  };
}

export function faqPageSchema(items: FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function modeDetailBreadcrumbSchema(modeLabel: string, modeId: string): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Intelligence modes", path: "/modes" },
    { name: modeLabel, path: `/modes/${modeId}` },
  ]);
}

export function blogPostingSchema(post: BlogPost): JsonLdObject {
  const path = `/blog/${post.slug}`;
  const publisher = {
    "@type": "Organization" as const,
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject" as const,
      url: absoluteUrl(ORGANIZATION_LOGO),
    },
  };

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    author: {
      "@type": "Organization",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
    publisher,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(siteConfig.ogImage),
    keywords: post.tags.join(", "),
  };
}
