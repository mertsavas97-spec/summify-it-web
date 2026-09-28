export type InternalCtaSource = "blog" | "guide" | "compare";

/**
 * Append a consistent UTM triple to internal CTA hrefs so GA4 can separate
 * on-page CTA clicks from organic landings.
 *
 * Idempotent: hrefs that are external or already carry `utm_` are returned
 * unchanged. Only same-origin path hrefs (`/...`) are tagged.
 *
 * Convention:
 *   utm_source   = surface the CTA lives on (blog | guide | compare)
 *   utm_medium   = internal_cta
 *   utm_campaign = placement id (blog_end, blog_inline, blog_workflow, guide_strip)
 */
export function withCtaUtm(
  href: string,
  source: InternalCtaSource,
  campaign: string,
): string {
  if (!href.startsWith("/") || href.includes("utm_")) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}utm_source=${source}&utm_medium=internal_cta&utm_campaign=${campaign}`;
}
