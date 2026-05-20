import type {
  LearnCognitiveLevel,
  LearnRetrievalType,
  LearnSourceTrace,
  RecallDifficultyLevel,
} from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import { parsePracticeReviewContext } from "@/lib/learn/practiceReviewContext";

/** Serializable card for client-side practice sessions. */
export type PracticeSessionCard = {
  id: string;
  prompt: string;
  answer: string;
  label?: string;
  recallDifficulty?: RecallDifficultyLevel;
  retrievalType?: LearnRetrievalType;
  cognitiveLevel?: LearnCognitiveLevel;
  sourceTrace?: LearnSourceTrace;
};

export type PracticeCardOutcome = "got_it" | "review_again" | "skipped";

export function estimatePracticeMinutes(cardCount: number): string {
  if (cardCount <= 0) return "~1 min";
  const seconds = Math.max(60, cardCount * 22);
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes <= 8 ? `~${minutes} min` : `~${minutes} min`;
}

function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchLearnCard(
  prompt: string,
  answer: string,
  learnCards: LearnCardOutput[],
): LearnCardOutput | undefined {
  const key = normalizeKey(prompt);
  for (const card of learnCards) {
    if (normalizeKey(card.title) === key) return card;
    if (card.type === "quiz" && card.content.includes("---")) {
      const q = card.content.split("\n---\n")[0]?.trim();
      if (q && normalizeKey(q) === key) return card;
    }
  }
  for (const card of learnCards) {
    if (normalizeKey(`${card.title} ${card.content}`).includes(key.slice(0, 40))) return card;
    if (normalizeKey(card.content).includes(normalizeKey(answer).slice(0, 48))) return card;
  }
  return undefined;
}

export function buildPracticeSessionCardsFromLearn(
  learnCards: LearnCardOutput[],
): PracticeSessionCard[] {
  return learnCards.map((card, index) => {
    const isQuiz = card.type === "quiz";
    const quizParts = isQuiz ? card.content.split("\n---\n") : null;
    return {
      id: card.cardId ?? `learn_${index}`,
      prompt: isQuiz && quizParts?.[0] ? quizParts[0].trim() : card.title,
      answer: isQuiz && quizParts?.[1] ? quizParts[1].trim() : card.content,
      label: card.title,
      recallDifficulty: card.recallDifficulty,
      retrievalType: card.retrievalType,
      cognitiveLevel: card.cognitiveLevel,
      sourceTrace: card.sourceTrace,
    };
  });
}

export function enrichReviewItemsAsPracticeCards(
  items: Array<{ id: string; prompt: string; answer: string; context: string | null }>,
  learnCards: LearnCardOutput[],
): PracticeSessionCard[] {
  return items.map((item) => {
    const parsed = parsePracticeReviewContext(item.context);
    const matched = matchLearnCard(item.prompt, item.answer, learnCards);
    return {
      id: item.id,
      prompt: item.prompt,
      answer: item.answer,
      label: parsed.label,
      recallDifficulty: matched?.recallDifficulty,
      retrievalType: matched?.retrievalType,
      cognitiveLevel: matched?.cognitiveLevel,
      sourceTrace: parsed.trace ?? matched?.sourceTrace,
    };
  });
}

export function sortPracticeSessionCards(cards: PracticeSessionCard[]): PracticeSessionCard[] {
  const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  return [...cards].sort((a, b) => {
    const da = difficultyOrder[a.recallDifficulty ?? "medium"] ?? 1;
    const db = difficultyOrder[b.recallDifficulty ?? "medium"] ?? 1;
    if (da !== db) return da - db;
    return a.prompt.localeCompare(b.prompt);
  });
}
