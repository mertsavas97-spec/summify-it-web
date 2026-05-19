# SEO content strategy — Summify (Phase SEO-B)

This document describes the content architecture shipped in Phase SEO-B: programmatic landing pages, long-form guides, comparisons, use cases, and expanded mode copy — all wired into sitemap and internal linking.

## Goals

1. **Capture intent clusters** — format (PDF, YouTube, DOCX, web, audio), segment (students, creators, teams, freelancers, researchers), mode, and workflow (guides, use cases).
2. **Earn trust** — structured pages with visible FAQs aligned to JSON-LD, honest comparisons, and legal disclaimers on contract content.
3. **Crawl efficiently** — single registry (`src/lib/seo-paths.ts`) drives `sitemap.xml` and audits.
4. **Convert without bait** — every page routes to `/upload` with accurate beta positioning.

## Content tiers

| Tier | Path pattern | Purpose | Examples |
|------|----------------|---------|----------|
| Format landings | `/summarize-*` | Product-intent keywords per input type | PDF, YouTube, PPTX, web, DOCX, MP3 |
| Segment landings | `/for-*` | Audience workflows | students, creators, teams, freelancers, researchers |
| Mode pages | `/modes/[id]` | Semantic product pages + `ModeSeoExpansion` | Executive Brief, The Student, … |
| Guides | `/guides/[slug]` | Long-form evergreen (TOC, takeaways, FAQ) | PDF summarizer buyer guide, study notes |
| Blog | `/blog/[slug]` | Shorter editorial + cadence | Overlap with guides where useful |
| Compare | `/compare/[slug]` | Honest competitor positioning | ChatPDF, QuillBot, Notta |
| Use cases | `/use-cases/[slug]` | Programmatic workflow landings | research papers, contracts, podcasts, reports |

## Data and templates

- **Format:** `src/data/format-landings/` + `FormatLandingTemplate.tsx`
- **Guides:** `src/data/guides/registry.ts` + `GuideArticleLayout.tsx`
- **Compare:** `src/data/comparisons/registry.ts` + `ComparisonPageLayout.tsx`
- **Use cases:** `src/data/use-cases/registry.tsx` + `UseCaseLandingLayout.tsx`
- **Mode expansion:** `src/data/mode-seo-content.ts` + `ModeSeoExpansion.tsx`
- **Shared FAQs/links:** `src/data/landing-seo.ts`

## Metadata

All indexable routes use `buildPageMetadata()` via `src/lib/page-metadata.ts` presets or layout builders (`buildGuideMetadata`, `buildComparisonMetadata`, `buildUseCaseMetadata`).

## Schema

- Format pages: `BreadcrumbList` + `FAQPage` (visible FAQ block).
- Guides / compare: `FAQPage` where FAQs render on page.
- Blog: `BlogPosting`.
- Mode pages: existing breadcrumb + expansion FAQs.

## Internal linking model

```
Homepage
  → formats, segments, modes, upload
Formats
  → upload, modes, segments, guides, use cases
Segments
  → formats, modes, guides, use cases
Guides
  → formats, modes, blog (shorter), compare
Compare
  → upload, guides, formats
Use cases
  → formats, segments, modes
Footer + header nav (seo-nav.ts)
  → all clusters
```

Use `InternalTextLink` in body copy; `RelatedLinksSection` at page footers.

## Sitemap

`src/app/sitemap.ts` calls `getAllIndexablePaths()` from `src/lib/seo-paths.ts`, which unions:

- Static marketing paths
- Format paths (from `FORMAT_LANDINGS`)
- Segment paths
- Active mode paths
- Guide, compare, use case slugs
- Blog post paths

Excluded: `/dashboard`, `/account`, `/login`, `/auth`, `/api`, `/share/*`, billing.

## Content quality bar

- No invalid HTML/JSX elements in layouts (use semantic `div`, `section`, `article`, headings).
- FAQs: 4 per landing where specified; copy must match visible FAQ UI.
- Guides: TOC ids must match `h2 id` in body components.
- Comparisons: include Summify limitations, not only strengths.
- Contract/legal: `ProductDisclaimer` on freelancer and contract surfaces.

## Blog vs guides

| | Blog | Guides |
|---|------|--------|
| Length | Shorter (5–8 min) | Longer (10–14 min) |
| TOC | Optional via `post.toc` | Required in registry |
| Cadence | Dated posts | Evergreen, updated |
| Overlap | Allowed | Canonical depth |

Example pair: `ai-study-notes-guide`, `pdf-to-flashcards-workflow` exist on both `/blog/...` and `/guides/...` with cross-links.

## Phase SEO-C (future)

- Guides index page at `/guides`
- Compare index at `/compare`
- Use case index at `/use-cases`
- hreflang if locales launch
- `WebPage` schema on top landings if rich-result testing warrants
- Automated content QA (broken internal links, TOC id drift)

## Ownership

- **Engineering:** registries, templates, sitemap, schema wiring
- **Editorial:** guide/compare copy updates in `src/components/guides/*`, `src/components/comparisons/*`
- **Product marketing:** `landing-seo.ts`, `page-metadata.ts`, hero/CTA copy on segment pages

## QA checklist before release

- [ ] `npm run build` passes
- [ ] Sitemap URL count matches `getAllIndexablePaths().length`
- [ ] Sample pages: unique title/description/canonical
- [ ] FAQ JSON-LD only where FAQ section renders
- [ ] Footer links resolve (no 404)
- [ ] Mode expansion renders for all 5 active modes
