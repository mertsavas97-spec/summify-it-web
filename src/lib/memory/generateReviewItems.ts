import { practicePromptForCard, resolveLearnStrategy } from "@/server/learn/applyModeLearnStrategy";
import { applyLearnCardQuality } from "@/server/learn/learnCardQuality";
import type { GeneratedReviewItem, ReviewSourceKind } from "@/types/memory";
import type { SavedAnalysisSummaryPayload } from "@/types/saved-analysis";
import type { LearnCardOutput } from "@/types/text-analysis";
import { parseQuizContent } from "@/types/text-analysis";

type ReviewGenerationInput = {
  summary: SavedAnalysisSummaryPayload;
  learnCards: LearnCardOutput[];
  maxItems?: number;
  intelligenceModeId?: string | null;
  structureFamily?: string | null;
  documentDomain?: string | null;
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

function learnCardToReviewItem(
  card: LearnCardOutput,
  index: number,
  strategy = resolveLearnStrategy({}),
): GeneratedReviewItem | null {
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

  const prompt = practicePromptForCard(card, strategy);

  return {
    source_kind: "learn_card",
    source_id: sourceId("learn_card", index, title),
    prompt,
    answer: content,
    context: title,
    seedCard: card,
  };
}

function insightSubject(insight: string): string | null {
  const match = insight.match(
    /\b([A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/,
  );
  return match?.[1]?.trim() ?? null;
}

function insightToReviewItem(insight: string, index: number): GeneratedReviewItem | null {
  const answer = cleanText(insight);
  if (answer.length < 24) return null;
  const subject = insightSubject(insight);
  const prompt = subject
    ? `What is the main takeaway about ${subject}?`
    : `What point does this source emphasize in: ${answer.slice(0, 72)}?`;
  return {
    source_kind: "key_insight",
    source_id: sourceId("key_insight", index, answer),
    prompt,
    answer,
    context: subject ?? "Key insight",
  };
}

function conceptFromCard(
  card: LearnCardOutput,
  index: number,
  strategy = resolveLearnStrategy({}),
): GeneratedReviewItem | null {
  const title = cleanText(card.title);
  const content = cleanText(card.content);
  if (!title || !content || !["concept", "connection", "why_it_matters", "why"].includes(card.type)) {
    return null;
  }
  if (strategy.promptStyle === "decision_recall" || strategy.id === "researcher") {
    return null;
  }
  const prompt =
    strategy.promptStyle === "active_recall" && !title.endsWith("?")
      ? `Why does ${title} matter in this source?`
      : practicePromptForCard(card, strategy);
  return {
    source_kind: "important_concept",
    source_id: sourceId("important_concept", index, title),
    prompt,
    answer: content,
    context: "Important concept",
  };
}

export function generateReviewItemsFromAnalysis({
  summary,
  learnCards,
  maxItems = DEFAULT_MAX_ITEMS,
  intelligenceModeId,
  structureFamily,
  documentDomain,
}: ReviewGenerationInput): GeneratedReviewItem[] {
  const strategy = resolveLearnStrategy({
    modeId: intelligenceModeId,
    structureFamily,
    domain: documentDomain,
  });

  const { cards: qualityCards } = applyLearnCardQuality(learnCards, {
    documentTitle: summary.title,
    summary: summary.summary,
    keyInsights: summary.keyInsights,
    targetMin: 2,
    targetMax: maxItems,
    strategy,
  });

  const items: GeneratedReviewItem[] = [];
  const seen = new Set<string>();

  qualityCards.forEach((card, index) => {
    const item = learnCardToReviewItem(card, index, strategy);
    if (item) pushUnique(items, seen, item);
  });

  if (strategy.id !== "executive" && strategy.id !== "researcher") {
    summary.keyInsights?.forEach((insight, index) => {
      const item = insightToReviewItem(insight, index);
      if (item) pushUnique(items, seen, item);
    });
  }

  qualityCards.forEach((card, index) => {
    const item = conceptFromCard(card, index, strategy);
    if (item) pushUnique(items, seen, item);
  });

  return items.slice(0, maxItems);
}
