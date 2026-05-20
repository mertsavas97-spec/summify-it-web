/**
 * Distinguish duplicate cognitive questions from same-topic multi-angle cards.
 */

import type { LearnCardOutput } from "@/types/text-analysis";
import type { LearnCandidate } from "./types";

function questionStem(title: string): string {
  const t = title.toLowerCase().trim();
  if (/^why\b|\bwhy did\b|\bwhy was\b|\bwhy does\b|\bwhy is\b/.test(t)) return "why";
  if (/^how\b|\bhow did\b|\bhow does\b|\bhow do\b/.test(t)) return "how";
  if (/^what changed\b|\bwhat happened\b|\bwhat shifted\b/.test(t)) return "what-changed";
  if (/^what\b|\bwhat is\b|\bwhat was\b|\bwhat defines\b/.test(t)) return "what";
  if (/^when\b|\bwhich period\b|\bwhich era\b/.test(t)) return "when";
  if (/^which\b/.test(t)) return "which";
  if (/^who\b/.test(t)) return "who";
  if (/^contrast\b|\bversus\b|\bcompared to\b/.test(t)) return "contrast";
  return "recall";
}

/** Stable key: same key => same cognitive question (duplicate); different key => keep both. */
export function cognitiveQuestionKey(
  card: Pick<LearnCandidate, "title" | "kind" | "learnPattern" | "content">,
): string {
  const stem = questionStem(card.title);
  const pattern = (card.learnPattern ?? card.kind ?? "concept").toLowerCase();
  const entityHint = (card.title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/) ?? [])[0]
    ?.toLowerCase()
    .slice(0, 32);
  return `${stem}|${pattern}|${entityHint ?? "general"}`;
}

export function cognitiveQuestionKeyFromOutput(
  card: Pick<LearnCardOutput, "title" | "type" | "learnPattern" | "content">,
): string {
  const kind =
    card.type === "why"
      ? "why_it_matters"
      : (card.type as LearnCandidate["kind"]);
  return cognitiveQuestionKey({
    title: card.title,
    kind,
    learnPattern: card.learnPattern,
    content: card.content,
  });
}

export function isSameCognitiveQuestion(
  a: Pick<LearnCardOutput, "title" | "type" | "learnPattern" | "content">,
  b: Pick<LearnCardOutput, "title" | "type" | "learnPattern" | "content">,
): boolean {
  return cognitiveQuestionKeyFromOutput(a) === cognitiveQuestionKeyFromOutput(b);
}
