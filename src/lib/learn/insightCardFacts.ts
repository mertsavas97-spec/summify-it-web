import type { FactInventory } from "@/server/ai/factInventory";

const EMPTY: FactInventory = {
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

/**
 * Cards are written from insight sentences, not from the summary or the source title.
 * Each bullet is one event the card writer may use.
 */
export function inventoryFromKeyInsights(
  insights: string[],
  documentTitle?: string,
): FactInventory {
  const title = documentTitle?.trim().toLowerCase() ?? "";
  const titleProbe = title.slice(0, 40);
  const events = insights
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 40 && item.length <= 420)
    .filter((item) => !/…|\.\.\.|↔/.test(item))
    .filter((item) => !titleProbe || !item.toLowerCase().includes(titleProbe))
    .map((sentence) => ({
      name: sentence.split(/[–—:-]/)[0]?.trim().slice(0, 48) || sentence.slice(0, 48),
      what_happened: sentence,
    }));

  return { ...EMPTY, events };
}

export const INSIGHT_CARD_BRIEF = `These facts are finished insight sentences. Write the flashcards from them only.
- Aim for one card per event. Add a why or link card only when that same sentence states both a cause and a result, and the question is different.
- The question names a complete person or event. It must not end in a leftover verb or phrase such as "and later", "and signs", "intervenes", or "forced".
- Do not ask "What followed X" when the answer is X itself. Ask what happened, what it caused, or why it mattered.
- Do not ask "What did X change here?" unless the sentence states a change X made.
- Do not ask how forces in the narrative interact, and do not use the document title as the answer.
- The answer is one complete sentence taken from that fact. Do not split the fact across the question and the answer, and do not end the answer with an ellipsis.`;
