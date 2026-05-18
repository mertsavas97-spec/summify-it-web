import type {
  AnalysisResult,
  LearnCard,
  LearnDepth,
  LearnCardType,
} from "@/core/types";

function generateCardId(): string {
  return `learn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type GenerateLearnParams = {
  analysis: AnalysisResult;
  depth?: LearnDepth;
  deferred?: boolean;
};

const DEPTH_CARD_COUNT: Record<LearnDepth, number> = {
  surface: 2,
  standard: 4,
  deep: 6,
};

const CARD_TYPES: LearnCardType[] = ["concept", "flashcard", "quiz", "timeline"];

/**
 * Mock deferred Learn generation — production queues after analysis completes.
 */
export function generateLearnMock({
  analysis,
  depth = "standard",
  deferred = true,
}: GenerateLearnParams): {
  cards: LearnCard[];
  deferred: boolean;
  scheduledAt: string;
} {
  const count = DEPTH_CARD_COUNT[depth];
  const now = new Date().toISOString();

  const cards: LearnCard[] = Array.from({ length: count }, (_, i) => {
    const section = analysis.sections[i % analysis.sections.length];
    const type = CARD_TYPES[i % CARD_TYPES.length];

    return {
      id: generateCardId(),
      documentId: analysis.documentId,
      type,
      front: section?.title ?? `Concept ${i + 1}`,
      back: section?.content ?? "Mock learn content.",
      depth,
      generatedAt: now,
    };
  });

  return {
    cards,
    deferred,
    scheduledAt: deferred
      ? new Date(Date.now() + 5000).toISOString()
      : now,
  };
}
