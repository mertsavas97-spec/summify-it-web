# Adaptive planning engine (Phase 11B)

Phase 11B sits on [Cognitive Foundation](./COGNITIVE_FOUNDATION.md) (11A) and adds a **deterministic structure plan** before the LLM call. No second provider request.

## Pipeline

```
extract → intelligence prepass (11A profile) → PersonaBrain + dimensions + learn bias
  → buildAdaptiveAnalysisPlan (11B) → combined prompt block → Groq/Gemini
  → schema validation → **Phase 11C:** `applyAdaptivePlanPostProcess` (hard suppress + student phrase strip)
  → learn post-process (`buildLearnIntelligence`, 11C allow/block + **11D adaptive learn**) → UI
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

Prompting reflects the plan; **hard enforcement** happens after generation in `applyAdaptivePlanPostProcess()`:

- If `suppressedDefaultSections` contains **`risks`**, `risksOrWarnings` is set to `[]`.
- If it contains **`actions`**, `actionItems` is set to `[]`.

For student plans (`structureFamily` prefix `student_`), generic meta-lines are stripped from summary/bullets via `genericHallucinationPatterns.ts` (e.g. “Further research is needed”, “Potential risk”, “Actionable next steps”).

## Section → JSON mapping

The workspace renders adaptive **CollapsibleSection** titles when the plan defines `uiSectionLabels` (`summary`, `keyInsights`, `risks`, `actions`). Those labels are returned on `/api/analyze` as `personaUiSectionLabels` (optional); the UI falls back to generic English defaults if omitted.

The plan instructs the model to **organize** planned sections inside those fields (e.g. timeline bullets → `keyInsights`, review questions → `quiz` learn cards — not corporate action lists when actions are suppressed).

## Learn card routing

`LearnCardStrategy` on each plan:

- Preferred/avoided adaptive types
- `providerTypeEmphasis` (maps to `concept` | `why` | `memory_hook` | `quiz`)
- `suppressMisconceptionUnlessExplicit` — reduces generic “Myth” cards
- `suppressRiskActionSynthesis` — learn layer skips turning risks/actions into cards (still reinforced by blocking sources when set per plan).
- **`allowedLearnSourceSections` / `blockedLearnSourceSections`** (Phase 11C) — filter learn candidates by origin (`ai_card`, `insight`, `summary`, `risk`, `action`, `synthesized`) before ranking.

**Post-process:** `buildLearnIntelligence()` applies synthesis guard flags **and** optional allow/block lists so cards are not mined from suppressed domains (e.g. student plans block `risk` / `action` sources entirely).

## Phase 11C — dominance layer

**Persona language:** `buildPersonaLanguageBlock(modeId)` in `personaLanguageProfiles.ts` is prepended to the cognition prompt block (included in the system prompt via `cognitionPromptBlock`). It encodes tone, forbidden registers, and synthesis expectations beyond short adjectives.

**Hard suppression:** `postProcessAnalysis.ts` → `applyAdaptivePlanPostProcess()` runs immediately after JSON validation and **before** learn synthesis.

**Hallucination-ish phrases:** `genericHallucinationPatterns.ts` removes boilerplate meta-commentary for student cognitive families only.

**API:** Success responses may include `personaUiSectionLabels` for client section headings without hardcoding persona strings in React.

## Safety

Legal/financial plans include informational-only guidance. See `plan.safetyGuidance` and `buildCognitionSafetyRules()`.

## Debug metadata (development)

`/api/analyze` `debug.cognition` includes:

- `adaptivePlanId`, `structureFamily`, `sectionTitles`
- `suppressedDefaultSections`, `learnCardStrategySummary`
- `adaptationLabel` (also on success response in dev for UI chip)

Production clients still receive **`personaUiSectionLabels`** when the active plan defines them (not dev-only).

## Code map

| Path | Role |
|------|------|
| `src/types/adaptive-analysis.ts` | Plan types + `PersonaUiSectionLabels`, learn source policy |
| `src/lib/cognition/adaptivePlanner.ts` | Rule engine |
| `src/lib/cognition/planPrompt.ts` | Plan prompt block |
| `src/lib/cognition/personaLanguageProfiles.ts` | Phase 11C persona language contract |
| `src/lib/cognition/genericHallucinationPatterns.ts` | Student meta-phrase stripping |
| `src/lib/cognition/postProcessAnalysis.ts` | Hard suppress risks/actions + phrase filter |
| `src/lib/cognition/buildContext.ts` | 11A + 11B + 11C language assembly |
| `src/server/intelligence/index.ts` | Pipeline hook |
| `src/server/learn/buildLearnIntelligence.ts` | Plan-aware card synthesis + source filter |
| `src/server/ai/orchestrator.ts` | Post-process then learn layer |
| `src/server/ai/prompts.ts` | Default risk/action rules |

See also: [Adaptive Learn Intelligence](./ADAPTIVE_LEARN_INTELLIGENCE.md) (Phase 11D).
