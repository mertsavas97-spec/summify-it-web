# Growth & distribution (SEO-C)

Scalable organic growth systems for Summify — premium UX, no spammy hacks, no automatic directory submissions.

## Product Hunt & launch kit

**Data:** `src/data/launch/producthunt.ts`

- `SUMMIFY_LAUNCH_KIT` — taglines, short/long copy, maker story, features, FAQ, CTA
- Helpers: `getLaunchTagline()`, `formatLaunchFeatureList()`, `getLaunchLongForm()`
- Platform-agnostic (no PH branding in product UI)

**Internal preview:** `/launch` (noindex) — copy blocks for makers and submissions.

**Strategy:**

1. Ship with one primary tagline + 30s demo GIF (workspace → summary → Learn cards).
2. Maker comment: beta access, privacy (no training on uploads), roadmap teaser.
3. Reply to every comment same day; link to `/upload` and one guide (PDF or YouTube).
4. Cross-post kit to Uneed using `uneed` entry in directory registry.

## AI directory strategy

**Data:** `src/data/distribution/directories.ts`

| Platform | Angle |
|----------|--------|
| Product Hunt | Knowledge workspace vs summarizer |
| Futurepedia / Toolify / TAAFT | Multi-format + modes |
| SaaSHub / AlternativeTo | Comparison-friendly positioning |
| AI Scout / Uneed | Beta + premium UX |

Per listing: `positioningAngle`, `shortDescription`, `category`, `ctaUrl`, `targetKeywords`, optional `submissionNotes`.

**Process:** Manual submission only. Reuse launch kit short description; tailor keywords per `getDirectoryListing(id)`. Link compare pages where relevant (`/compare/chatpdf`, etc.).

## Share-loop philosophy

Public share pages (`/share/[shareId]`) are **passive acquisition**:

- Show structured output only — never raw uploads.
- Subtle CTAs: upload source, practice with Learn/review guides.
- Sticky bottom strip after scroll (desktop-safe).
- End-of-page conversion block + “Generated with Summify”.
- Lightweight social: X, LinkedIn, copy link (`ShareSocialActions`).
- OG/social copy via `buildSharePageMetadata()` + `buildOgSocialCopy({ context: "share" })`.

**Do not:** popups, exit intent, fake urgency, or repeated modals.

## Analytics events

**Module:** `src/lib/analytics/events.ts`  
**Transport:** GA4 via `window.gtag` (`src/lib/analytics/ga.ts`)

| Event | When |
|-------|------|
| `upload_started` | File upload or analyze triggered |
| `analysis_completed` | Successful `/api/analyze` |
| `signup_started` | Auth action started (password, magic, Google) |
| `signup_completed` | Password session established |
| `share_enabled` | Public share toggled on |
| `share_opened` | Visitor loads `/share/[id]` |
| `review_started` | Memory review session mount |
| `review_completed` | Review queue finished |
| `pricing_opened` | Pricing page view |
| `upgrade_modal_opened` | Plan upgrade modal shown |
| `guide_cta_clicked` | CTA strip on guide/compare (`analyticsSurface`) |

**Requirements met:** Typed helpers, silent when GA disabled, try/catch — no production console noise, no UX crashes.

**Env:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## Launch banner system

**Config:** `src/data/announcements.ts` — `id`, `message`, `link`, `active`, `priority`  
**UI:** `AnnouncementBanner` (replaces static `PublicBetaBar` in `SiteShell`)  
**Persistence:** `localStorage` key `summify-announcement-dismissed-{id}`

Toggle campaigns by setting one announcement `active: true` (highest `priority` wins).

## OG image foundation

**Modules:** `src/lib/og/types.ts`, `templates.ts`, `share-metadata.ts`

- Gradients, typography tokens, card layout constants
- `OgImageSpec` + `mapToOgImageSpec()` for future static or `@vercel/og` generation
- Default image: `siteConfig.ogImage` until per-route images ship

## Beta feedback

**UI:** `FeedbackTrigger` + `FeedbackModal` (footer + optional inline)  
**External form:** `NEXT_PUBLIC_FEEDBACK_FORM_URL` (optional)  
**Fallback:** `mailto:hello@summify.app`  
**Also:** Report an issue link, status page link

## Creator / demo foundation

**Data:** `src/data/demos/workflows.ts`  
**UI:** `DemoWorkflowBlock` on upload sidebar (desktop)

Plug future influencer demos by adding workflows with `ctaHref` to share URLs or recorded Loom links.

## Trust signals

**Copy:** `TRUST_SIGNALS` in `src/lib/public-copy.ts`  
**UI:** `TrustSignals` compact (upload, share) and full variant

Messages: public beta, no training on private files, AI disclaimer, secure sharing.

## SEO + growth alignment

| Surface | Growth hook |
|---------|-------------|
| Guides | `CtaStrip` + `analyticsSurface=guide:{slug}` |
| Compare | `CtaStrip` + `compare:{slug}` |
| Share | Sticky CTA + conversion footer |
| Upload | Trust signals + demo workflows |
| Pricing | `PricingPageTracker` |
| Footer | Feedback entry |

Preserves SEO-A/B: metadata, schema, sitemap unchanged; `/launch` noindex.

## Future: affiliate & referral

Not implemented. Planned hooks:

- UTM params on share CTAs (`?ref=share`)
- Referral codes in `DIRECTORY_LISTINGS` CTA URLs post-launch
- GA4 custom dimension `referrer_surface`

Document decisions before adding Stripe or referral DB tables.

## Creator outreach

1. Offer read-only share links + `/launch` talking points.
2. Package: one PDF workflow, one YouTube workflow (`DEMO_WORKFLOWS`).
3. Provide compare snippet vs incumbent tool their audience uses.
4. No paid spam lists — target study/creator/research newsletters.

## Related docs

- `docs/SEO_ARCHITECTURE.md` — technical SEO
- `docs/SEO_CONTENT_STRATEGY.md` — content clusters
- `docs/SHARING_AND_EXPORTS.md` — share/export behavior
