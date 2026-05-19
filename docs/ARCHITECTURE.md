# Summify.it Architecture

Summify.it is an **adaptive document intelligence workspace**—not a thin wrapper around a single LLM prompt. The system ingests long documents, builds a compressed knowledge layer, routes persona-based analysis across providers, defers Learn asset generation, and tracks usage for monetization.

This document describes the target architecture and what is **implemented today**. Phase 4A–4E plus **5A YouTube** and **5B PPTX** deliver file extraction (PDF/DOCX/TXT/PPTX), web article URL extraction, YouTube transcript extraction, Groq/Gemini analysis, and a server-side **adaptive intelligence layer** before provider calls. Auth, database, provider-neutral billing, and full chunking are evolving in phases.

---

## Product pipeline

The end-to-end intelligence pipeline:

```
upload
  → extract
  → clean
  → document profile
  → compressed knowledge layer
  → persona-based analysis
  → deferred Learn generation
  → cache
  → usage tracking
  → telemetry / analytics
```

| Stage | Responsibility | Current implementation |
|-------|----------------|------------------------|
| **Upload** | File, pasted text, article URL, or YouTube link | `UploadWorkspace` tabs → extract APIs |
| **Extract** | Files, articles, YouTube transcripts, or PPTX decks → text | `extractFromFile()` · `extractFromPptx()` · `extractFromUrl()` · `extractFromYouTube()` · `/api/extract*` |
| **Clean** | Normalize whitespace, strip noise | `cleanText()` in extraction |
| **Profile** | Type guess, complexity, structure, chunking flag | `profileDocument()` in `src/server/intelligence/` |
| **Knowledge** | Compact sections, topics, entities (heuristic) | `buildKnowledgeLayer()` — **no second AI call** |
| **Compact** | Shrink prompt payload by pipeline type | `compactPromptInput()` |
| **Plan** | Pipeline + output/learn depth | `createAdaptiveAnalysisPlan()` |
| **Analyze** | Groq primary, Gemini fallback, JSON validation | `runAnalysisOrchestrator()` · `POST /api/analyze` |
| **Learn** | Study cards inside analysis JSON | Provider `learnCards` field (deferred queue TBD) |
| **Cache / Usage / Telemetry** | Monetization & ops | `src/core/*` mocks only |

Production analyze path: `prepareAnalysisIntelligence()` → compacted prompt → Groq/Gemini. Legacy `runPipelineMock()` in `src/core/pipeline/` remains for typed demos only.

---

## Code layout

```
src/
  core/
    types/           # Shared pipeline types
    documents/       # DocumentInput creation
    extraction/      # Extract + clean
    profiling/       # DocumentProfile
    knowledge/       # KnowledgeLayer compression
    analysis/        # Persona routing + analysis jobs
    learn/           # Deferred Learn cards
    providers/       # Future provider adapters (stubs)
    usage/           # Usage events
    cache/           # Cache lookup / seed
    telemetry/       # Analytics events
    pipeline/        # Full mock orchestration
    api/             # Typed API response shapes
  data/
    personas.ts
    analysisModes.ts
    providerRoutes.ts
    fileTypes.ts
    pipelineStages.ts
    pricingPlans.ts
  server/
    extraction/      # PDF, DOCX, TXT, PPTX, URL, YouTube (RapidAPI transcript)
    intelligence/    # Profile, knowledge layer, compaction (Phase 4C)
    ai/              # Groq, Gemini, orchestrator, prompts
  app/api/
    extract/route.ts
    extract-url/route.ts
    extract-youtube/route.ts
    analyze/route.ts
    learn/route.ts
```

---

## Web article URL extraction (Phase 4E)

**Location:** `src/server/extraction/url.ts` · `POST /api/extract-url`

### Flow

1. Client sends `{ url }` (http/https only).
2. Server validates URL and blocks SSRF targets (localhost, private IPs, `.local`, credentials in URL).
3. `fetch` with timeout, redirect cap, and max HTML size (2 MB).
4. **Cheerio** parses HTML: strips chrome (nav/footer/scripts), targets `article`/`main`/content selectors, collects headings and paragraphs, and uses meta title/description when present.
5. `cleanText()`, length limits, and profiling — same caps as file extraction.
6. Extracted text is passed to the existing `POST /api/analyze` pipeline (no separate analyze path).

### Safety controls

