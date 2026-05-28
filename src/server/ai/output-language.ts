/**
 * SERVER ONLY — analysis output must be fluent native English (not literal translation).
 */

import { DEFAULT_OUTPUT_LANGUAGE } from "@/config/language";

/** Product-wide output style defaults (server-side). */
export const DEFAULT_OUTPUT_STYLE =
  "native English editorial intelligence (international-reader friendly)" as const;

export const NATIVE_ENGLISH_EDITORIAL_STYLE_POLICY = `Output style policy (mandatory):
- Summify product language is ${DEFAULT_OUTPUT_LANGUAGE}. Write EVERY user-facing generated field in fluent, native editorial ${DEFAULT_OUTPUT_LANGUAGE}.
- Regardless of the source language, do NOT produce a literal translation. Synthesize and rewrite as if you are drafting an original ${DEFAULT_OUTPUT_LANGUAGE} intelligence brief for an international reader.
- Do not preserve source-language sentence structure. Use natural ${DEFAULT_OUTPUT_LANGUAGE} syntax, rhythm, and phrasing.
- Do not leave untranslated source-language terms in the output unless they are:
  - proper names (people, organizations, clubs, brands)
  - official titles
  - standard English titles that are commonly used (use the standard English title if it exists)
  - direct quotes (only if you are quoting explicitly)
- If a local term is essential and has no clean English equivalent, keep it once and explain briefly in parentheses, then continue in ${DEFAULT_OUTPUT_LANGUAGE}.

Local reference normalization guidance:
- When the source uses local shorthand for events/periods (e.g., date-based labels, nicknames, political/cultural terms), normalize into globally understandable ${DEFAULT_OUTPUT_LANGUAGE}.
- Examples (guidance only; do not hardcode):
  - “3 Temmuz süreci” → “the July 3 investigations” / “the 2011 match-fixing investigation period” (choose based on context)
  - “kumpas” → “alleged conspiracy” / “politically charged investigation” / “legal campaign” (match the source’s framing)
  - “kurşunlanması” → “the armed attack on the team bus”
  - “saha içi / saha dışı” → “on-field / off-field”
  - “siyasi baskılar” → “political pressure”
  - “mali darboğaz” → “financial strain”
  - “kurumsallaşma” → “professionalization” / “institutional modernization”

Preserve fidelity and contested claims:
- Do not sanitize away meaning.
- For politically sensitive or contested assertions, attribute them (e.g., “The document argues…”, “The source frames…”, “According to the report…”).

Anti-mechanical phrasing:
- Avoid repetitive AI phrasing and label-like prefixes (e.g., do not start every risk with “Potential risk:”).
- Prefer natural editorial sentences and varied openings.`;

export const OUTPUT_QA_CHECKLIST = `Output QA (run internally before responding):
- Is every user-facing generated field written entirely in ${DEFAULT_OUTPUT_LANGUAGE}?
- Does it read like native ${DEFAULT_OUTPUT_LANGUAGE}, not like a translation?
- Are there any leaked source-language fragments (non-proper nouns) inside English fields?
- Are local references normalized and contextualized for an international reader?
- Are proper nouns preserved and quotes kept as quotes?
- Are claims attributed when the source is partisan/contested or evidence is thin?`;

export const ANALYSIS_OUTPUT_LANGUAGE_RULES = `Analysis output language (required for every source type):
- Write ALL structured analysis fields in fluent, native ${DEFAULT_OUTPUT_LANGUAGE}: title, summary, keyInsights, risksOrWarnings, actionItems, and every learnCards[].title and learnCards[].content.
- This is NOT translation: read and understand the source in its original language, then write original ${DEFAULT_OUTPUT_LANGUAGE} analysis.
- Source text and excerpts in the prompt may stay in the original language — do not mirror that language in your JSON output.
- Contextualize local references for international readers.
- Example: "3 Temmuz süreci" → "the July 3, 2011 investigations"
- Example: "kumpas" → "alleged conspiracy"
- Preserve proper nouns, brand names, product names, campaign names, and official titles exactly (original spelling).
- Do not translate brand, product, or campaign names into generic English unless they are clearly generic descriptors in the source.
- Avoid awkward literal translations, calques, transliteration clutter, and mixed-language hybrid phrasing (e.g. Turkish-English mashups).
- If a non-English term is essential for clarity, explain it once in brief English in parentheses, then continue in English.
- Keep the voice analytical and editorial — not translated or bilingual.`;

export const SOURCE_INPUT_LANGUAGE_NOTE = `Source language note:
- The material below may be in any language. Grounding excerpts and headings may appear in the original language.
- Interpret meaning from the source; express your analysis only in ${DEFAULT_OUTPUT_LANGUAGE} per the output language rules.`;
