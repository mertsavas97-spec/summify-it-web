import { siteConfig } from "@/lib/site";
import { SUMMIFY_SOCIAL_SAME_AS } from "@/lib/social-links";
import { absoluteUrl, SEO_BRAND } from "@/lib/seo";
import type { FaqItem } from "@/data/faqs";
import type { BlogPost } from "@/data/blog-posts";
import { getBlogCategory } from "@/data/blog-categories";
import { PLAN_DEFINITIONS, PUBLIC_PRICING_PLAN_IDS } from "@/data/pricingPlans";
import type { PlanId } from "@/types/plan";

const ORGANIZATION_LOGO = "/brand-icon.png";

export type JsonLdObject = Record<string, unknown>;

const SOFTWARE_DESCRIPTION =
  "AI document intelligence workspace and summarizer for PDFs, YouTube videos, PowerPoint decks, web articles, DOCX, and TXT — with study notes, Learn cards, and mind maps.";

export type HowToStepInput = {
  name: string;
  text: string;
};

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
    sameAs: [...SUMMIFY_SOCIAL_SAME_AS],
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

/** Primary SoftwareApplication graph for homepage and product positioning. */
export function summarifySoftwareApplicationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SEO_BRAND,
    alternateName: "Summify AI Document Summarizer",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Document Intelligence",
    url: absoluteUrl("/"),
    description: SOFTWARE_DESCRIPTION,
    featureList: [
      "AI PDF summarizer",
      "YouTube transcript summarizer",
      "PowerPoint deck analysis",
      "29 intelligence modes",
      "Learn cards for study and recall",
      "Interactive mind maps",
      "Memory review scheduling",
    ],
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

/** @deprecated Alias — use `summarifySoftwareApplicationSchema`. */
export function softwareApplicationSchema(): JsonLdObject {
  return summarifySoftwareApplicationSchema();
}

/** HowTo schema for homepage workflow (matches visible steps). */
export function howToSummifySchema(steps: HowToStepInput[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to summarize documents with Summify",
    description:
      "Upload a PDF, video, deck, or article, choose an intelligence mode, and get structured AI analysis with Learn cards.",
    totalTime: "PT5M",
    tool: {
      "@type": "HowToTool",
      name: SEO_BRAND,
    },
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: absoluteUrl("/upload"),
    })),
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

export function formatPageBreadcrumbSchema(
  pageLabel: string,
  path: string,
): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: pageLabel, path },
  ]);
}

function planOffer(planId: PlanId): JsonLdObject | null {
  const plan = PLAN_DEFINITIONS[planId];
  const monthly = plan.billing?.monthly;
  if (!monthly) return null;

  return {
    "@type": "Offer",
    name: plan.name,
    description: plan.tagline,
    price: (monthly.amountCents / 100).toFixed(2),
    priceCurrency: "USD",
    url: absoluteUrl("/pricing"),
    availability: plan.comingSoon
      ? "https://schema.org/PreOrder"
      : "https://schema.org/InStock",
  };
}

/** Product + Offer graphs for the pricing page (public tiers only). */
export function productPricingSchema(): JsonLdObject {
  const offers = PUBLIC_PRICING_PLAN_IDS.map(planOffer).filter(
    (o): o is JsonLdObject => o != null,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${SEO_BRAND} Workspace`,
    description:
      "AI document intelligence plans for summarizing PDFs, YouTube videos, PowerPoint decks, and articles with Learn cards and memory review.",
    brand: {
      "@type": "Brand",
      name: SEO_BRAND,
    },
    url: absoluteUrl("/pricing"),
    offers: offers.length > 0 ? offers : [BETA_OFFER],
  };
}

function blogPublisher(): JsonLdObject {
  return {
    "@type": "Organization",
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(ORGANIZATION_LOGO),
    },
    sameAs: [...SUMMIFY_SOCIAL_SAME_AS],
  };
}

/** Article schema for blog posts (preferred for editorial SEO). */
export function blogArticleSchema(post: BlogPost): JsonLdObject {
  const path = `/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: post.author.href ? absoluteUrl(post.author.href) : absoluteUrl("/about"),
    },
    publisher: blogPublisher(),
    url: absoluteUrl(path),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path),
    },
    image: absoluteUrl(siteConfig.ogImage),
    keywords: [...post.tags, ...post.keywords].join(", "),
    articleSection: post.category,
    inLanguage: "en-US",
  };
}

/** @deprecated Prefer `blogArticleSchema` — kept as alias. */
export function blogPostingSchema(post: BlogPost): JsonLdObject {
  return blogArticleSchema(post);
}

export function blogPostFaqSchema(
  items: Array<{ q: string; a: string }>,
): JsonLdObject | null {
  if (items.length === 0) return null;
  return faqPageSchema(items);
}

export function blogPostBreadcrumbSchema(post: BlogPost): JsonLdObject {
  const category = getBlogCategory(post.categoryId);
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: category.name, path: `/blog/category/${category.slug}` },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
}

/** Combined JSON-LD graphs for a blog article page. */
export function blogPostJsonLdGraph(post: BlogPost): JsonLdObject[] {
  const graphs: JsonLdObject[] = [
    organizationSchema(),
    blogArticleSchema(post),
    blogPostBreadcrumbSchema(post),
  ];
  const faq = blogPostFaqSchema(post.faqs);
  if (faq) graphs.push(faq);
  return graphs;
}