| Control | Behavior |
|---------|----------|
| Protocol | `http:` and `https:` only |
| Host blocklist | localhost, loopback, link-local, metadata hosts, `.local` |
| Private IPv4 | Rejected when hostname is a literal private/reserved address |
| Redirects | Manual follow (max 5); each hop re-validated |
| Timeout | 20s fetch abort |
| HTML size | 2 MB max download |
| Text length | Same 100 min / 24k max as files |

### Workspace UI

Upload workspace tabs: **File** · **Text** · **Web URL** · **YouTube**. File tab accepts PDF, DOCX, TXT, and **PPTX** via `POST /api/extract`. URL tab calls `/api/extract-url`; YouTube tab calls `/api/extract-youtube`. All fill the analysis workspace; **Run analysis** uses the same `/api/analyze` path.

Preview panel shows **Web Article**, title, site, URL, reading time, and characters; adaptive profile appears after analysis.

---

## YouTube transcript extraction (Phase 5A)

**Location:** `src/server/extraction/youtube.ts` · `POST /api/extract-youtube`

### Flow

1. Client sends `{ url }` (YouTube watch, youtu.be, or Shorts URL).
2. Server validates host allowlist (`youtube.com`, `youtu.be`, etc.) and extracts an 11-character video ID. Localhost/private hosts are rejected.
3. Server calls **RapidAPI youtube-transcript3** (or compatible host) with `RAPIDAPI_KEY` and `RAPIDAPI_HOST` — **never exposed to the browser**.
4. Transcript segments are normalized to readable text; optional `[m:ss]` timestamps are preserved when the API provides offsets.
5. `cleanText()`, same min/max character limits as files (100 min / 24k max), and profiling.
6. Extracted text feeds `POST /api/analyze` with optional `sourceHint: "youtube"` for transcript-aware prompting and document-type classification.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `RAPIDAPI_KEY` | Yes | RapidAPI authentication |
| `RAPIDAPI_HOST` | Yes | API hostname (e.g. `youtube-transcript3.p.rapidapi.com`) — configurable per provider listing |
| `RAPIDAPI_YOUTUBE_PATH` | No | API path override (default `/api/transcript`; query `videoId`) |

### Safety controls

| Control | Behavior |
|---------|----------|
| No media download | Transcript API only — no video/audio files fetched or stored |
| Host allowlist | Only YouTube domains; no arbitrary URL fetch |
| Timeout | 25s abort on RapidAPI call |
| Transcript length | Same 24k analysis cap as files; truncation flagged in metadata |
| Keys | Server-side only; not bundled in client |

### Intelligence tuning

When `sourceHint` is `youtube`, profiling prefers transcript document types: **Video / Podcast / Lecture / Interview / Tutorial Transcript** (keyword heuristics). `compactPromptInput()` adds spoken-source context (filler, repetition, organize into structured insight).

### Workspace UI

**YouTube** tab: URL input → **Extract transcript** → preview panel shows video ID, segments, duration (if available), reading time, and characters. Same **Run analysis** flow as other sources.

### Why audio is still separate (future)

- **Audio uploads** require ASR (Whisper-class) pipelines, duration limits, speaker diarization, and different cost/latency profiles than caption APIs.
- YouTube Phase 5A uses existing captions/transcripts only; general audio ingestion remains a future phase.

---

## PPTX presentation extraction (Phase 5B)

**Location:** `src/server/extraction/pptx.ts` · `POST /api/extract` (`.pptx` branch)

### Flow

1. Client uploads `.pptx` via the **File** tab (`multipart/form-data`, field `file`).
2. Server validates extension/MIME, size (10 MB), and timeout (30s).
3. `jszip` opens the OOXML archive; slide order comes from `ppt/presentation.xml` + relationship map.
4. Per-slide text is extracted from slide XML (`a:t` nodes); optional speaker notes from `ppt/notesSlides/`.
5. Output is merged as ordered slide blocks (`--- Slide N: Title ---`) then `cleanText()` and the same 100 / 24k character limits as other sources.
6. Response metadata uses `sourceKind: "presentation"` (slide count, detected titles, repeated themes, outline preview).
7. Analysis sends `sourceHint: "presentation"` + `sourceContext` for deck-aware profiling, knowledge layer, and prompts.

### Libraries

| Package | Role |
|---------|------|
| `jszip` | Read PPTX ZIP archive server-side; slide text via OOXML `a:t` nodes |

### Document type guesses (presentations)

