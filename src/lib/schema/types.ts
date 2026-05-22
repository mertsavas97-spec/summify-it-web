export type JsonLdObject = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type ArticleSchemaInput = {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  articleSection?: string;
  keywords?: string[];
  authorName?: string;
  authorPath?: string;
  imagePath?: string;
};

export type SoftwareApplicationSchemaInput = {
  /** Page path for `url` (default `/`). */
  path?: string;
  description?: string;
  name?: string;
  /** Attach beta / pricing offers (pricing page). */
  includePricingOffers?: boolean;
};
