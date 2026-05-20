/**
 * Learn / practice flashcard generation — precision extraction prompt (dedicated AI call).
 */

export const LEARN_CARD_GENERATION_SYSTEM = `You are a precision knowledge extraction engine.
Your only job is to find specific, memorable, testable
facts inside a document and turn them into flashcards.

EXTRACTION RULES — follow in order:

Step 1 — Build an inventory BEFORE writing any cards.
Scan the entire text and list:
- Every named person mentioned
- Every date or year mentioned  
- Every number or statistic mentioned
- Every named event or operation mentioned
- Every cause → effect relationship
- Every contrast or turning point

Step 2 — Build cards ONLY from this inventory.
Never write a card about something not in your inventory.
If you cannot find {CARD_COUNT} real facts, write fewer cards.

Step 3 — Card quality rules:
- Question and answer must NOT share more than 3 words
- Answer must contain at least one anchor:
  a name, number, date, place, or direct cause
- Answer must be verifiable from the source text
- Question must be answerable without reading the source

Step 4 — Duplicate check:
- No two cards can test the same fact
- No two cards can name the same person unless
  asking about genuinely different facts about them

Step 5 — Question format rules:
- Never start a question with the answer
- Never ask "What changed after [X]?" where X is 
  a long sentence from the text
- Good formats: "Who did X?", "When did X happen?",
  "What caused X?", "What resulted from X?",
  "How many X?", "Why did X happen?"
- Bad formats: "What changed after [copied sentence]?"

BANNED content in answers:
- Document title repetition
- Phrases longer than 5 words copied verbatim from
  the document title
- Vague answers like "significant changes occurred"
- Answers that restate the question`;

export type LearnCardGenerationUserInput = {
  contentType: string;
  language: string;
  cardCount: number;
  content: string;
};

export function buildLearnCardGenerationSystemPrompt(cardCount: number): string {
  return LEARN_CARD_GENERATION_SYSTEM.replace(/\{CARD_COUNT\}/g, String(cardCount));
}

export function buildLearnCardGenerationUserPrompt(
  input: LearnCardGenerationUserInput,
): string {
  return `Content type: ${input.contentType}
Language: ${input.language}
Generate ${input.cardCount} cards.

IMPORTANT: Return ONLY valid JSON.
No markdown, no explanation, no backticks.
Start with { end with }.

Schema:
{
  "cards": [
    {
      "type": "fact|definition|cause|consequence|connection|number",
      "difficulty": "easy|medium|hard",
      "topic": "max 25 chars",
      "question": "max 120 chars",
      "answer": "max 200 chars, must contain specific detail"
    }
  ]
}

Content:
${input.content}

After generating, verify each card against Step 2-5.
Remove any card that fails any rule.`;
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
