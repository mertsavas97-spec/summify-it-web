/**
 * Study cards are a separate pass. Their source is the written summary
 * plus the same source text the analysis used — not the key-insight list.
 */
export function studyCardCorpus(summary: string | undefined, source: string): string {
  const overview = summary?.trim() ?? "";
  const body = source.trim();
  if (overview && body) return `SUMMARY\n${overview}\n\nSOURCE\n${body}`;
  return body || overview;
}

export const STUDY_CARD_BRIEF = `The inventory was extracted from the written summary and the source text. It is not a key-insight list.
Write distinct cards up to the requested count. Spread them across events, causes, numbers, and dates. Do not spend the deck only on years and names when other rows are present. Follow the strategy hint for this analysis lens.
Pick the card type from the fact:
- a named term and its meaning → definition
- a cause and its result → cause
- two events or forces that affect each other → connection
- a date, number, or named event → fact
- an ordered procedure → steps
- a before-and-after change the inventory actually states → contrast
The question is one complete question and ends with ?.
The answer is one complete sentence that states the fact.
Do not ask "What followed X" when the answer is X. Do not ask "What did X change here?" unless the inventory states the change.
Do not use the document title as the question or the answer.
Do not split one inventory sentence across the question and the answer.`;
