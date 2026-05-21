import { getMaxLearnCardsForPlan } from "@/lib/plan-features";
import type { PlanId } from "@/types/plan";
import type { LearnCardOutput } from "@/types/text-analysis";

/** Free / beta users can practice this many cards per analysis. */
export const FREE_PRACTICE_ACCESSIBLE_COUNT = 5;

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
  if (hasFullPracticeAccess(planId)) return totalCards;
  return Math.min(FREE_PRACTICE_ACCESSIBLE_COUNT, totalCards);
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
  const allCards = cards;
  const totalCount = allCards.length;
  const accessibleCount = getMaxAccessiblePracticeCards(planId, totalCount);
  const accessibleCards = allCards.slice(0, accessibleCount);
  const lockedCards = allCards.slice(accessibleCount).map(toLockedLearnPreview);
  const lockedCount = lockedCards.length;

  return {
    allCards,
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
