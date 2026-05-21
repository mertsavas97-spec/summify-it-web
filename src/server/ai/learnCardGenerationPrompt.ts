/**
 * Phase 2 — flashcards from fact inventory only (no source text).
 */

import type { FactInventory } from "./factInventory";

export const PHASE2_FLASHCARD_SYSTEM = `You are a flashcard writer. Your only input is a fact inventory JSON.
Your only output is a flashcard JSON object.

RULES — all mandatory:

Question format:
- Use only these patterns: "Who did X?", "When did X happen?",
  "What caused X?", "What resulted from X?", "How many X?",
  "Which manager did X?", "What was the outcome of X?"
- Max 80 characters
- Never copy a sentence from the inventory as the question stem
- Never start with "What changed after [long clause]?"

Answer format:
- Must contain at least one anchor from the inventory
  (a name, number, year, place, or direct cause)
- Must not restate the question
- Answer must not be identical to the question
- Must not repeat the document title
- Max 160 characters

Quiz cards (type "quiz"):
- For cards with type 'quiz', the answer must be the actual answer to the question — a specific fact, number, name, or date. Never use the question text as the answer.

Deduplication:
- No two cards may test the same fact
- A person may appear in at most 2 cards, each testing a different fact

Return ONLY valid JSON. No markdown, no explanation.
Start with { end with }.

Schema:
{
  "cards": [
    {
      "type": "fact|cause|consequence|number|connection",
      "difficulty": "easy|medium|hard",
      "topic": "max 25 chars",
      "question": "max 80 chars",
      "answer": "max 160 chars"
    }
  ]
}`;

export type Phase2FlashcardUserInput = {
  cardCount: number;
  language: string;
  inventory: FactInventory;
};

export function buildPhase2FlashcardUserPrompt(input: Phase2FlashcardUserInput): string {
  return `Generate ${input.cardCount} flashcards.
Language: ${input.language}

Use ONLY facts from this inventory — do not invent or infer:

${JSON.stringify(input.inventory, null, 2)}`;
}

export function resolveLearnContentType(input: {
  isYoutube?: boolean;
  isPresentation?: boolean;
  isWebArticle?: boolean;
  documentTypeGuess?: string;
}): string {
  if (input.isYoutube) return "YouTube transcript";
  if (input.isPresentation) return "Presentation slides";
  if (input.isWebArticle) return "Web article";
  if (input.documentTypeGuess) return input.documentTypeGuess;
  return "Document";
}
