# SEO QA Checklist — Summify (summify.app)

Use this checklist before launch and after major marketing or blog changes.

## Brand & domain

- [ ] No **Summify.it** leftovers in public UI, metadata, or docs (server prompts may still reference legacy name — out of scope for SEO)
- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://summify.app` in production builds
- [ ] No Netlify preview URLs in canonicals, sitemap, or JSON-LD
- [ ] Canonical URLs use `https://summify.app` via `absoluteUrl()` / `buildCanonicalUrl()`

## Metadata

- [ ] Page titles ~50–60 characters where practical (brand suffix `| Summify` adds length)
- [ ] Meta descriptions ~145–160 characters where practical
- [ ] One **H1** per page (blog articles: title in `BlogArticleLayout`; index uses `PublicHero`)
- [ ] Blog index: title, description, canonical, OG/Twitter
- [ ] Blog posts: article-specific title, description, canonical, `og:type=article`, `publishedTime` / `modifiedTime`

## Open Graph & Twitter

- [ ] Default OG image: `public/og-default.png` at **1200×630**
- [ ] Absolute OG URL: `https://summify.app/og-default.png` (via `siteConfig.ogImage` + `absoluteUrl`)
- [ ] `twitter:card` = `summary_large_image`
- [ ] `twitter:site` and `twitter:creator` set (`@summifyapp` in `src/lib/seo.ts` — update when handle is confirmed)
- [ ] Regenerate OG after brand changes: `npm run generate:og`

## Structured data (JSON-LD)

- [ ] **Organization** on root layout
- [ ] **WebSite** + **SoftwareApplication** on homepage
- [ ] **WebApplication** on `/upload`
- [ ] **FAQPage** on pages using `FAQSection` with FAQs
- [ ] **BreadcrumbList** on mode detail pages
- [ ] **BlogPosting** on each `/blog/[slug]` article

## Sitemap & robots

- [ ] `/sitemap.xml` includes: home, upload, pricing, format pages, segment pages, modes hub, active mode pages, blog index, blog posts, about, faq, privacy, terms
- [ ] **Excluded** from sitemap: `/dashboard`, `/status` (noindex operational pages)
- [ ] `robots.txt` allows indexing of public marketing routes

## Internal links

- [ ] Blog articles link to `/summarize-pdf`, `/summarize-youtube-video`, `/for-students`, `/upload` where relevant
- [ ] Footer includes Blog, formats, segments, trust pages
- [ ] Landing pages use `RelatedLinksSection` / `InternalTextLink`

## Verification commands

```bash
# Lint & production build
npm run lint
npm run build

# Regenerate OG image (1200×630)
npm install
npm run generate:og
```

### Verify OG image

1. Open `public/og-default.png` — confirm 1200×630 and readable text.
2. Or: `file public/og-default.png` / Preview dimensions.
3. Share debugger: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator) with `https://summify.app/og-default.png`.

### Verify schema

1. View page source on `/`, `/faq`, and a blog post.
2. Search for `application/ld+json` — confirm `BlogPosting` on articles.
3. [Google Rich Results Test](https://search.google.com/test/rich-results) for sample URLs.

### Verify sitemap

1. Local: `npm run build && npm run start` → open `/sitemap.xml`
2. Confirm `/blog` and `/blog/best-ai-pdf-summarizers-2026` (and other slugs) appear with `https://summify.app` origin.
3. Confirm `/status` and `/dashboard` are **not** listed.

## Blog routes (Phase 6E.3)

| Route | Slug |
|-------|------|
| `/blog` | index |
| `/blog/best-ai-pdf-summarizers-2026` | Best AI PDF Summarizers in 2026 |
| `/blog/youtube-videos-into-study-notes` | YouTube → study notes |
| `/blog/students-ai-summarizers-exam-prep` | Students & exam prep |

Content source: `src/data/blog-posts.ts` (static, no CMS).
