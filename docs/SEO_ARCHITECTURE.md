# SEO architecture — Summify

Phase SEO-A establishes technical and on-page SEO foundations without changing product flows or UI redesign.

## Metadata system

| Layer | Location | Role |
|-------|----------|------|
| Per-route presets | `src/lib/page-metadata.ts` | Title, description, keywords, canonical path |
| Builder | `src/lib/seo.ts` → `buildPageMetadata()` | OG, Twitter, robots, canonical |
| Legacy helper | `src/lib/metadata.ts` → `createPageMetadata()` | Auth/private pages (`noIndex`) |
| Site config | `src/lib/site.ts` | `NEXT_PUBLIC_SITE_URL`, default description |

**Rules**

- Marketing pages use `pageSeo.*` or `buildPageMetadata()` with a unique `path` for canonicals.
- Private routes (`/login`, `/account`, `/dashboard/*`) use `noindex: true`.
- User share URLs (`/share/*`) are **noindex** and excluded from sitemap (user-generated).

## JSON-LD schema strategy

Builders live in `src/lib/schema.ts` (re-exported from `src/lib/schema/index.ts`).  
Rendered via `src/components/seo/JsonLd.tsx` — server-safe `<script type="application/ld+json">`.

| Schema | Where applied |
|--------|----------------|
| `Organization` | Root layout |
| `WebSite` | Homepage |
| `SoftwareApplication` | Homepage (`summarifySoftwareApplicationSchema`) |
| `HowTo` | Homepage (`howToSummifySchema` + `src/data/seo-howto.ts`) |
| `FAQPage` | `/faq`, format pages (page FAQs) |
| `BreadcrumbList` | Mode detail, format landing pages |
| `Product` + `Offer` | `/pricing` (`productPricingSchema`) |
| `BlogPosting` | `/blog/[slug]` |

**No duplicate graphs on one page** — each type appears once per URL (FAQ on format pages matches visible FAQ block only).

## Sitemap strategy

- **File:** `src/app/sitemap.ts` → `/sitemap.xml`
- **Source:** `getIndexableMarketingPaths()` in `src/lib/seo.ts`
  - Static marketing routes
  - All **active** intelligence modes (`ACTIVE_INTELLIGENCE_MODE_IDS`)
  - Blog posts from `src/data/blog-posts.ts`
- **Excluded:** dashboard, auth, API, billing, share links

## Robots policy

- **File:** `src/app/robots.ts`
- **Allow:** `/` (public marketing)
- **Disallow:** `/api/`, `/auth/`, `/login`, `/account`, `/dashboard`, `/billing/`, `/share/`
- **Sitemap:** `{SITE_URL}/sitemap.xml`

## Canonical rules

- Every indexable page sets `alternates.canonical` via `buildPageMetadata({ path })`.
- `metadataBase` is set in root layout from `siteConfig.url` (`NEXT_PUBLIC_SITE_URL`).
- Production canonical host: `https://www.summify.app`

## Mode SEO philosophy

Mode pages are **semantic product pages**, not keyword dumps:

- Hero: lens + best-for sources
- Use cases grid (workflow-specific)
- 4-step workflow + internal links to format pages
- Example outputs + Learn preview
- BreadcrumbList JSON-LD

Inactive/preview modes remain `noindex` until `availability === "active"`.

## Format landing pages

`/summarize-pdf`, `/summarize-youtube-video`, `/summarize-powerpoint`:

- Rich hero + `SeoContentSection` + workflow + features + use cases
- FAQ block aligned with `FAQPage` schema
- `BreadcrumbList` + internal links to modes and audience pages

## Internal linking

Hub-and-spoke model:

```
Homepage → format pages, modes, FAQ, upload
Format pages → upload, modes, audience pages
Mode pages → upload, formats, pricing
FAQ / pricing → upload, privacy
```

Implemented via `RelatedLinksSection`, `InternalTextLink`, and footer/header nav (unchanged).

## Future expansion

### SEO-B (recommended next)

- Long-form mode pages (800–1200 words) for active modes only
- Comparison pages (e.g. “Summify vs …”) if editorially justified
- Blog cadence tied to format/mode clusters
- `WebPage` schema on major landings if rich results testing warrants it

### SEO-C (later)

- Programmatic share pages only if editorial policy allows indexing
- Hreflang if localized
- Core Web Vitals monitoring on `/upload` (keep workspace fast)
- Search Console integration + GA4 custom events for conversion funnels

## Verification checklist

1. View source on `/` — 3 JSON-LD blocks (WebSite, SoftwareApplication, HowTo)
2. [Google Rich Results Test](https://search.google.com/test/rich-results) on `/faq` and `/pricing`
3. Fetch `/sitemap.xml` — includes `/modes/general-summary` and format URLs
4. Fetch `/robots.txt` — disallows `/share/`
5. `npm run build` — no metadata or schema TypeScript errors
