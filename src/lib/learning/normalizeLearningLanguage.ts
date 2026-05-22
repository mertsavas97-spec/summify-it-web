/**
 * Central rules: educational outputs are always fluent English unless a future
 * user-facing language preference overrides this default.
 */

export const LEARNING_OUTPUT_LANGUAGE = "English" as const;

/** Prompt block for Learn cards, quizzes, reflections, and practice outputs. */
export function normalizeLearningLanguage(): string {
  return `Learning output language (required):
- Write ALL educational outputs in fluent, native ${LEARNING_OUTPUT_LANGUAGE}.
- This includes Learn card titles and content, quiz questions and answers, explanations, reflection prompts, recaps, practice outputs, and "why it matters" sections.
- Read and understand source material in any language; express learning content only in ${LEARNING_OUTPUT_LANGUAGE}.
- This is NOT literal translation: write original ${LEARNING_OUTPUT_LANGUAGE} explanations grounded in the source.
- Preserve proper nouns, brand names, product names, and official titles in their original spelling when essential.
- Avoid translation artifacts, calques, transliteration clutter, and mixed-language phrasing within a single field.
- Do not mirror the source language in user-facing learning outputs.`;
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