Heuristic classification includes: **presentation_deck**, **pitch_deck**, **strategy_deck**, **marketing_deck**, **lecture_deck**, **report_deck** — using slide markers, titles, and deck vocabulary (agenda, KPI, problem/solution, learning objectives, etc.).

### Limitations (intentional)

| Not included | Notes |
|--------------|-------|
| **Keynote `.key`** | Out of scope for Phase 5B |
| **Visual slide analysis** | No thumbnails, charts, or image OCR — text and notes only |
| **Animations / speaker video** | Not extracted |
| **Legacy `.ppt`** | Binary format not supported — `.pptx` only |

### Workspace UI

Preview panel: **Presentation Deck** label, slide count, titles detected, repeated themes, reading time, characters, and a compact **slide outline** (first 5 slides). No full slide viewer yet.

---

## Adaptive intelligence layer (Phase 4C)

**Location:** `src/server/intelligence/` (server-only; never import in client components).

Before any provider call, `prepareAnalysisIntelligence(rawText, mode)` runs:

1. **Clean** — reuse `cleanText()` from extraction.
2. **Profile** — `profileDocument()` + `classifyDocumentType()`: rich type guess, complexity, structure, source quality, reading time, signals, suggested mode, `needsChunking`.
3. **Knowledge layer** — `buildKnowledgeLayer()` builds a deterministic intermediate representation: title guess, compressed overview, ranked key sections with excerpts, topics, named entities, template questions, warnings. No extra LLM round trip.
4. **Token budget** — `estimateTokenBudget()` approximates tokens as `characters / 4`, sets input/output budgets from `AI_CONFIG`, and assigns risk `low | medium | high` for internal warnings and UI.
5. **Adaptive plan** — `createAdaptiveAnalysisPlan()` chooses:
   - `short_direct` — full cleaned text + profile + knowledge (docs ≤ ~4k chars, low complexity).
   - `medium_compacted` — knowledge layer + important excerpts + partial raw text.
   - `long_preview` — knowledge layer + small raw excerpt + explicit “chunking later” warning.
6. **Prompt compaction** — `compactPromptInput()` assembles the user message actually sent to Groq/Gemini.

`/api/analyze` returns slim metadata only: `profile`, `knowledgeLayerSummary` (counts + short preview), `tokenBudget`, `adaptivePlan`. Full knowledge blobs and compacted prompts stay server-side.

Client types: `src/types/intelligence.ts`.

### Token compaction rules

| Pipeline | Raw text in prompt | Knowledge layer | Quality stance |
|----------|-------------------|-----------------|----------------|
| `short_direct` | Full cleaned text (within cap) | Included | Conservative — same as pre-4C for short docs |
| `medium_compacted` | ~45% of max input cap | Primary structure | Relies on sections + excerpt grounding |
| `long_preview` | ~30% cap, hard-truncated | Primary structure | Brief output; risks note incomplete coverage |

High token risk can downgrade `short_direct` → `medium_compacted`. Server logs a warning when risk is `high`.

### Future chunking path

When `profile.needsChunking` is true (typically >12k chars or high complexity + >8k):

- Today: `long_preview` pipeline + `needsChunking` warning in knowledge layer.
- Next: split cleaned text into overlapping chunks, profile each chunk, merge knowledge layers, map-reduce or hierarchical analysis, cite chunk IDs in UI.

Do not expose internal chunk text in API responses until citation UX exists.

---

## Intelligence mode engine (Phase 5C)

**Registry (client-safe):** `src/types/modes.ts` · `src/config/modes.ts` · `src/lib/mode-groups.ts` · `src/lib/mode-resolver.ts`

**Routing (server-only):** `src/server/intelligence/mode-routing.ts`

### Architecture

29 specialized modes are declared in a single registry. Each mode has metadata (category, icon, availability, lens copy, learn weighting, recommended sources). **Four backend families** reuse existing prompts — `executive`, `academic`, `creator`, `legal` (contract/policy summary lens) — so there are not 29 separate prompt stacks.

```
Client IntelligenceModeId (e.g. the-creator)
  → POST /api/analyze { mode: "the-creator" }
  → resolveModeRouting() → backendFamily + promptAdjunct + learnWeighting
  → assertModeIsRunnable() (active modes only)
  → Groq/Gemini system prompt (family lens + small adjunct)
  → buildLearnIntelligence(learnWeighting via buildLearnKindTargets)
```

| Active mode (API id) | Backend family |
|---------------------|----------------|
| `executive-brief` | executive |
| `the-student` | academic |
| `the-creator` | creator |
| `contract-analyzer` | legal |

