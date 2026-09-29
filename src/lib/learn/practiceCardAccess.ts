import { getMaxLearnCardsForPlan } from "@/lib/plan-features";
import { filterValidLearnCards } from "@/lib/learn/learnCardValidation";
import type { PlanId } from "@/types/plan";
import type { LearnCardOutput } from "@/types/text-analysis";

/** Free / beta users can practice this many cards per analysis. */
export const FREE_PRACTICE_ACCESSIBLE_COUNT = 12;

export type PracticeCardAccess = {
  allCards: LearnCardOutput[];
  accessibleCards: LearnCardOutput[];
  /** Locked previews — content stripped for client safety. */
  lockedCards: LearnCardOutput[];
  totalCount: number;
  accessibleCount: number;
  lockedCount: number;
  isLimited: boolean;
};

export type PracticeAccessMeta = {
  plan: PlanId;
  totalGeneratedCards: number;
  accessibleCardCount: number;
  lockedCardCount: number;
  isLimited: boolean;
};

/** Max cards to generate during analysis (full set for upsell previews). */
export function getLearnCardsGenerationCap(): number {
  return getMaxLearnCardsForPlan("pro");
}

export function hasFullPracticeAccess(planId: PlanId): boolean {
  return planId === "pro" || planId === "scholar" || planId === "team";
}

export function getMaxAccessiblePracticeCards(planId: PlanId, totalCards: number): number {
  if (hasFullPracticeAccess(planId)) {
    return Math.min(totalCards, getMaxLearnCardsForPlan(planId));
  }
  return Math.min(FREE_PRACTICE_ACCESSIBLE_COUNT, totalCards);
}

/** English upsell shown beside blurred flashcards on free / beta. */
export function lockedFlashcardUpsellLabel(lockedCount: number): string {
  const noun = lockedCount === 1 ? "flashcard" : "flashcards";
  return `+${lockedCount} more ${noun} with Pro`;
}

/** Strip answer content from locked cards before sending to the client. */
export function toLockedLearnPreview(card: LearnCardOutput): LearnCardOutput {
  return {
    type: card.type,
    title: card.title,
    content: "",
    cardId: card.cardId,
    recallDifficulty: card.recallDifficulty,
    difficulty: card.difficulty,
    isLockedPreview: true,
  };
}

export function getPracticeCardAccessForPlan(
  planId: PlanId,
  cards: LearnCardOutput[],
): PracticeCardAccess {
  const alreadyLocked = cards.filter((card) => card.isLockedPreview);
  const openCards = filterValidLearnCards(
    cards.filter((card) => !card.isLockedPreview),
    "practice_card_access",
  );
  const accessibleCount = getMaxAccessiblePracticeCards(planId, openCards.length);
  const accessibleCards = openCards.slice(0, accessibleCount);
  const lockedCards = [
    ...openCards.slice(accessibleCount).map(toLockedLearnPreview),
    ...alreadyLocked.map(toLockedLearnPreview),
  ];
  const totalCount = accessibleCards.length + lockedCards.length;
  const lockedCount = lockedCards.length;

  return {
    allCards: [...accessibleCards, ...lockedCards],
    accessibleCards,
    lockedCards,
    totalCount,
    accessibleCount,
    lockedCount,
    isLimited: lockedCount > 0,
  };
}

export function toPracticeAccessMeta(
  planId: PlanId,
  access: PracticeCardAccess,
): PracticeAccessMeta {
  return {
    plan: planId,
    totalGeneratedCards: access.totalCount,
    accessibleCardCount: access.accessibleCount,
    lockedCardCount: access.lockedCount,
    isLimited: access.isLimited,
  };
}
