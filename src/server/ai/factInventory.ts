/**
 * Phase 1 — structured fact inventory before flashcard generation.
 */

import { extractJsonFromText } from "./validate-response";

export const PHASE1_FACT_INVENTORY_SYSTEM = `CRITICAL: You are extracting facts from a source that may be in any language. All extracted facts in the inventory MUST be written in fluent native English.
Do NOT preserve source-language phrasing in the inventory.
Translate and contextualize all extracted content into English.
Exception: proper nouns (person names, club names, city names, film titles) should be kept as-is.

You are a fact extraction engine. Your only output is a JSON object.

Extract every verifiable, specific fact from the content below.
Be exhaustive, not selective: extract every named person, date, number, event, cause-effect pair, definition, formula, and procedural step you can find.
Group them into these categories:

- people: [{name, role_or_context}]
- dates: [{year_or_date, event}]
- numbers: [{value, unit, context}]
- events: [{name, what_happened}]
- causes: [{cause, effect}]
- contrasts: [{before, after}]
- definitions: [{term, definition}]
- formulas: [{name_or_symbol, expression, meaning}]
- steps: [{goal, sequence}]

Rules:
- Be exhaustive, not selective.
- Only extract facts explicitly stated in the text. No inferences.
- Each item must be a concrete, testable detail.
- definitions: glossary-style term → meaning from the source (concepts, jargon, theorems named in prose).
- formulas: equations, identities, reaction notations, or symbolic relationships with what they mean.
- steps: ordered procedures or worked-example sequences (keep sequence as a short numbered string).
- If a category has no entries, return an empty array.

Return ONLY valid JSON. No markdown, no explanation.
Start with { end with }.`;

export type FactInventoryPerson = { name: string; role_or_context: string };
export type FactInventoryDate = { year_or_date: string; event: string };
export type FactInventoryNumber = { value: string; unit: string; context: string };
export type FactInventoryEvent = { name: string; what_happened: string };
export type FactInventoryCause = { cause: string; effect: string };
export type FactInventoryContrast = { before: string; after: string };
export type FactInventoryDefinition = { term: string; definition: string };
export type FactInventoryFormula = {
  name_or_symbol: string;
  expression: string;
  meaning: string;
};
export type FactInventoryStep = { goal: string; sequence: string };

export type FactInventory = {
  people: FactInventoryPerson[];
  dates: FactInventoryDate[];
  numbers: FactInventoryNumber[];
  events: FactInventoryEvent[];
  causes: FactInventoryCause[];
  contrasts: FactInventoryContrast[];
  definitions: FactInventoryDefinition[];
  formulas: FactInventoryFormula[];
  steps: FactInventoryStep[];
};

const EMPTY_INVENTORY: FactInventory = {
  people: [],
  dates: [],
  numbers: [],
  events: [],
  causes: [],
  contrasts: [],
  definitions: [],
  formulas: [],
  steps: [],
};

function coerceRecordArray<T extends Record<string, string>>(
  value: unknown,
  keys: (keyof T)[],
): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const entry = {} as T;
    let valid = true;
    for (const key of keys) {
      const v = row[key as string];
      if (typeof v !== "string" || !v.trim()) {
        valid = false;
        break;
      }
      entry[key] = v.trim() as T[keyof T];
    }
    if (valid) out.push(entry);
  }
  return out;
}

export function parseFactInventoryResponse(raw: string): FactInventory {
  const trimmed = raw.trim();
  if (!trimmed) return { ...EMPTY_INVENTORY };

  try {
    const jsonText = extractJsonFromText(trimmed.replace(/```json|```/gi, "").trim());
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    return {
      people: coerceRecordArray<FactInventoryPerson>(parsed.people, ["name", "role_or_context"]),
      dates: coerceRecordArray<FactInventoryDate>(parsed.dates, ["year_or_date", "event"]),
      numbers: coerceRecordArray<FactInventoryNumber>(parsed.numbers, ["value", "unit", "context"]),
      events: coerceRecordArray<FactInventoryEvent>(parsed.events, ["name", "what_happened"]),
      causes: coerceRecordArray<FactInventoryCause>(parsed.causes, ["cause", "effect"]),
      contrasts: coerceRecordArray<FactInventoryContrast>(parsed.contrasts, ["before", "after"]),
      definitions: coerceRecordArray<FactInventoryDefinition>(parsed.definitions, [
        "term",
        "definition",
      ]),
      formulas: coerceRecordArray<FactInventoryFormula>(parsed.formulas, [
        "name_or_symbol",
        "expression",
        "meaning",
      ]),
      steps: coerceRecordArray<FactInventoryStep>(parsed.steps, ["goal", "sequence"]),
    };
  } catch {
    return { ...EMPTY_INVENTORY };
  }
}

