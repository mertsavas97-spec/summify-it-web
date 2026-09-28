import { repairStudyCard } from "@/lib/learn/separateLearnCardCopy";
import { parseQuizContent, type LearnCardOutput } from "@/types/text-analysis";

/**
 * Drop learn cards that show the same fact. Comparison uses the text the
 * reader actually sees, so a Why question and a concept card about the same
 * sentence count as one card across every analysis mode.
 */

const STOP = new Set([
  "why",
  "how",
  "did",
  "does",
  "was",
  "were",
  "are",
  "the",
  "and",
  "that",
  "with",
  "from",
  "this",
  "have",
  "been",
  "into",
  "than",
  "then",
  "they",
  "their",
  "what",
  "when",
  "which",
  "matter",
  "matters",
  "here",
]);

export function visibleLearnCopy(card: LearnCardOutput): { title: string; content: string } {
  if (card.type === "quiz") {
    const quiz = parseQuizContent(card.content);
    return {
      title: card.title.trim(),
      content: `${quiz.question} ${quiz.answer ?? ""}`.trim(),
    };
  }
  const repaired = repairStudyCard(card.type, card.title, card.content);
  return repaired ?? { title: "", content: "" };
}

function compact(text: string): string {
  return text
    .toLowerCase()
    .replace(/→|=>/g, " led to ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): Set<string> {
  return new Set(
    compact(text)
      .split(" ")
      .filter((word) => word.length > 3 && !STOP.has(word)),
  );
}

function overlap(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) {
    if (right.has(word)) shared += 1;
  }
  return shared / Math.min(left.size, right.size);
}

function whyEventKey(title: string): string | null {
  const text = compact(title);
  if (!/^(why|how)\b/.test(text)) return null;
  const event = text
    .replace(/\b(why|how|did|does|do|was|were|is|are|matter|matters|here)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return event.length >= 8 ? event : null;
}

function sameLearnFact(
  a: { title: string; content: string },
  b: { title: string; content: string },
): boolean {
  const titleA = compact(a.title);
  const titleB = compact(b.title);
  if (titleA.length >= 12 && titleA === titleB) return true;

  const eventA = whyEventKey(a.title);
  const eventB = whyEventKey(b.title);
  if (eventA && eventA === eventB) return true;

  const bodyA = compact(a.content);
  const bodyB = compact(b.content);
  const shorter = Math.min(bodyA.length, bodyB.length);
  if (shorter >= 48 && (bodyA.includes(bodyB) || bodyB.includes(bodyA))) return true;

  const bodyOverlap = overlap(a.content, b.content);
  if (bodyOverlap >= 0.72 && Math.min(tokens(a.content).size, tokens(b.content).size) >= 6) {
    return true;
  }

  return overlap(`${a.title} ${a.content}`, `${b.title} ${b.content}`) >= 0.84;
}

function cardScore(card: LearnCardOutput, visible: { title: string; content: string }): number {
  let score = visible.content.length;
  if (/^(why|how)\b/i.test(visible.title)) score += 48;
  if (card.type === "quiz") score += 12;
  return score;
}

export function uniqueLearnCards(cards: LearnCardOutput[]): LearnCardOutput[] {
  const kept: Array<{ card: LearnCardOutput; visible: { title: string; content: string } }> = [];

  for (const card of cards) {
    const repaired = repairStudyCard(card.type, card.title, card.content);
    if (!repaired) continue;
    const visible = { title: repaired.title, content: repaired.content };
    const stored = {
      ...card,
      type: repaired.type as LearnCardOutput["type"],
      title: repaired.title,
      content: repaired.content,
    };
    const duplicateAt = kept.findIndex((item) => sameLearnFact(item.visible, visible));
    if (duplicateAt >= 0) {
      if (cardScore(stored, visible) > cardScore(kept[duplicateAt].card, kept[duplicateAt].visible)) {
        kept[duplicateAt] = { card: stored, visible };
      }
      continue;
    }
    kept.push({ card: stored, visible });
  }

  return kept.map((item) => item.card);
}
