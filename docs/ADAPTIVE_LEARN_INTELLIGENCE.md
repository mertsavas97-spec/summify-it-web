# Adaptive Learn Intelligence (Phase 11D)

Phase 11D extends [Adaptive Planning](./ADAPTIVE_PLANNING_ENGINE.md) (11B/11C) so the **post-model learn layer** behaves like a persona-aware cognitive study system—not generic summary flashcards.

## Pipeline

```
Provider JSON (learnCards + analysis fields)
  → validate + adaptive plan post-process (11C)
  → buildLearnIntelligence
      → source allow/block (11C)
      → profile synthesis (11D)
      → quality filters (11D)
      → rank + dedupe + group-aware select
      → difficulty + relationships + optional group labels
  → API result.learnCards (same core keys; optional enrichment)
```

No second LLM call. Profiles are **deterministic** from `PersonaAdaptivePlan.structureFamily`.

## Architecture

| Module | Role |
|--------|------|
| `src/types/adaptive-learn.ts` | `AdaptiveLearnProfile`, groups, patterns, relationships, enrichment types |
| `src/lib/cognition/adaptiveLearnProfiles.ts` | Domain/persona profile rules |
| `src/lib/cognition/learnPrompt.ts` | Provider prompt block for learnCards |
| `src/lib/cognition/learnQualityFilters.ts` | Reject weak/trivial/fake cards |
| `src/server/learn/profileLearnSynthesis.ts` | Extra candidates (timeline, cause/effect, mechanisms, etc.) |
| `src/server/learn/adaptiveLearnEnrichment.ts` | Groups, difficulty, relationships, debug stats |
| `src/server/learn/buildLearnIntelligence.ts` | Orchestrates 11C + 11D |

## Adaptive learn profiles

Resolved via `buildAdaptiveLearnProfile(plan)`:

| Profile ID | Trigger | Groups (examples) |
|------------|---------|-------------------|
| `learn_historical_student_v1` | `student_historical` | Timeline Recall, Key Figures, Causes & Consequences |
| `learn_scientific_student_v1` | `student_scientific` | Core Concepts, Mechanisms, Systems, Practice Questions |
| `learn_literary_student_v1` | `student_literary` | Themes & Motifs, Character Dynamics, Symbolism |
| `learn_technical_developer_v1` | `technical` | Architecture, Components, Workflows, Failure Points |
| `learn_business_executive_v1` | `executive_business` | Strategic Signals, Metrics, Risks, Opportunities |
| `learn_general_v1` | fallback | Flat list (no groups) |

Each profile defines:

- `learningGoal`, `cognitiveStyle`, `memoryStrategy`, `sequencingStrategy`
- `preferredCardPatterns` (ranking boost)
- `groups[]` with `cardTypes`, `maxCards`, `priority`

## Grouping

When `groupingStrategy === "adaptive_groups"`:

- Candidates receive optional `groupId` / `groupTitle` from profile groups.
- Selected cards are **sorted by group priority** for UI section headers.
- If grouping metadata is missing, UI falls back to a **flat list** (unchanged behavior).

## Card relationships (optional)

Relationship types (pre-memory-graph):

- `chronology_before` / `chronology_after`
- `caused_by` / `leads_to`
- `contrasts_with`, `supports`, `depends_on`, `symbolizes`, `related_to`

Emitted as `cardRelationships[]` with `targetCardId` when heuristics match (e.g. timeline chains, cause/effect connections). **Optional**—clients and saved JSON ignore unknown fields safely.

## Difficulty scoring (heuristic v1)

Per card (optional):

- `difficulty`: low | medium | high
- `abstractionLevel`: low | medium | high
- `memoryWeight`: 0–1 (recall emphasis)
- `conceptualDensity`: 0–1 (information density)

Prepares spaced repetition and adaptive review without changing billing or persistence schema requirements.

## Quality filters

`learnQualityFilters.ts` drops:

- Generic meta (“readers should understand”, “further research may help”)
- Weak “why” / fake myth titles
- Near-duplicate title/content paraphrases

Works together with 11C risk/action source blocking.

## Prompting

`buildAdaptiveLearnPromptBlock()` is injected into the cognition/system prompt (via `buildContext`) **after** the adaptive analysis plan. It instructs the model to generate `learnCards` from plan sections and `keyInsights`, not from summary filler or suppressed risk/action lists.

## API & UI compatibility

**Stable contract:** `learnCards[].type`, `title`, `content` remain required.

**Optional Phase 11D fields** (ignored by older clients):

- `cardId`, `groupId`, `groupTitle`, `learnPattern`
- `difficulty`, `abstractionLevel`, `memoryWeight`, `conceptualDensity`
- `cardRelationships`

Saved analyses store the same JSON array; extra keys persist in Supabase JSONB without migration.

## Debug metadata (development)

`debug.cognition.adaptiveLearn` (when cognition runs):

- `adaptiveLearnProfileId`
- `learnGroups` (id, title, cardCount)
- `relationshipCount`
- `difficultyStats`

## Future: memory intelligence

11D intentionally exposes:

- Stable `cardId` + `cardRelationships` for graph edges
- Group + difficulty signals for review scheduling
- Profile-scoped patterns for recall weighting

A future phase can consume these fields in `/api/memory/review` without breaking the current Learn UI.

## Test matrix

| Source | Mode | Expect |
|--------|------|--------|
| Historical PDF | The Student | Timeline/cause groups; few summary clones; no risk/action cards |
| Scientific PDF | The Student | Mechanism/system groups; terminology hooks |
| Literary PDF | The Student | Theme/symbol groups; interpretation quizzes |
| Technical PDF | Technical decoder | Architecture/workflow groups; dependency links |

Run: `npm run lint` and `npm run build`, then analyze in dev and inspect `debug.cognition.adaptiveLearn`.
