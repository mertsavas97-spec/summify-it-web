import type { LearnCardOutput } from "@/types/text-analysis";
import { parseQuizContent } from "@/types/text-analysis";

export type InvalidLearnCardReason = "missing_question" | "missing_answer";

export type LearnCardValidationResult =
  | { valid: true }
  | { valid: false; reason: InvalidLearnCardReason };

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function logInvalidCard(reason: InvalidLearnCardReason, card: LearnCardOutput, context?: string): void {
  if (!isDevelopment()) return;
  console.warn("[learn-cards] invalid card filtered", {
    reason,
    context: context ?? null,
    type: card.type,
    title: card.title,
  });
}

export function validateLearnCard(card: LearnCardOutput): LearnCardValidationResult {
  const question = card.type === "quiz" ? parseQuizContent(card.content).question : card.title;
  const answer = card.type === "quiz" ? parseQuizContent(card.content).answer ?? "" : card.content;

  if (!question || question.trim().length === 0) {
    return { valid: false, reason: "missing_question" };
  }

  if (!answer || answer.trim().length === 0) {
    return { valid: false, reason: "missing_answer" };
  }

  return { valid: true };
}

export function filterValidLearnCards(cards: LearnCardOutput[], context?: string): LearnCardOutput[] {
  return cards.filter((card) => {
    const validation = validateLearnCard(card);
    if (!validation.valid) {
      logInvalidCard(validation.reason, card, context);
      return false;
    }
    return true;
  });
}
