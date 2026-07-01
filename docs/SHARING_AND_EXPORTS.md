# Sharing & exports — Summify

Phase 9A adds export actions and optional public share links for **saved analyses** only. Anonymous `/upload` is unchanged.

## Export architecture

| Format | Implementation |
|--------|----------------|
| Copy as Markdown | `buildMarkdownExport()` → clipboard |
| Export as TXT | Plain-text derivative of markdown |
| Export as JSON | `summify-analysis-v1` schema (structured fields only) |
| Print / Save as PDF | `window.print()` + `@media print` styles |

**Location:** `src/lib/export/analysisExport.ts`  
**UI:** `AnalysisExportToolbar` on dashboard detail (`/dashboard/[id]`)

Exports include summary, insights, action items, and Learn cards. They never include raw uploaded files or extraction transcripts.

## Share system

### Database (`saved_analyses`)

| Column | Type | Purpose |
|--------|------|---------|
| `is_public` | `boolean` | Default `false` |
| `share_id` | `uuid` | Unique public slug (nullable) |
| `shared_at` | `timestamptz` | When sharing was enabled |

Migration: `docs/SUPABASE_MIGRATION_9A_SHARE.sql`

### Public URL

```
/share/{shareId}
```

`shareId` is a UUID generated when the owner enables sharing.

### Owner controls (dashboard detail)

- **Enable public share** — `PATCH /api/analyses/[id]/share` `{ "enabled": true }`
- **Copy share link** — client copies `{SITE_URL}/share/{shareId}`
- **Disable share** — `{ "enabled": false }` clears `share_id` and sets `is_public = false`

### Public page content

- Title, summary, key insights, risks, action items, Learn cards
- Source type + intelligence mode labels
- Summify branding + CTA (“Create your own analysis”)

**Excluded:** `user_id`, `source_label` (may reveal filenames), `metadata`, `provider_used`, raw uploads.

## Security model

| Rule | Enforcement |
|------|-------------|
| Share off by default | DB default + UI copy |
| Only owner toggles share | RLS `update` where `auth.uid() = user_id`; API checks session |
| Public read is read-only | No mutations on `/share/*`; anon `SELECT` only when `is_public` and `share_id` set |
| Private links 404 | `getPublicSharedAnalysis` filters `is_public = true`; `notFound()` otherwise |
| No raw file exposure | Only `summary` + `learn_cards` JSON stored/shared |

### RLS policies (after migration)

- `saved_analyses_select_own` — owner CRUD read
- `saved_analyses_select_public_share` — anon/authenticated read when public
- `saved_analyses_update_own` — owner can toggle share fields

Run `docs/SUPABASE_MIGRATION_9A_SHARE.sql` in Supabase SQL Editor.

## SEO (public shares)

`/share/[shareId]` uses `generateMetadata` with:

- Dynamic **title** from analysis
- **description** from summary preview
- **Open Graph** via `createPageMetadata`
- `robots: index` for live shares (set `noIndex: true` in metadata helper later if needed)

Invalid or private share IDs return `noIndex` metadata and 404 page.

## Local testing

1. Run `docs/SUPABASE_MIGRATION_9A_SHARE.sql` in Supabase.
2. Sign in → run analysis → open `/dashboard` → open a saved session.
3. **Export insight** toolbar: copy Markdown, download TXT/JSON, print preview.
4. **Enable public share** → copy link → open in incognito → verify content.
5. **Disable share** → same link should 404.
6. Confirm `/upload` works logged out.

## Production testing

1. Apply migration on production Supabase.
2. Deploy with existing env vars (`NEXT_PUBLIC_SITE_URL` drives share URLs).
3. Enable share on a saved analysis → copy `https://www.summify.app/share/{uuid}`.
4. Verify OG tags with a link preview debugger (Slack, iMessage, etc.).
5. Confirm disabled/private shares return 404.

## Future (not in 9A)

- DOCX export
- Password-protected shares
- `noindex` per-share toggle in DB
- Export from live workspace before save