export function factInventoryItemCount(inventory: FactInventory): number {
  return (
    inventory.people.length +
    inventory.dates.length +
    inventory.numbers.length +
    inventory.events.length +
    inventory.causes.length +
    inventory.contrasts.length +
    inventory.definitions.length +
    inventory.formulas.length +
    inventory.steps.length
  );
}

export function isFactInventoryUsable(inventory: FactInventory): boolean {
  return factInventoryItemCount(inventory) >= 1;
}

/** Loose source check: enough significant tokens from `needle` appear in `source`. */
export function appearsInSourceText(needle: string, source: string): boolean {
  const n = needle.toLowerCase().replace(/\s+/g, " ").trim();
  const s = source.toLowerCase();
  if (n.length < 2) return true;
  if (s.includes(n)) return true;

  // Math / symbol fragments
  if (/[=+\-×÷*/^]/.test(n) || /\d+[a-z]/i.test(n)) {
    const compact = n.replace(/\s+/g, "");
    if (s.replace(/\s+/g, "").includes(compact)) return true;
  }

  const words = n
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length > 3);
  if (words.length === 0) return s.includes(n.slice(0, Math.min(n.length, 12)));
  const hits = words.filter((w) => s.includes(w)).length;
  // Single distinctive term (e.g. "algebra", "variable") must appear.
  if (words.length === 1) return hits === 1;
  return hits >= Math.ceil(words.length * 0.6);
}

/**
 * Drop inventory rows whose core terms are not evidenced in the source text.
 * Prevents Phase-2 from inventing off-topic STEM cards (e.g. quadratic/telescope
 * on a basic "what is algebra" lecture).
 */
export function groundFactInventoryToSource(
  inventory: FactInventory,
  sourceText: string,
): FactInventory {
  const source = sourceText.slice(0, 48_000);
  if (!source.trim()) return inventory;

  return {
    people: inventory.people.filter((p) => appearsInSourceText(p.name, source)),
    dates: inventory.dates.filter(
      (d) =>
        appearsInSourceText(d.year_or_date, source) ||
        appearsInSourceText(d.event, source),
    ),
    numbers: inventory.numbers.filter(
      (n) =>
        appearsInSourceText(n.value, source) ||
        appearsInSourceText(n.context, source),
    ),
    events: inventory.events.filter(
      (e) =>
        appearsInSourceText(e.name, source) ||
        appearsInSourceText(e.what_happened, source),
    ),
    causes: inventory.causes.filter(
      (c) =>
        appearsInSourceText(c.cause, source) ||
        appearsInSourceText(c.effect, source),
    ),
    contrasts: inventory.contrasts.filter(
      (c) =>
        appearsInSourceText(c.before, source) ||
        appearsInSourceText(c.after, source),
    ),
    // Definitions: the TERM must appear in the source (strict).
    definitions: inventory.definitions.filter((d) =>
      appearsInSourceText(d.term, source),
    ),
    formulas: inventory.formulas.filter(
      (f) =>
        appearsInSourceText(f.expression, source) ||
        appearsInSourceText(f.name_or_symbol, source),
    ),
    steps: inventory.steps.filter(
      (st) =>
        appearsInSourceText(st.goal, source) ||
        appearsInSourceText(st.sequence, source),
    ),
  };
}

/** Prefer STEM/study card angles when inventory has definition/formula/step density. */
export function inferInventoryDomainHint(inventory: FactInventory): string {
  const stem =
    inventory.definitions.length + inventory.formulas.length + inventory.steps.length;
  const narrative =
    inventory.people.length + inventory.events.length + inventory.dates.length;
  if (stem >= 2 || (stem >= 1 && stem >= narrative)) {
    return "study_stem: prioritize definitions, formulas, and worked steps over trivia names/dates. Do NOT invent terms or examples absent from the inventory.";
  }
  if (narrative >= 3 && stem === 0) {
    return "narrative_history: prioritize people, timeline, causes, and contrasts.";
  }
  return "general: mix concrete facts; avoid repeating the same angle twice.";
}
