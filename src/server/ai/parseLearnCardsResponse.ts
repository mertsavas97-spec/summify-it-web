/**
 * Parse dedicated learn-card generation JSON ({ cards: [...] }).
 */

import {
  LEARN_CARD_OUTPUT_TYPES,
  type LearnCardOutput,
  type LearnCardOutputType,
} from "./schemas";
import { extractJsonFromText } from "./validate-response";
import { isGenericFlashcardPrompt, isStandaloneFlashcardQuestion } from "@/lib/learn/flashcardPair";
import { answerStartsAsCut, repairStudyCard } from "@/lib/learn/separateLearnCardCopy";

export type GeneratedLearnCard = {
  type: string;
  difficulty?: string;
  topic?: string;
  question: string;
  answer: string;
};

const OUTPUT_TYPES = new Set<string>(LEARN_CARD_OUTPUT_TYPES);

const EXTRACTION_TYPE_TO_PROVIDER: Record<string, LearnCardOutputType> = {
  fact: "concept",
  cause: "why",
  consequence: "why",
  // Link and Myth chips come from these — keep them distinct so a lens's
  // connection / misconception cards are not flattened into concept or why.
  connection: "connection",
  number: "quiz",
  // STEM / study inventory types (Phase-2 often emits these when strategyHint asks for them)
  definition: "concept",
  formula: "memory_hook",
  steps: "concept",
  step: "concept",
  contrast: "why",
  mechanism: "concept",
  method: "concept",
  quiz: "quiz",
  review_question: "quiz",
  misconception: "misconception",
  theme: "concept",
  character: "concept",
  symbol: "memory_hook",
  chronology: "memory_hook",
  cause_effect: "why",
  memory_hook: "memory_hook",
  creator_hook: "memory_hook",
};

function containsNonEnglishFragment(text: string): boolean {
  // Detect common Turkish characters that indicate untranslated content
  const turkishWordPattern = /[ğışöüçĞİŞÖÜÇ]{2,}|ş[a-z]+|ğ[a-z]+/;
  return turkishWordPattern.test(text);
}

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

/** Math / symbolic answers (e.g. "2x", "1 + 2 = X") count as grounded anchors. */
function hasMathOrSymbolAnchor(answer: string): boolean {
  const t = answer.trim();
  if (!t) return false;
  if (/[=+\-×÷*/^≠≈≤≥]/.test(t)) return true;
  if (/\b\d+[a-zA-Z]\b/.test(t)) return true; // 2x, 3y
  if (/\b[a-zA-Z]\s*=\s*/.test(t)) return true;
  if (/[α-ωΑ-Ω]/.test(t)) return true;
  return false;
}

function isStemExtractionType(type: string): boolean {
  const key = type.trim().toLowerCase();
  return (
    key === "definition" ||
    key === "formula" ||
    key === "steps" ||
    key === "step" ||
    key === "mechanism" ||
    key === "method"
  );
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
  const repaired = repairStudyCard(card.type, question, answer);
  if (repaired) {
    card.type = repaired.type;
    card.question = repaired.title;
    card.answer = repaired.content;
  }
  const repairedQuestion = card.question.trim();
  const repairedAnswer = card.answer.trim();
  if (
    !repaired ||
    isAnswerIdenticalToQuestion(repairedQuestion, repairedAnswer) ||
    answerStartsAsCut(repairedQuestion, repairedAnswer)
  ) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: isAnswerIdenticalToQuestion(question, answer) ? "identical" : "continuation",
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
  if (/^significant changes occurred|changes occurred significantly/i.test(repairedAnswer)) {
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
    hasLongWordInAnswer(answer) ||
    hasMathOrSymbolAnchor(answer) ||
    // STEM definitions/formulas/steps are inventory-grounded; don't drop short symbolic answers
    (isStemExtractionType(card.type) && answer.length >= 2);
  if (!hasAnchor) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "no_anchor",
    });
    return false;
  }
  if (
    /^what changed after\b/i.test(question) ||
    isGenericFlashcardPrompt(question) ||
    !isStandaloneFlashcardQuestion(question)
  ) {
    console.warn("[summify.parser] card_rejected", {
      question: card.question,
      answer: card.answer,
      rule: "banned_stem",
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

function mapToLearnCardType(raw: string): LearnCardOutputType | null {
  const key = raw.trim().toLowerCase();
  if (OUTPUT_TYPES.has(key)) return key as LearnCardOutputType;
  return EXTRACTION_TYPE_TO_PROVIDER[key] ?? null;
}

const GENERIC_TOPIC_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "these",
  "those",
  "what",
  "when",
  "which",
  "into",
  "over",
  "under",
  "general",
  "overview",
  "intro",
  "introduction",
]);

function textTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !GENERIC_TOPIC_WORDS.has(w)),
  );
}

function tokenOverlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared / Math.min(a.size, b.size);
}

function answerOf(card: LearnCardOutput): string {
  if (card.type === "quiz" && card.content.includes("\n---\n")) {
    return card.content.split("\n---\n").slice(1).join("\n---\n");
  }
  return card.content;
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
  /** Topic key per kept card — parallel to `out` for duplicate-topic checks. */
  const outTopics: string[] = [];
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
      question: c.question.trim(),
      answer: c.answer.trim(),
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

    // Same fact in different words: question, answer, or topic collision
    // against a card that was already kept in this deck.
    const qTokens = textTokens(generated.question);
    const aTokens = textTokens(generated.answer);
    const topicKey = (generated.topic ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    const repeated = out.some((kept, index) => {
      const keptQ = textTokens(kept.title);
      const keptA = textTokens(answerOf(kept));
      const questionOverlap = tokenOverlapRatio(qTokens, keptQ);
      const answerOverlap = tokenOverlapRatio(aTokens, keptA);
      if (questionOverlap >= 0.55) return true;
      if (answerOverlap >= 0.65) return true;
      // Same topic + the answers share substance = the same fact twice.
      if (topicKey && outTopics[index] === topicKey && answerOverlap >= 0.4) return true;
      return false;
    });
    if (repeated) {
      console.warn("[summify.parser] card_rejected", {
        question: generated.question,
        answer: generated.answer,
        rule: "duplicate_semantic",
        topic: topicKey || undefined,
      });
      continue;
    }
    seenQuestions.add(qKey);

    const providerType = mapToLearnCardType(generated.type);
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

    // Monitoring only: warn about possible untranslated fragments leaking into Q/A.
    // Do NOT reject automatically — this is a heuristic.
    if (containsNonEnglishFragment(generated.question)) {
      console.warn(
        "[learn-cards] Possible untranslated fragment detected:",
        generated.question.slice(0, 80),
      );
    }
    if (containsNonEnglishFragment(generated.answer)) {
      console.warn(
        "[learn-cards] Possible untranslated fragment detected:",
        generated.answer.slice(0, 80),
      );
    }

    for (const name of names) {
      personCardCount.set(name, (personCardCount.get(name) ?? 0) + 1);
    }

    out.push(card);
    outTopics.push(topicKey);
    if (options?.maxCards && out.length >= options.maxCards) break;
  }

  return out;
}
