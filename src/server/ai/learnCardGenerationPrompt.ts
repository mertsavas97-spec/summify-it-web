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

export const PHASE2_FLASHCARD_SYSTEM = `You are a flashcard writer. Your input is a fact inventory JSON, plus optional summary and source excerpt for depth.
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

Question and answer, for every card type (concept, why, quiz, memory hook, misconception):
- The question is one complete question. It ends with a question mark.
- The answer is one complete statement. It does not start with "and", "which", or "that".
- Do not split one sentence across the question and the answer.
- The answer must add the fact. It must not repeat or finish the question's wording.
- Name the specific term, person, number, cause, or step from that inventory fact.
- Vary the sentence. Ask for a definition, a cause, a result, a comparison, or a calculation only when the fact itself calls for it.
- Do not reuse one shell such as "Which statement is best supported", "Which insight is supported", "What claim does the source make", or "What is the most important idea".
- Do not clip either sentence to fit a character count.
- Never copy a sentence from the inventory as the question stem
- Never start with "What changed after [long clause]?"

Answer format:
- Must contain at least one anchor from the inventory
  (a name, number, year, place, definition phrase, formula expression, or step)
- Must not restate the question
- Answer must not be identical to the question
- Must not repeat the document title
- Write the full answer. Do not cut it off to fit a character count.

Quiz cards (type "quiz"):
- For cards with type 'quiz', the answer must be the actual answer to the question — a specific fact, number, name, date, definition, or formula. Never use the question text as the answer.

Deduplication:
- No two cards may test the same fact
- No two cards may ask the same question in different words
- A person may appear in at most 2 cards, each testing a different fact
- Prefer definition/formula/step cards when those inventory arrays are non-empty.
CRITICAL: Use ONLY terms, formulas, examples, and steps present in the inventory.
Do NOT invent topics (e.g. quadratic equations, telescope lenses) if they are absent from the inventory.

Depth — every card must be worth memorizing:
- The answer must stand alone: state the fact, then the mechanism, cause, or consequence behind it.
- Ground the explanation in the source excerpt when one is provided; do not invent reasoning the source does not support.
- A card that is only a restatement of the inventory line is too shallow. Add the why or the how.
- Never write a card that could be answered the same way for any other document.

Generic questions are rejected — never write these shells:
"According to the text…", "Based on the source…", "What does the source say…",
"What is the main point of the document", "Which statement is best supported by the source",
"What is the most important idea", "Why does this matter", "What should you remember",
"How would you summarize this", "Can you explain", "Tell me about", "What do you know about",
"What is the purpose of the text", "Which of the following", "What can be learned from this".
Every question must name a specific term, person, number, event, or formula from the inventory.

Return ONLY valid JSON. No markdown, no explanation.
Start with { end with }.

Schema:
{
  "cards": [
    {
      "type": "fact|cause|consequence|number|connection|definition|formula|steps|contrast|quiz|mechanism|method|misconception|memory_hook",
      "difficulty": "easy|medium|hard",
      "topic": "the specific term or event this card tests",
      "question": "one complete exam question",
      "answer": "the full source-grounded answer"
    }
  ]
}`;

export type Phase2FlashcardUserInput = {
  cardCount: number;
  language: string;
  inventory: FactInventory;
  domainHint?: string;
  strategyHint?: string;
  /** Extra writer rules for a specific card pass. */
  cardBrief?: string;
  /** Written summary — context for depth. Never copied verbatim into a card. */
  summary?: string;
  /** Bounded source excerpt — grounding for mechanism / cause / consequence answers. */
  sourceExcerpt?: string;
};

export function buildPhase2FlashcardUserPrompt(input: Phase2FlashcardUserInput): string {
  const language = input.language || getLearningOutputLanguageLabel();
  const domainHint = input.domainHint ?? inferInventoryDomainHint(input.inventory);
  const strategyLine = input.strategyHint
    ? `Strategy hint: ${input.strategyHint}`
    : "";
  const brief = input.cardBrief ? `\n${input.cardBrief}\n` : "";
  const summarySection = input.summary?.trim()
    ? `\nWRITTEN SUMMARY (context for depth — do not copy sentences verbatim into cards):\n${input.summary.trim()}\n`
    : "";
  const excerptSection = input.sourceExcerpt?.trim()
    ? `\nSOURCE EXCERPT (grounding — use it to explain mechanism, cause, and consequence in answers; do not invent beyond it):\n${input.sourceExcerpt.trim()}\n`
    : "";

  return `Generate ${input.cardCount} flashcards.
Language: ${language} (required — all question and answer text)

Write all questions and answers in English.
Do not use Turkish, Spanish, German, or any other language in the output even if the source was in that language.

Domain hint: ${domainHint}
${strategyLine}
${brief}
${summarySection}
${excerptSection}
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
