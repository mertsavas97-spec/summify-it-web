/**
 * Phase 1 — structured fact inventory before flashcard generation.
 */

import { extractJsonFromText } from "./validate-response";

export const PHASE1_FACT_INVENTORY_SYSTEM = `You are a fact extraction engine. Your only output is a JSON object.

Extract every verifiable, specific fact from the content below.
Be exhaustive, not selective: extract every named person, date, number, event, and cause-effect pair you can find.
Group them into these categories:

- people: [{name, role_or_context}]
- dates: [{year_or_date, event}]
- numbers: [{value, unit, context}]
- events: [{name, what_happened}]
- causes: [{cause, effect}]
- contrasts: [{before, after}]

Rules:
- Be exhaustive, not selective.
- Only extract facts explicitly stated in the text. No inferences.
- Each item must be a concrete, testable detail.
- If a category has no entries, return an empty array.

Return ONLY valid JSON. No markdown, no explanation.
Start with { end with }.`;

export type FactInventoryPerson = { name: string; role_or_context: string };
export type FactInventoryDate = { year_or_date: string; event: string };
export type FactInventoryNumber = { value: string; unit: string; context: string };
export type FactInventoryEvent = { name: string; what_happened: string };
export type FactInventoryCause = { cause: string; effect: string };
export type FactInventoryContrast = { before: string; after: string };

export type FactInventory = {
  people: FactInventoryPerson[];
  dates: FactInventoryDate[];
  numbers: FactInventoryNumber[];
  events: FactInventoryEvent[];
  causes: FactInventoryCause[];
  contrasts: FactInventoryContrast[];
};

const EMPTY_INVENTORY: FactInventory = {
  people: [],
  dates: [],
  numbers: [],
  events: [],
  causes: [],
  contrasts: [],
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
    inventory.contrasts.length
  );
}

export function isFactInventoryUsable(inventory: FactInventory): boolean {
  return factInventoryItemCount(inventory) >= 1;
}
