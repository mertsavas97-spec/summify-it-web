/**
 * Central rules: educational outputs are always fluent English unless a future
 * user-facing language preference overrides this default.
 */

import { DEFAULT_OUTPUT_LANGUAGE } from "@/config/language";
import {
  NATIVE_ENGLISH_EDITORIAL_STYLE_POLICY,
  OUTPUT_QA_CHECKLIST,
} from "@/server/ai/output-language";

export const LEARNING_OUTPUT_LANGUAGE = DEFAULT_OUTPUT_LANGUAGE;

/** Prompt block for Learn cards, quizzes, reflections, and practice outputs. */
export function normalizeLearningLanguage(): string {
  return `Learning output language (required):
- Write ALL educational outputs in fluent, native ${LEARNING_OUTPUT_LANGUAGE}.
- This includes Learn card titles and content, quiz questions and answers, explanations, reflection prompts, recaps, practice outputs, and "why it matters" sections.
- CRITICAL: All quiz questions, answer options, and explanations must be written in fluent native English regardless of the source document language. Do not leave untranslated fragments in any field.
- Read and understand source material in any language; express learning content only in ${LEARNING_OUTPUT_LANGUAGE}.
- This is NOT literal translation: write original ${LEARNING_OUTPUT_LANGUAGE} explanations grounded in the source.
- Preserve proper nouns, brand names, product names, and official titles in their original spelling when essential.
- Avoid translation artifacts, calques, transliteration clutter, and mixed-language phrasing within a single field.
- Do not mirror the source language in user-facing learning outputs.

${NATIVE_ENGLISH_EDITORIAL_STYLE_POLICY}

${OUTPUT_QA_CHECKLIST}`;
}

/** Companion note when source excerpts may be non-English. */
export function sourceLanguageGroundingNote(): string {
  return `Source language note:
- Source text and excerpts may be in any language. Detect and interpret meaning internally.
- Fact inventory may quote names and numbers as stated in the source.
- All flashcard questions, answers, and learning-facing strings must follow the learning output language rules (${LEARNING_OUTPUT_LANGUAGE} only).`;
}

/** Resolved language label for learn card generation APIs. */
export function getLearningOutputLanguageLabel(): string {
  return LEARNING_OUTPUT_LANGUAGE;
}