All other modes are `locked` or `coming_soon`: visible in `IntelligenceModeSelector`, no analyze execution. Legacy API strings `executive` / `academic` / `creator` / `legal` map to the active ids above.

**UI:** `IntelligenceModeSelector` — searchable command-palette modal grouped by category, hover preview, Pro/Soon badges. Smart Template personas still map to the same four families via `legacyFamilyToModeId()`.

**Future:** Flip `availability` to `active` per mode; add analytics hooks on `intelligenceModeId`; optional A/B on families — no schema change required.

---

## Prompt calibration & response quality (Phase 4D)

**Location:** `src/server/ai/prompts.ts`, `normalize-response.ts`, `validate-response.ts`.

After compaction (4C), the **system prompt** applies a mode-specific analysis lens and learn-card guidance. The same JSON shape is used for all modes; differentiation is in instructions, not schema.

### Mode-specific lenses

| Mode | Lens focus |
|------|------------|
| **executive** | Decisions, risks, opportunities, next actions, business implications |
| **academic** | Thesis, arguments, concepts, evidence, study value |
| **creator** | Hooks, story angles, audience relevance, repurposing, emotional/viral potential (when supported) |
| **legal** | Contract and policy summaries, clauses, obligations, risk signals, points to review |

Each mode includes tailored **learn card** guidance (e.g. executive → business concepts / why decisions matter; legal-family → obligations / definitions / points to review).

### Anti-generic guardrails

Embedded in every system prompt:

- No generic productivity filler unless the document supports it
- No invented external facts
- No repeated points across summary, insights, and learn cards
- Prefer concrete nouns from the source
- Thin or unclear documents → state gaps in `risksOrWarnings`

`JSON_OUTPUT_CONTRACT` is shared by Groq and Gemini so fallback does not drift format.

### Response normalization

After JSON parse + validation, `normalizeAnalysisResult()` runs **without a second AI call**:

- Trim and drop empty list items
- Deduplicate list entries (case-insensitive)
- Cap lengths: insights 6, risks 5, actions 6, learn cards 5
- Validate learn card `type`, `title`, `content`

### Provider parity

- **Groq:** system + user messages, `response_format: json_object`
- **Gemini:** `systemInstruction` + user content, `responseMimeType: application/json`

Both receive the same compacted user payload from the intelligence layer.

### Dev-only debug

When `NODE_ENV === "development"`, `/api/analyze` includes optional `debug`: `selectedMode`, `pipelineType`, `tokenRisk`, `providerUsed`, `fallbackUsed`. Compacted prompts are never exposed.

---

## Analysis intelligence upgrade (Phase 5A)

**Goal:** Richer deterministic profiling and less generic AI output — without a second model call or large token increases.

### Document type detection

`classifyDocumentType()` in `src/server/intelligence/documentTypes.ts` scores keyword and structure signals across:

`marketing_deck`, `strategy_deck`, `business_report`, `research_paper`, `legal_contract`, `policy_document`, `meeting_notes`, `educational_material`, `article`, `creator_brief`, `unknown`.

Signals include legal/academic/business terms, deck-like language (slides, bullets), meeting/action language, campaign/brief vocabulary, and web-article cues. Friendly labels (e.g. **Marketing Deck**, **Research Paper**) map via `formatDocumentTypeLabel()` for the preview panel (`src/lib/document-type-labels.ts`).

`profileDocument()` also sets `sourceQuality`: `ok` | `thin` | `fragmented` with an optional `sourceQualityNote` for UI and prompts.

### Source grounding

- **Knowledge layer:** entities, section headings, distinctive phrases (quotes, figures).
- **Compacted prompt:** `SOURCE GROUNDING` block lists entities, sections, phrases; bans vague corporate filler unless in source.
- **System prompt:** requires concrete nouns, brands, dates; bans generic “engaging experience” style phrasing unless literal in the document.

### Risk grounding

System and compaction instruct the model to:

- Tie each risk to the document; use `Potential risk:` when inferred.
- Avoid generic logistics/compliance risks unless the source mentions those topics.
- Use `The source does not provide enough risk signals.` when appropriate.
- Surface thin/fragmented source quality in `risksOrWarnings`.

### Learn dedupe & cross-section normalization

`normalizeAnalysisResult()` (no second AI call):

- Dedupes list items and drops lines that mostly repeat the summary (token overlap heuristic).
- Filters learn cards that paraphrase the summary; dedupes by title and content.
- Strips insights dominated by banned generic phrases.
- Preserves learn-card type roles (concept / why / memory_hook / quiz).

