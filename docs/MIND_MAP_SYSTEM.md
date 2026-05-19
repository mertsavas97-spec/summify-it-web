# Mind map system — Summify

Phase 9B adds **visual intelligence graphs** derived from existing analysis output. No extra AI API call is made at view time.

## Graph architecture

Types live in `src/types/mindmap.ts`:

| Type | Purpose |
|------|---------|
| `MindMapNode` | Card: title, insight, type, importance, parent/group |
| `MindMapEdge` | Relationship: hierarchy, relation, timeline, dependency |
| `MindMapGroup` | Cluster label + layout hint |
| `MindMapGraph` | Versioned graph payload (`version: 1`) |

Node types include: `root`, `theme`, `concept`, `insight`, `action`, `risk`, `obligation`, `evidence`, `topic`, `timeline`, `learn`.

## Generation flow

```
Saved analysis (summary, insights, learn cards, metadata)
        ↓
resolveMindMapProfile(documentType, sourceKind)
        ↓
analysisToMindMap()  — deterministic transform (no new tokens)
        ↓
layoutMindMapGraph() — x/y positions
        ↓
mindMapGraphToFlow() — React Flow nodes/edges
        ↓
MindMapCanvas (@xyflow/react)
```

### Profile behaviors

| Profile | Trigger | Graph emphasis |
|---------|---------|----------------|
| `meeting` | meeting notes | Decisions/actions, discussion insights, blockers |
| `research` | research/report | Themes, evidence |
| `contract` | contract/policy | Obligations, points to review |
| `educational` | educational/lecture | Learn concepts, core concepts |
| `narrative` | YouTube/transcripts | Topics, story-flow beats |
| `general` | default | Insights, risks, actions, learn |

Caps: ≤6 branch nodes per group, ≤8 learn nodes — keeps renders fast.

## UI integration

| Surface | Component |
|---------|-----------|
| `/dashboard/[id]` | `SavedAnalysisWorkspace` tabs: Summary · Learn · Mind Map |
| `/share/[shareId]` | `PublicAnalysisWorkspace` (same tabs, mind map optional) |

Mind map tab uses `dynamic(..., { ssr: false })` so React Flow only loads client-side when the tab is opened.

## Performance strategy

- **No SSR** for React Flow — avoids hydration mismatch.
- **Lazy import** of `MindMapCanvas` when Mind Map tab is selected.
- **`useMemo`** on `analysisToMindMap` inputs in `MindMapPanel`.
- **Node caps** in graph builder (see above).
- **Custom node memo** (`MindMapNodeCard`).
- Graph JSON is **not** stored in DB or exposed in page metadata (SEO stays on title/summary only).

## Future export (placeholders)

`src/lib/mindmap/exportHooks.ts`:

- `exportMindMapPng()` — raster snapshot
- `exportMindMapSvg()` — vector export
- `exportMindMapPdf()` — print/PDF pipeline

Not implemented in 9B; UI shows “coming soon” copy.

## Local testing

1. Sign in → open a saved analysis with insights and Learn cards.
2. Open **Mind Map** tab — graph loads after brief skeleton.
3. Pan, zoom (controls), drag nodes, click to focus.
4. Try analyses from different sources (YouTube vs PDF) — profile label under graph should change.
5. Open a public share link → Mind Map tab works without auth.
6. `/upload` anonymous flow unchanged (no mind map until saved).

## Production testing

1. Deploy with `@xyflow/react` dependency (included in `package.json`).
2. Verify dashboard detail Mind Map on mobile (scrollable tabs, min height).
3. Shared page Mind Map loads without indexing graph data (view page source — no embedded JSON-LD graph).

## Related docs

- `docs/SHARING_AND_EXPORTS.md` — public share pages
- `src/server/intelligence/documentTypes.ts` — document type guesses fed into profiles
