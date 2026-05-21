/**
 * Parse dedicated learn-card generation JSON ({ cards: [...] }).
 */

import {
  LEARN_CARD_PROVIDER_TYPES,
  type LearnCardOutput,
  type LearnCardProviderType,
} from "./schemas";
import { extractJsonFromText } from "./validate-response";

export type GeneratedLearnCard = {
  type: string;
  difficulty?: string;
  topic?: string;
  question: string;
  answer: string;
};

const PROVIDER_TYPES = new Set<string>(LEARN_CARD_PROVIDER_TYPES);

const EXTRACTION_TYPE_TO_PROVIDER: Record<string, LearnCardProviderType> = {
  fact: "concept",
  cause: "why",
  consequence: "why",
  connection: "concept",
  number: "quiz",
};

const QUESTION_MAX = 80;
const ANSWER_MAX = 160;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sharedWordCount(a: string, b: string): number {
  const words = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const wa = words(a);
  const wb = words(b);
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared += 1;
  return shared;
}

function normalizeCardText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase().replace(/\?+$/, "");
}

function isAnswerIdenticalToQuestion(question: string, answer: string): boolean {
  return normalizeCardText(question) === normalizeCardText(answer);
}

function isQuizGenerationType(type: string): boolean {
  const key = type.trim().toLowerCase();
  return key === "quiz" || key === "number";
}

/** Shared token (>5 chars) in Q and A — non-English names, technical terms, etc. */
function hasSharedLongWordAnchor(question: string, answer: string): boolean {
  const longWords = (text: string) =>
    new Set(
      (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length > 5),
    );
  const inQuestion = longWords(question);
  for (const w of longWords(answer)) {
    if (inQuestion.has(w)) return true;
  }
  return false;
}

/** Answer-only: any token longer than 6 chars (e.g. allegations, technical terms). */
function hasLongWordInAnswer(answer: string): boolean {
  const tokens = answer.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return tokens.some((w) => w.length > 6);
}

function passesClientQualityRules(card: GeneratedLearnCard, documentTitle?: string): boolean {
  const question = card.question.trim();
  const answer = card.answer.trim();
  if (!question || !answer) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "empty",
    });
    return false;
  }
  if (
    isAnswerIdenticalToQuestion(question, answer) &&
    !isQuizGenerationType(card.type)
  ) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "identical",
    });
    return false;
  }
  if (sharedWordCount(question, answer) > 6) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "overlap",
    });
    return false;
  }
  if (/^significant changes occurred|changes occurred significantly/i.test(answer)) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "banned_phrase",
    });
    return false;
  }
  if (
    documentTitle &&
    documentTitle.length >= 8 &&
    answer.toLowerCase().includes(documentTitle.toLowerCase().slice(0, 40))
  ) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "title_repeat",
    });
    return false;
  }
  const hasAnchor =
    /\b(19|20)\d{2}\b/.test(answer) ||
    /\b\d+([.,]\d+)?%?\b/.test(answer) ||
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(answer) ||
    /\b(because|led to|resulted|therefore|due to|caused)\b/i.test(answer) ||
    hasSharedLongWordAnchor(question, answer) ||
    hasLongWordInAnswer(answer);
  if (!hasAnchor) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "no_anchor",
    });
    return false;
  }
  if (/^what changed after\b/i.test(question)) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "banned_stem",
    });
    return false;
  }
  if (question.length > QUESTION_MAX || answer.length > ANSWER_MAX) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "length",
    });
    return false;
  }
  return true;
}

/** Two-word capitalized phrases that are places/orgs/topics, not person names. */
const NON_PERSON_NAME_STOP_LIST = new Set([
  "new york",
  "los angeles",
  "san francisco",
  "hong kong",
  "united states",
  "united kingdom",
  "south korea",
  "north korea",
  "south africa",
  "middle east",
  "north america",
  "south america",
  "latin america",
  "european union",
  "silicon valley",
  "wall street",
  "white house",
  "supreme court",
  "west coast",
  "east coast",
  "world bank",
  "prime minister",
  "chief executive",
  "public health",
  "climate change",
  "artificial intelligence",
  "machine learning",
  "social media",
  "supply chain",
  "cash flow",
  "interest rate",
  "stock market",
  "real estate",
]);

function normalizePersonNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function isNameInDocumentTitle(name: string, documentTitle?: string): boolean {
  if (!documentTitle || documentTitle.length < 4) return false;
  const nameKey = normalizePersonNameKey(name);
  if (nameKey.length < 3) return false;
  return documentTitle.toLowerCase().includes(nameKey);
}

function isNonPersonProperNoun(name: string): boolean {
  return NON_PERSON_NAME_STOP_LIST.has(normalizePersonNameKey(name));
}

function personNamesInCard(card: GeneratedLearnCard, documentTitle?: string): string[] {
  const text = `${card.question} ${card.answer}`;
  const seen = new Set<string>();
  const names: string[] = [];

  for (const match of text.matchAll(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g)) {
    const name = normalizePersonNameKey(match[0]);
    if (seen.has(name)) continue;
    if (isNameInDocumentTitle(name, documentTitle)) continue;
    if (isNonPersonProperNoun(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}

function mapToProviderType(raw: string): LearnCardProviderType | null {
  const key = raw.trim().toLowerCase();
  if (PROVIDER_TYPES.has(key)) return key as LearnCardProviderType;
  return EXTRACTION_TYPE_TO_PROVIDER[key] ?? null;
}

/** Count `cards` array entries in Phase 2 JSON before quality filtering. */
export function countRawCardsInGenerationResponse(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  try {
    const parsed = JSON.parse(extractJsonFromText(raw)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return 0;
    return Array.isArray(parsed.cards) ? parsed.cards.length : 0;
  } catch {
    return 0;
  }
}

export function parseLearnCardsGenerationResponse(
  raw: string,
  options?: { documentTitle?: string; maxCards?: number },
): LearnCardOutput[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonFromText(raw));
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object") return [];
  const obj = parsed as Record<string, unknown>;
  const list = Array.isArray(obj.cards) ? obj.cards : [];

  const out: LearnCardOutput[] = [];
  const seenQuestions = new Set<string>();
  const personCardCount = new Map<string, number>();

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    if (!isNonEmptyString(c.question) || !isNonEmptyString(c.answer)) continue;

    const generated: GeneratedLearnCard = {
      type: typeof c.type === "string" ? c.type : "fact",
      difficulty: typeof c.difficulty === "string" ? c.difficulty : undefined,
      topic: typeof c.topic === "string" ? c.topic : undefined,
      question: c.question.trim().slice(0, QUESTION_MAX),
      answer: c.answer.trim().slice(0, ANSWER_MAX),
    };

    if (!passesClientQualityRules(generated, options?.documentTitle)) continue;

    if (
      isQuizGenerationType(generated.type) &&
      isAnswerIdenticalToQuestion(generated.question, generated.answer)
    ) {
      generated.type = "fact";
    }

    const names = personNamesInCard(generated, options?.documentTitle);
    let personOk = true;
    for (const name of names) {
      const count = (personCardCount.get(name) ?? 0) + 1;
      if (count > 2) {
        console.warn("[summify.parser] card_rejected", {
          question: generated.question,
          answer: generated.answer,
          rule: "person_name_limit",
          name,
          count,
        });
        personOk = false;
        break;
      }
    }
    if (!personOk) continue;

    const qKey = generated.question.toLowerCase();
    if (seenQuestions.has(qKey)) {
      console.warn("[summify.parser] card_rejected", {
        question: generated.question,
        answer: generated.answer,
        rule: "duplicate_question",
      });
      continue;
    }
    seenQuestions.add(qKey);

    const providerType = mapToProviderType(generated.type);
    if (!providerType) {
      console.warn("[summify.parser] card_rejected", {
        question: generated.question,
        answer: generated.answer,
        rule: "unknown_type",
        type: generated.type,
      });
      continue;
    }

    const card: LearnCardOutput = {
      type: providerType,
      title: generated.question,
      content:
        providerType === "quiz"
          ? `${generated.question}\n---\n${generated.answer}`
          : generated.answer,
    };

    for (const name of names) {
      personCardCount.set(name, (personCardCount.get(name) ?? 0) + 1);
    }

    out.push(card);
    if (options?.maxCards && out.length >= options.maxCards) break;
  }

  return out;
}
