import type { GeneratedReviewItem, ReviewSourceKind } from "@/types/memory";
import type { SavedAnalysisSummaryPayload } from "@/types/saved-analysis";
import type { LearnCardOutput } from "@/types/text-analysis";
import { parseQuizContent } from "@/types/text-analysis";

type ReviewGenerationInput = {
  summary: SavedAnalysisSummaryPayload;
  learnCards: LearnCardOutput[];
  maxItems?: number;
};

const DEFAULT_MAX_ITEMS = 16;

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function sourceId(kind: ReviewSourceKind, index: number, title: string): string {
  const slug = cleanText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 52);
  return `${kind}:${index}:${slug || "item"}`;
}

function pushUnique(
  items: GeneratedReviewItem[],
  seen: Set<string>,
  item: GeneratedReviewItem,
) {
  const key = `${item.prompt.toLowerCase()}::${item.answer.toLowerCase()}`;
  if (seen.has(key)) return;
  if (!item.prompt || !item.answer) return;
  seen.add(key);
  items.push(item);
}

function learnCardToReviewItem(card: LearnCardOutput, index: number): GeneratedReviewItem | null {
  const title = cleanText(card.title);
  const content = cleanText(card.content);
  if (!title || !content) return null;

  if (card.type === "quiz") {
    const parsed = parseQuizContent(card.content);
    const question = cleanText(parsed.question);
    const answer = cleanText(parsed.answer ?? card.title);
    if (!question || !answer) return null;
    return {
      source_kind: "learn_card",
      source_id: sourceId("learn_card", index, title),
      prompt: question,
      answer,
      context: title,
      seedCard: card,
    };
  }

  const prompt =
    card.type === "memory_hook"
      ? `What memory hook helps recall ${title}?`
      : card.type === "misconception"
        ? `What misconception should you avoid about ${title}?`
        : `Explain ${title}.`;

  return {
    source_kind: "learn_card",
    source_id: sourceId("learn_card", index, title),
    prompt,
    answer: content,
    context: title,
    seedCard: card,
  };
}

function insightToReviewItem(insight: string, index: number): GeneratedReviewItem | null {
  const answer = cleanText(insight);
  if (answer.length < 24) return null;
  return {
    source_kind: "key_insight",
    source_id: sourceId("key_insight", index, answer),
    prompt: "What is the key insight?",
    answer,
    context: "Key insight",
  };
}

function conceptFromCard(card: LearnCardOutput, index: number): GeneratedReviewItem | null {
  const title = cleanText(card.title);
  const content = cleanText(card.content);
  if (!title || !content || !["concept", "connection", "why_it_matters", "why"].includes(card.type)) {
    return null;
  }
  return {
    source_kind: "important_concept",
    source_id: sourceId("important_concept", index, title),
    prompt: `Why does ${title} matter?`,
    answer: content,
    context: "Important concept",
  };
}

export function generateReviewItemsFromAnalysis({
  summary,
  learnCards,
  maxItems = DEFAULT_MAX_ITEMS,
}: ReviewGenerationInput): GeneratedReviewItem[] {
  const items: GeneratedReviewItem[] = [];
  const seen = new Set<string>();

  learnCards.forEach((card, index) => {
    const item = learnCardToReviewItem(card, index);
    if (item) pushUnique(items, seen, item);
  });

  summary.keyInsights?.forEach((insight, index) => {
    const item = insightToReviewItem(insight, index);
    if (item) pushUnique(items, seen, item);
  });

  learnCards.forEach((card, index) => {
    const item = conceptFromCard(card, index);
    if (item) pushUnique(items, seen, item);
  });

  return items.slice(0, maxItems);
}
