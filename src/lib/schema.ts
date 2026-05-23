import { siteConfig } from "@/lib/site";
import { SUMMIFY_SOCIAL_SAME_AS } from "@/lib/social-links";
import { absoluteUrl, SEO_BRAND } from "@/lib/seo";
import { compactJsonLd } from "@/lib/schema/serialize";
import type {
  ArticleSchemaInput,
  BreadcrumbItem,
  JsonLdObject,
  SoftwareApplicationSchemaInput,
} from "@/lib/schema/types";
import type { FaqItem } from "@/data/faqs";
import type { BlogPost } from "@/data/blog-posts";
import { getBlogCategory } from "@/data/blog-categories";
import type { BlogCategory } from "@/data/blog-categories";
import { PLAN_DEFINITIONS, PUBLIC_PRICING_PLAN_IDS } from "@/data/pricingPlans";
import type { PlanId } from "@/types/plan";

export type {
  ArticleSchemaInput,
  BreadcrumbItem,
  JsonLdObject,
  SoftwareApplicationSchemaInput,
} from "@/lib/schema/types";

export const SCHEMA_CONTEXT = "https://schema.org";

const ORGANIZATION_LOGO = "/brand-icon.png";

export const SUMMIFY_SOFTWARE_FEATURE_LIST = [
  "PDF summaries",
  "PPTX analysis",
  "YouTube summaries",
  "Web article summaries",
  "Learn cards",
  "Practice sessions",
  "Quiz workflows",
  "Audio Study Mode",
  "Voice study lessons",
  "Teacher-style audio learning",
  "Source-first learning intelligence",
] as const;

const DEFAULT_SOFTWARE_DESCRIPTION =
  "AI document intelligence workspace and study companion for PDFs, YouTube, PowerPoint, web articles, DOCX, and TXT — with Learn cards, quizzes, and teacher-style audio study lessons.";

export type HowToStepInput = {
  name: string;
  text: string;
};

const BETA_OFFER: JsonLdObject = {
  "@type": "Offer",
  price: "0",
  priceCurrency: "USD",
  description: "Free during public beta",
  url: absoluteUrl("/upload"),
};

function withContext(node: JsonLdObject): JsonLdObject {
  return compactJsonLd({
    "@context": SCHEMA_CONTEXT,
    ...node,
  });
}

/** Organization entity without @context (for nesting under publisher). */
export function organizationEntity(): JsonLdObject {
  return compactJsonLd({
    "@type": "Organization",
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(ORGANIZATION_LOGO),
    },
    description: siteConfig.description,
    sameAs: [...SUMMIFY_SOCIAL_SAME_AS],
  });
}

export function organizationSchema(): JsonLdObject {
  return withContext(organizationEntity());
}

export function websiteSchema(): JsonLdObject {
  return withContext({
    "@type": "WebSite",
    name: SEO_BRAND,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    publisher: organizationEntity(),
  });
}

/** Global graphs for root layout (Organization + WebSite). */
export function globalLayoutJsonLd(): JsonLdObject[] {
  return [organizationSchema(), websiteSchema()];
}

function pricingPlanOffers(): JsonLdObject[] {
  return PUBLIC_PRICING_PLAN_IDS.map(planOffer).filter((o): o is JsonLdObject => o != null);
}

function planOffer(planId: PlanId): JsonLdObject | null {
  const plan = PLAN_DEFINITIONS[planId];
  const monthly = plan.billing?.monthly;
  if (!monthly) return null;

  return compactJsonLd({
    "@type": "Offer",
    name: plan.name,
    description: plan.tagline,
    price: (monthly.amountCents / 100).toFixed(2),
    priceCurrency: "USD",
    url: absoluteUrl("/pricing"),
    availability: plan.comingSoon
      ? "https://schema.org/PreOrder"
      : "https://schema.org/InStock",
  });
}

/**
 * SoftwareApplication — primary product schema for marketing and format pages.
 * No aggregateRating or review fields.
 */
export function softwareApplicationSchema(
  input: SoftwareApplicationSchemaInput = {},
): JsonLdObject {
  const path = input.path ?? "/";
  const offers = input.includePricingOffers
    ? pricingPlanOffers()
    : [BETA_OFFER];

  return withContext(
    compactJsonLd({
      "@type": "SoftwareApplication",
      name: input.name ?? SEO_BRAND,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      url: absoluteUrl(path),
      description: input.description ?? DEFAULT_SOFTWARE_DESCRIPTION,
      featureList: [...SUMMIFY_SOFTWARE_FEATURE_LIST],
      offers: offers.length === 1 ? offers[0] : offers,
      publisher: organizationEntity(),
    }),
  );
}

