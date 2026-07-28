/**
 * Phase 2 — flashcards from fact inventory only (no source text).
 */

import {
  getLearningOutputLanguageLabel,
  normalizeLearningLanguage,
  sourceLanguageGroundingNote,
} from "@/lib/learning/normalizeLearningLanguage";
import type { FactInventory } from "./factInventory";
import { inferInventoryDomainHint } from "./factInventory";

export const PHASE2_FLASHCARD_SYSTEM = `You are a flashcard writer. Your only input is a fact inventory JSON.
Your only output is a flashcard JSON object.

${normalizeLearningLanguage()}

${sourceLanguageGroundingNote()}

CRITICAL OUTPUT LANGUAGE RULE:
All card content MUST be written in fluent native English.
This applies to:
- question field
- answer field
- topic field
- Any other text field

If the fact inventory contains non-English fragments, translate them to English before using them in cards.
Do NOT copy non-English phrases into card questions or answers.
Exception: proper nouns like person names, club names, city names stay in their standard form.

RULES — all mandatory:

Question format:
- Prefer these patterns (pick what fits the inventory):
  "Who did X?", "When did X happen?", "What caused X?", "What resulted from X?",
  "How many X?", "What does [term] mean?", "What is the formula for X?",
  "What is the next step when doing X?", "How do you compute X?"
- Max 80 characters
- Never copy a sentence from the inventory as the question stem
- Never start with "What changed after [long clause]?"

Answer format:
- Must contain at least one anchor from the inventory
  (a name, number, year, place, definition phrase, formula expression, or step)
- Must not restate the question
- Answer must not be identical to the question
- Must not repeat the document title
- Max 160 characters

Quiz cards (type "quiz"):
- For cards with type 'quiz', the answer must be the actual answer to the question — a specific fact, number, name, date, definition, or formula. Never use the question text as the answer.

Deduplication:
- No two cards may test the same fact
- A person may appear in at most 2 cards, each testing a different fact
- Prefer definition/formula/step cards when those inventory arrays are non-empty.
CRITICAL: Use ONLY terms, formulas, examples, and steps present in the inventory.
Do NOT invent topics (e.g. quadratic equations, telescope lenses) if they are absent from the inventory.

Return ONLY valid JSON. No markdown, no explanation.
Start with { end with }.

Schema:
{
  "cards": [
    {
      "type": "fact|cause|consequence|number|connection|definition|formula|steps|contrast|quiz|mechanism|method",
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
  domainHint?: string;
  strategyHint?: string;
};

export function buildPhase2FlashcardUserPrompt(input: Phase2FlashcardUserInput): string {
  const language = input.language || getLearningOutputLanguageLabel();
  const domainHint = input.domainHint ?? inferInventoryDomainHint(input.inventory);
  const strategyLine = input.strategyHint
    ? `Strategy hint: ${input.strategyHint}`
    : "";

  return `Generate ${input.cardCount} flashcards.
Language: ${language} (required — all question and answer text)

Write all questions and answers in English.
Do not use Turkish, Spanish, German, or any other language in the output even if the source was in that language.

Domain hint: ${domainHint}
${strategyLine}

Use ONLY facts from this inventory — do not invent or infer:

${JSON.stringify(input.inventory, null, 2)}`.trim();
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
