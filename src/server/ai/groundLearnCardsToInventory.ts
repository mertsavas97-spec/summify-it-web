/**
 * Drop Phase-2 learn cards that are not evidenced in the fact inventory.
 */

import type { LearnCardOutput } from "./schemas";
import type { FactInventory } from "./factInventory";
import { appearsInSourceText } from "./factInventory";

function inventoryCorpus(inventory: FactInventory): string {
  const parts: string[] = [];
  for (const d of inventory.definitions) {
    parts.push(d.term, d.definition);
  }
  for (const f of inventory.formulas) {
    parts.push(f.name_or_symbol, f.expression, f.meaning);
  }
  for (const s of inventory.steps) {
    parts.push(s.goal, s.sequence);
  }
  for (const c of inventory.contrasts) {
    parts.push(c.before, c.after);
  }
  for (const c of inventory.causes) {
    parts.push(c.cause, c.effect);
  }
  for (const e of inventory.events) {
    parts.push(e.name, e.what_happened);
  }
  for (const p of inventory.people) {
    parts.push(p.name, p.role_or_context);
  }
  for (const n of inventory.numbers) {
    parts.push(n.value, n.unit, n.context);
  }
  for (const d of inventory.dates) {
    parts.push(d.year_or_date, d.event);
  }
  return parts.join("\n");
}

/**
 * Keep cards whose title or content shares grounding with inventory terms.
 * Math/symbol answers are kept when the expression appears in inventory.
 */
export function filterLearnCardsAgainstInventory(
  cards: LearnCardOutput[],
  inventory: FactInventory,
): LearnCardOutput[] {
  const corpus = inventoryCorpus(inventory);
  if (!corpus.trim()) return cards;

  return cards.filter((card) => {
    const title = card.title ?? "";
    const content = card.content ?? "";
    const answer =
      card.type === "quiz" && content.includes("\n---\n")
        ? content.split("\n---\n")[1] ?? content
        : content;

    // Prefer title keyword grounding (definition questions: "What is algebra?")
    const titleTerms = title
      .replace(/^(what|how|which|why|when|who)\b[^a-z0-9]*/i, "")
      .replace(/\?+$/, "")
      .trim();

    if (titleTerms.length >= 3 && appearsInSourceText(titleTerms, corpus)) {
      return true;
    }
    if (answer.length >= 2 && appearsInSourceText(answer, corpus)) {
      return true;
    }
    // Short formula answers ("2x", "1 + 2 = x")
    if (/[=+\-×÷*/^]/.test(answer) || /\d+[a-z]/i.test(answer)) {
      return appearsInSourceText(answer, corpus);
    }
    return false;
  });
}