/** @deprecated Alias — use `softwareApplicationSchema`. */
export function summarifySoftwareApplicationSchema(
  input?: SoftwareApplicationSchemaInput,
): JsonLdObject {
  return softwareApplicationSchema(input);
}

export function howToSummifySchema(steps: HowToStepInput[]): JsonLdObject {
  return withContext({
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
  });
}

/** Workspace page graph — SoftwareApplication scoped to /upload. */
export function workspaceSoftwareApplicationSchema(): JsonLdObject {
  return softwareApplicationSchema({
    path: "/upload",
    description:
      "Upload and analyze PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT with intelligence modes, Learn cards, and quizzes.",
  });
}

/** @deprecated Prefer `workspaceSoftwareApplicationSchema`. */
export function webApplicationSchema(): JsonLdObject {
  return workspaceSoftwareApplicationSchema();
}

export function webPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): JsonLdObject {
  return withContext({
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SEO_BRAND,
      url: absoluteUrl("/"),
    },
  });
}

export function faqPageSchema(items: FaqItem[]): JsonLdObject {
  if (items.length === 0) {
    return withContext({ "@type": "FAQPage", mainEntity: [] });
  }
  return withContext({
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  });
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
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

export function modeDetailBreadcrumbSchema(modeLabel: string, modeId: string): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Intelligence modes", path: "/modes" },
    { name: modeLabel, path: `/modes/${modeId}` },
  ]);
}

export function guideBreadcrumbSchema(guideTitle: string, slug: string): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: guideTitle, path: `/guides/${slug}` },
  ]);
}

export function comparisonBreadcrumbSchema(title: string, slug: string): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare/chatpdf" },
    { name: title, path: `/compare/${slug}` },
  ]);
}

export function useCaseBreadcrumbSchema(title: string, path: string): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: title, path },
  ]);
}

export function blogCategoryBreadcrumbSchema(category: BlogCategory): JsonLdObject {
  return breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: category.name, path: `/blog/category/${category.slug}` },
  ]);
}

/** Article schema for blog posts and long-form guides. */
export function articleSchema(input: ArticleSchemaInput): JsonLdObject {
  const keywords =
    input.keywords && input.keywords.length > 0 ? input.keywords.join(", ") : undefined;

  return withContext(
    compactJsonLd({
      "@type": "Article",
      headline: input.headline,
      description: input.description,
      datePublished: input.datePublished,
      dateModified: input.dateModified,
      author: {
        "@type": "Person",
        name: input.authorName ?? `${SEO_BRAND} Editorial`,
        url: absoluteUrl(input.authorPath ?? "/about"),
      },
      publisher: organizationEntity(),
      url: absoluteUrl(input.path),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": absoluteUrl(input.path),
      },
      image: absoluteUrl(input.imagePath ?? siteConfig.ogImage),
      articleSection: input.articleSection,
      inLanguage: "en-US",
      keywords,
    }),
  );
}

export function blogArticleSchema(post: BlogPost): JsonLdObject {
  return articleSchema({
    path: `/blog/${post.slug}`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt,
    articleSection: post.category,
    keywords: [...post.tags, ...post.keywords],
    authorName: post.author.name,
    authorPath: post.author.href,
  });
}

/** @deprecated Prefer `blogArticleSchema`. */
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

/** Product + Offer graphs for pricing (real plan tiers only). */
export function productPricingSchema(): JsonLdObject {
  const offers = pricingPlanOffers();

  return withContext({
    "@type": "Product",
    name: `${SEO_BRAND} Workspace`,
    description:
      "AI document intelligence plans for summarizing PDFs, YouTube videos, PowerPoint decks, and articles with Learn cards, practice, and quizzes.",
    brand: {
      "@type": "Brand",
      name: SEO_BRAND,
    },
    url: absoluteUrl("/pricing"),
    offers: offers.length > 0 ? offers : [BETA_OFFER],
  });
}

/**
 * Standard product landing JSON-LD: SoftwareApplication + BreadcrumbList.
 */
