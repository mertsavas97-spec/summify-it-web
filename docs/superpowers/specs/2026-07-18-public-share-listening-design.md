# Public share listening (Approach A)

**Date:** 2026-07-18  
**Status:** Approved (script + Play; tabs)

## Goal

Public `/share/[shareId]` should reflect what the owner produced:

1. If audio and/or podcast scripts exist in analysis metadata, expose them as share tabs and allow **Play** (synthesize on demand; no durable public MP3).
2. Always keep Summary / Learn / Mind Map.
3. If listening scripts are missing, show one-click **Generate Audio / Podcast** CTAs that send guests to login/signup with return-to-upload messaging (visitor generates their own analysis — shared row is not claimed).

## Data

Extend `PublicSharedAnalysis` with optional:

- `audioStudy: AudioStudyMetadata | null`
- `podcastDiscussion: PodcastDiscussionMetadata | null`

`getPublicSharedAnalysis` selects `metadata` and maps these fields. No raw source text.

## Tabs & default

| Present | Tabs | Default |
|---------|------|---------|
| Neither | Summary · Learn · Mind Map | Summary |
| Audio only | Audio · Summary · Learn · Mind Map | Audio |
| Podcast only | Podcast · Summary · Learn · Mind Map | Podcast |
| Both | Audio · Podcast · Summary · Learn · Mind Map | Audio |

## Play API

`POST /api/share/[shareId]/play`  
Body: `{ kind: "audio" | "podcast" }`

- Resolve public share by `share_id` + `is_public` **before** rate-limit / Polly
- Load matching script from metadata; 404 if missing
- Abuse controls:
  - HttpOnly cookie: **1 successful synth per browser / share / kind / 24h** (blocks refresh loops)
  - Rate limit IP+share+kind: audio **2/h**, podcast **1/h**
  - Rate limit IP global: **6 share-plays / h**
  - Rate limit shareId global: audio **24/h**, podcast **12/h** (viral share cap)
  - In-process **inflight dedupe** so concurrent clicks share one Polly run
- Client: sessionStorage + memory cache for “Play again”; disable while in-flight / blocked
- Upsell CTAs only navigate to login/upload — **no** generate APIs on the share page
- Synthesize via existing Polly helpers; return ephemeral audio
- No auth required; no write to owner row; no usage increment against owner quota

## UI

- Read-only share players (no regenerate / upgrade)
- Collapsible script transcript
- Upsell strip when a format is missing: login links with `returnTo=/upload?intent=audio|podcast`

## Out of scope

- Durable share-scoped MP3 storage / Redis distributed limits (in-memory + cookie is the current control plane)
- Claiming the shared analysis into the visitor account
- Generating new scripts on the share page
