# Cognitive foundation (Phase 11A)

Phase 11A adds an **adaptive cognition layer** before the existing analysis LLM call. It does **not** change the JSON output schema, plan gating, or upload/analyze flow.

## Goals

- Document type influences analysis emphasis (not a single static template per persona).
- Persona acts as a **thinking lens** (goals, priorities, tone).
- Learn Cards receive **bias guidance** mapped to existing provider types (`concept`, `why`, `memory_hook`, `quiz`).
- UI output shape stays stable and renderable.

Phase **11B** will add a full adaptive planner; 11A is foundation only.

## Document profile model

**Types:** `src/types/cognition.ts` → `CognitionDocumentProfile`

**Classifier:** `src/lib/cognition/documentProfile.ts` → `classifyDocumentProfile()`

Deterministic heuristics (no extra LLM):

- Source kind (text, file, url, youtube, presentation)
- Title + text snippet keyword scoring
- Existing intelligence prepass `documentTypeGuess` (heuristic profile)
- Optional mode hint (e.g. contract-analyzer → legal_document)

Fields: `domain`, `subType`, `complexity`, `density`, `sourceKind`, `primaryStructure`, `learningStyle`, `requiredThinking`, `confidence`.

Domains include `legal_document` and `financial` as **document categories only** (not advice).

## Persona brain model

**Registry:** `src/lib/cognition/personaRegistry.ts`

All **29** intelligence mode IDs from `src/config/modes.ts` map to a `PersonaBrain`:

- `family` (general, learning, research, business, creative, technical, legal_document, policy, media, productivity)
- `goals`, `priorities`, `reasoningStyle`, `preferredOutputs`, `learnCardBias`, `depthPreference`, `riskSensitivity`, `actionOrientation`, `tone`

Unknown mode IDs fall back to the general brain. Registry copy is separate from UI marketing strings.

## Dimension resolver

**Module:** `src/lib/cognition/dimensions.ts` → `resolveCognitiveDimensions(personaBrain, documentProfile)`

Returns:

- `primaryDimensions` — emphasize in summary/insights
- `secondaryDimensions` — lighter emphasis
- `suppressedDimensions` — de-emphasize
- `rationale` — dev/log string

Examples:

| Persona × domain | Primary emphasis |
|------------------|------------------|
| Student × historical | chronology, causal_chain, review_questions |
| Student × scientific | definitions, mechanisms, formulas |
| Creator × media_transcript | creator_hooks, content_angles, audience_takeaways |
| Executive × business | decisions, metrics, tradeoffs, risks |
| Contract Summary × legal_document | obligations, risks, definitions |

## Learn Card bias resolver

**Module:** `src/lib/cognition/learnCardBias.ts` → `resolveLearnCardBias(...)`

Returns adaptive card **types** (definition, chronology, obligation, etc.) plus `providerTypeEmphasis` mapping to the **existing** JSON learn card types.

The LLM is instructed to keep `learnCards[].type` as `concept | why | memory_hook | quiz` while biasing **content** toward the resolved dimensions.

## Prompt injection

**Builder:** `src/lib/cognition/buildContext.ts` → `buildCognitionContext()`

Wired in:

1. `prepareAnalysisIntelligence()` — builds cognition after knowledge layer
2. `compactPromptInput()` — cognition block in **user** message (after document profile)
3. `buildSystemPrompt()` — same cognition block in **system** message (via `cognitionPromptBlock` option)
4. `callGroqAnalysis` / `callGeminiAnalysis` — pass block from `intelligence.cognitionPromptBlock`

**Safety:** `src/lib/cognition/safety.ts` — informational-only rules for legal_document, policy, financial, and health-like subtypes.

## Anti-freeform rule

- Same JSON keys: `title`, `summary`, `keyInsights`, `risksOrWarnings`, `actionItems`, `learnCards`.
- No dynamic section names in 11A.
- Cognition only steers emphasis inside existing fields.

## Debug metadata

Server-only on `AnalysisIntelligenceContext.cognition`:

- `domain`, `personaId`, `personaFamily`, `primaryDimensions`, `learnCardDensity`, `debugSummary`

In **development**, `/api/analyze` `debug.cognition` includes a short summary. Not shown in production UI by default.

## Testing suggestions

1. **Student + historical** — paste a history article or transcript; mode `the-student`. Expect chronology/causality emphasis in insights; learn cards biased toward recall/quiz.
2. **Student + scientific** — research abstract or lab notes; expect definitions/mechanisms.
3. **Student + literary** — story excerpt; expect themes/characters (no new JSON fields).
4. **Creator + YouTube** — transcript; expect hooks/angles in keyInsights.
5. **Contract Summary** — contract excerpt; risks/obligations framing, safety line in prompt, no legal advice tone.

Check dev server logs or `debug.cognition` on analyze responses in `NODE_ENV=development`.

## Code map

| Path | Role |
|------|------|
| `src/types/cognition.ts` | Shared cognition types |
| `src/lib/cognition/documentProfile.ts` | Document classifier |
| `src/lib/cognition/personaRegistry.ts` | 29 persona brains |
| `src/lib/cognition/dimensions.ts` | Dimension resolver |
| `src/lib/cognition/learnCardBias.ts` | Learn card bias |
| `src/lib/cognition/buildContext.ts` | Prompt block assembly |
| `src/lib/cognition/safety.ts` | Compliance framing |
| `src/server/intelligence/index.ts` | Pipeline integration |