export function productPageJsonLd(input: {
  path: string;
  pageTitle: string;
  description?: string;
}): JsonLdObject[] {
  return [
    softwareApplicationSchema({
      path: input.path,
      description: input.description,
    }),
    formatPageBreadcrumbSchema(input.pageTitle, input.path),
  ];
}

/** SEO landing-page graph: SoftwareApplication + Breadcrumb + optional FAQ + optional HowTo. */
export function seoLandingPageJsonLd(input: {
  path: string;
  pageTitle: string;
  description: string;
  faqs?: FaqItem[];
  howToSteps?: HowToStepInput[];
}): JsonLdObject[] {
  const graphs: JsonLdObject[] = [
    softwareApplicationSchema({
      path: input.path,
      description: input.description,
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: input.pageTitle, path: input.path },
    ]),
  ];

  if (input.faqs && input.faqs.length > 0) {
    graphs.push(faqPageSchema(input.faqs));
  }

  if (input.howToSteps && input.howToSteps.length > 0) {
    graphs.push(howToSummifySchema(input.howToSteps));
  }

  return graphs;
}

/** Pricing page: SoftwareApplication with plan offers, Product, breadcrumbs. */
export function pricingPageJsonLd(): JsonLdObject[] {
  return [
    softwareApplicationSchema({
      path: "/pricing",
      includePricingOffers: true,
    }),
    productPricingSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]),
  ];
}

/** Mode detail: SoftwareApplication + breadcrumbs. */
export function modePageJsonLd(modeLabel: string, modeId: string, description: string): JsonLdObject[] {
  return [
    softwareApplicationSchema({
      path: `/modes/${modeId}`,
      description,
    }),
    modeDetailBreadcrumbSchema(modeLabel, modeId),
  ];
}

export function guidePageJsonLd(guide: {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  faqs: FaqItem[];
}): JsonLdObject[] {
  const graphs: JsonLdObject[] = [
    articleSchema({
      path: `/guides/${guide.slug}`,
      headline: guide.title,
      description: guide.description,
      datePublished: guide.date,
      dateModified: guide.updatedAt ?? guide.date,
      articleSection: guide.category,
      keywords: guide.tags,
    }),
    guideBreadcrumbSchema(guide.title, guide.slug),
    softwareApplicationSchema({ path: `/guides/${guide.slug}` }),
  ];
  if (guide.faqs.length > 0) {
    graphs.push(faqPageSchema(guide.faqs));
  }
  return graphs;
}

export function comparisonPageJsonLd(config: {
  slug: string;
  title: string;
  description: string;
  date: string;
  faqs: FaqItem[];
}): JsonLdObject[] {
  const graphs: JsonLdObject[] = [
    softwareApplicationSchema({
      path: `/compare/${config.slug}`,
      description: config.description,
    }),
    comparisonBreadcrumbSchema(config.title, config.slug),
    articleSchema({
      path: `/compare/${config.slug}`,
      headline: config.title,
      description: config.description,
      datePublished: config.date,
      dateModified: config.date,
      articleSection: "Comparisons",
    }),
  ];
  if (config.faqs.length > 0) {
    graphs.push(faqPageSchema(config.faqs));
  }
  return graphs;
}

export function useCasePageJsonLd(config: {
  path: string;
  title: string;
  description: string;
  faqs: FaqItem[];
}): JsonLdObject[] {
  const graphs: JsonLdObject[] = [
    softwareApplicationSchema({ path: config.path, description: config.description }),
    useCaseBreadcrumbSchema(config.title, config.path),
  ];
  if (config.faqs.length > 0) {
    graphs.push(faqPageSchema(config.faqs));
  }
  return graphs;
}

export function blogCategoryPageJsonLd(category: BlogCategory): JsonLdObject[] {
  return [
    webPageSchema({
      name: category.seoTitle,
      description: category.seoDescription,
      path: `/blog/category/${category.slug}`,
    }),
    blogCategoryBreadcrumbSchema(category),
  ];
}

/** Blog article graphs (Article, breadcrumbs, optional FAQ). Organization/WebSite are global in layout. */
export function blogPostJsonLdGraph(post: BlogPost): JsonLdObject[] {
  const graphs: JsonLdObject[] = [blogArticleSchema(post), blogPostBreadcrumbSchema(post)];
  const faq = blogPostFaqSchema(post.faqs);
  if (faq) graphs.push(faq);
  return graphs;
}
