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

function passesClientQualityRules(card: GeneratedLearnCard, documentTitle?: string): boolean {
  const question = card.question.trim();
  const answer = card.answer.trim();
  if (!question || !answer) return false;
  if (isAnswerIdenticalToQuestion(question, answer)) return false;
  if (sharedWordCount(question, answer) > 3) return false;
  if (/^significant changes occurred|changes occurred significantly/i.test(answer)) return false;
  if (
    documentTitle &&
    documentTitle.length >= 8 &&
    answer.toLowerCase().includes(documentTitle.toLowerCase().slice(0, 40))
  ) {
    return false;
  }
  const hasAnchor =
    /\b(19|20)\d{2}\b/.test(answer) ||
    /\b\d+([.,]\d+)?%?\b/.test(answer) ||
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(answer) ||
    /\b(because|led to|resulted|therefore|due to|caused)\b/i.test(answer);
  if (!hasAnchor) return false;
  if (/^what changed after\b/i.test(question)) return false;
  if (question.length > QUESTION_MAX || answer.length > ANSWER_MAX) return false;
  return true;
}

function personNamesInCard(card: GeneratedLearnCard): string[] {
  const text = `${card.question} ${card.answer}`;
  return (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? []).map((n) => n.toLowerCase());
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

    const names = personNamesInCard(generated);
    let personOk = true;
    for (const name of names) {
      const count = (personCardCount.get(name) ?? 0) + 1;
      if (count > 2) {
        personOk = false;
        break;
      }
    }
    if (!personOk) continue;

    const qKey = generated.question.toLowerCase();
    if (seenQuestions.has(qKey)) continue;
    seenQuestions.add(qKey);

    const providerType = mapToProviderType(generated.type);
    if (!providerType) continue;

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
