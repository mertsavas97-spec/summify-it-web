/**
 * Schema.org JSON-LD builders for Summify marketing pages.
 * Import from `@/lib/schema` or `@/lib/schema/index`.
 */
export type {
  ArticleSchemaInput,
  BreadcrumbItem,
  JsonLdObject,
  SoftwareApplicationSchemaInput,
} from "./types";
export type { HowToStepInput } from "../schema";
export { compactJsonLd } from "./serialize";
export {
  SCHEMA_CONTEXT,
  SUMMIFY_SOFTWARE_FEATURE_LIST,
  articleSchema,
  blogArticleSchema,
  blogCategoryBreadcrumbSchema,
  blogCategoryPageJsonLd,
  blogPostBreadcrumbSchema,
  blogPostFaqSchema,
  blogPostJsonLdGraph,
  blogPostingSchema,
  breadcrumbSchema,
  comparisonBreadcrumbSchema,
  comparisonPageJsonLd,
  faqPageSchema,
  formatPageBreadcrumbSchema,
  globalLayoutJsonLd,
  guideBreadcrumbSchema,
  guidePageJsonLd,
  howToSummifySchema,
  modeDetailBreadcrumbSchema,
  modePageJsonLd,
  organizationEntity,
  organizationSchema,
  pricingPageJsonLd,
  productPageJsonLd,
  productPricingSchema,
  softwareApplicationSchema,
  summarifySoftwareApplicationSchema,
  useCaseBreadcrumbSchema,
  useCasePageJsonLd,
  webApplicationSchema,
  webPageSchema,
  websiteSchema,
  workspaceSoftwareApplicationSchema,
} from "../schema";
