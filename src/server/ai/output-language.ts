/**
 * SERVER ONLY — analysis output must be fluent English (not literal translation).
 */

export const ANALYSIS_OUTPUT_LANGUAGE_RULES = `Analysis output language (required for every source type):
- Write ALL structured analysis fields in fluent, native English: title, summary, keyInsights, risksOrWarnings, actionItems, and every learnCards[].title and learnCards[].content.
- This is NOT translation: read and understand the source in its original language, then write original English analysis.
- Source text and excerpts in the prompt may stay in the original language — do not mirror that language in your JSON output.
- Preserve proper nouns, brand names, product names, campaign names, and official titles exactly (original spelling).
- Do not translate brand, product, or campaign names into generic English unless they are clearly generic descriptors in the source.
- Avoid awkward literal translations, calques, transliteration clutter, and mixed-language hybrid phrasing (e.g. Turkish-English mashups).
- If a non-English term is essential for clarity, explain it once in brief English in parentheses, then continue in English.
- Keep the voice analytical and editorial — not translated or bilingual.`;

export const SOURCE_INPUT_LANGUAGE_NOTE = `Source language note:
- The material below may be in any language. Grounding excerpts and headings may appear in the original language.
- Interpret meaning from the source; express your analysis only in English per the output language rules.`;
