# Adaptive planning engine (Phase 11B)

Phase 11B sits on [Cognitive Foundation](./COGNITIVE_FOUNDATION.md) (11A) and adds a **deterministic structure plan** before the LLM call. No second provider request.

## Pipeline

```
extract → intelligence prepass (11A profile) → PersonaBrain + dimensions + learn bias
  → buildAdaptiveAnalysisPlan (11B) → combined prompt block → Groq/Gemini
  → schema validation → learn post-process (plan-aware) → UI
```

## Planner architecture

**Module:** `src/lib/cognition/adaptivePlanner.ts`  
**Function:** `buildAdaptiveAnalysisPlan(input)`  
**Types:** `src/types/adaptive-analysis.ts` → `PersonaAdaptivePlan`, `AdaptiveAnalysisSection`

Inputs: `personaBrain`, `documentProfile`, `dimensions`, `learnCardBias`, `modeId`, `sourceKind`.

Outputs: planned sections, suppressed default blocks, learn card strategy, prompt block via `buildAdaptivePlanPromptBlock()`.

> Note: `PersonaAdaptivePlan` is distinct from `server/intelligence` `AdaptiveAnalysisPlan` (token/pipeline budget).

## Supported plan families

| Family | Trigger (examples) | Primary focus |
|--------|-------------------|---------------|
| `student_historical` | Student persona + historical domain | Timeline, causality, review questions |
| `student_scientific` | Student + scientific/technical/educational | Concepts, mechanisms, practice questions |
| `student_literary` | Student + literary/creative | Themes, characters, interpretation |
| `creator_media` | Creator + media/creative | Hooks, repurposing, audience |
| `executive_business` | Executive persona + business/financial | Decisions, metrics, risks, actions |
| `legal_document` | Contract/policy mode or domain | Obligations, watchpoints, verify |
| `technical` | Technical decoder or technical domain | Architecture, implementation |
| `general_fallback` | No specialized match | Balanced summary + insights |

## Suppression rules

Plans may set `suppressedDefaultSections`:

- **`risks`** — `risksOrWarnings` should be `[]` unless the source explicitly discusses downside/conflict/liability.
- **`actions`** — `actionItems` should be `[]` or review/practice prompts only (not business to-dos).

Prompt + post-processing enforce this for Student historical/scientific/literary and Technical plans.

Banned generic filler includes: “Further research is needed”, “Approach critically”, “Consider potential bias”.

## Section → JSON mapping

The UI still renders:

- `title`, `summary`, `keyInsights`, `risksOrWarnings`, `actionItems`, `learnCards`

The plan instructs the model to **organize** planned sections inside those fields (e.g. timeline bullets → `keyInsights`, review questions → `actionItems` or `quiz` learn cards).

## Learn card routing

`LearnCardStrategy` on each plan:

- Preferred/avoided adaptive types
- `providerTypeEmphasis` (maps to `concept` | `why` | `memory_hook` | `quiz`)
- `suppressMisconceptionUnlessExplicit` — reduces generic “Myth” cards
- `suppressRiskActionSynthesis` — learn layer skips turning risks/actions into cards

**Post-process:** `buildLearnIntelligence()` respects plan flags when synthesizing candidates from risks/actions.

## Safety

Legal/financial plans include informational-only guidance. See `plan.safetyGuidance` and `buildCognitionSafetyRules()`.

## Debug metadata (development)

`/api/analyze` `debug.cognition` includes:

- `adaptivePlanId`, `structureFamily`, `sectionTitles`
- `suppressedDefaultSections`, `learnCardStrategySummary`
- `adaptationLabel` (also on success response in dev for UI chip)

## Phase 11C readiness

Plans expose stable `structureFamily`, `sections[].dimension`, and `learnCardStrategy` for future:

- Memory graph seeds (`concept_map_seed` sections)
- Per-section UI blocks (still behind schema migration)
- Session-level recall weighting by dimension

## Code map

| Path | Role |
|------|------|
| `src/types/adaptive-analysis.ts` | Plan types |
| `src/lib/cognition/adaptivePlanner.ts` | Rule engine |
| `src/lib/cognition/planPrompt.ts` | Plan prompt block |
| `src/lib/cognition/buildContext.ts` | 11A + 11B assembly |
| `src/server/intelligence/index.ts` | Pipeline hook |
| `src/server/learn/buildLearnIntelligence.ts` | Plan-aware card synthesis |
| `src/server/ai/prompts.ts` | Softer default risk/action rules |