### Creator mode

Creator lens explicitly targets hooks, storytelling angles, emotional tension, repurposing beats, campaign moments, and social-first opportunities — not an executive recap. Same JSON schema.

---

## Frontend vs backend responsibilities

### Frontend (Next.js App Router)

- Marketing and workspace UI (home, upload, dashboard, pricing)
- Upload UX, template/persona selection, pipeline stage preview
- Client-safe mocks for demos (`PipelineStages`, preview panel)
- Calls to `/api/*` when wired (currently optional; UI does not require live API)

### Backend (API routes + future workers)

- Authentication and authorization
- File storage and virus scanning
- Extraction workers (long-running)
- Provider calls with fallback chains
- Database persistence (documents, jobs, results, learn cards)
- Cache (Redis/KV)
- Usage metering and billing provider webhooks
- Background Learn queue

**Rule:** Secrets and provider API keys never ship to the browser. All AI and storage I/O stays on the server.

---

## Provider fallback strategy

Configuration lives in `src/data/providerRoutes.ts`.

Each route defines:

- `persona` + `mode` → `primary` provider + ordered `fallback` list

**Implemented for text analysis:**

1. Groq (`GROQ_API_KEY`) with JSON response format.
2. On failure → Gemini (`GEMINI_API_KEY`).
3. Structured output validated in `validate-response.ts`.
4. UI shows provider + fallback badge.

Still TODO: persona-based routing table, latency metrics, persisted job records.

Supported provider names (types only today): `openai`, `groq`, `gemini`, `openrouter`.

---

## Cache strategy

Cache key: `documentId` + `persona` + `mode` (optionally content hash when storage exists).

- **Goal:** Avoid re-running expensive analysis on unchanged documents.
- **TTL:** Plan-dependent (e.g. 24h Free, 7d Pro).
- **Invalidation:** On re-upload, template change, or manual refresh.
- **Current:** In-memory `Map` in `checkCacheMock()` — resets on server restart.

---

## Usage tracking

`UsageEvent` types: `document_upload`, `analysis_run`, `learn_generate`, `cache_hit`, `export`.

Used for:

- Free tier limits (e.g. 3 summaries/month)
- Pro metering and overage
- Dashboard usage panel
- Product analytics funnels

**Current:** In-memory log via `trackUsageMock()`.

---

## Monetization gates

Defined in `src/data/pricingPlans.ts` and `analysisModes.ts`:

| Gate | Free | Pro |
|------|------|-----|
| Summaries / month | Limited | Unlimited |
| Analysis modes | `quick`, `standard` | + `deep`, `advanced` |
| Learn depth | `surface`, `standard` | + `deep` |
| Long documents | Capped pages | Full web limit |
| Batch upload | No | Coming soon |

Enforcement point (future): start of `POST /api/analyze` and `POST /api/learn` after auth.

---

## Mobile / web shared backend

- **Single API surface** (`/api/upload`, `/api/analyze`, `/api/learn`) consumed by web and mobile clients.
- **Shared types** in `src/core/types` (publish as package or OpenAPI later).
- **Personas and modes** from `src/data/*` synced to mobile via API or codegen.
- **Auth:** Supabase (or similar) session tokens on all clients—TBD.
- **Documents** stored per user/workspace; mobile uploads same pipeline as web.

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/extract` | POST | Multipart file → cleaned text + extraction metadata |
| `/api/extract-url` | POST | JSON `{ url }` → article text + metadata |
| `/api/analyze` | POST | Intelligence prepass + Groq/Gemini analysis |
| `/api/upload` | POST | Legacy mock upload (skeleton) |
| `/api/learn` | POST | Deferred Learn generation (skeleton) |

Example analyze (after `npm run dev`):

```bash
curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"rawText":"Your document text here (min 100 chars)...","mode":"executive"}' | jq
```

Response includes `profile`, `knowledgeLayerSummary`, `tokenBudget`, and `adaptivePlan` alongside `result`.

---

## What is intentionally not built yet

- Supabase, billing provider, auth middleware
- Persistent database, Redis cache, background workers
- Keynote `.key`, general audio upload ingestion
- Visual PPTX analysis (charts/images on slides)
- Full document chunking / map-reduce analysis
- Second-pass AI for knowledge layer (heuristics only today)

API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) live in server env only — never exposed to the client.
