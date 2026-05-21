/**
 * @deprecated Use `practiceCardAccess.ts` — re-exports for backward compatibility.
 */
import {
  FREE_PRACTICE_ACCESSIBLE_COUNT,
  getPracticeCardAccessForPlan,
  hasFullPracticeAccess,
  type PracticeCardAccess,
} from "./practiceCardAccess";
import type { PlanId } from "@/types/plan";
import type { LearnCardOutput } from "@/types/text-analysis";

export type PracticeGating = {
  totalGeneratedCards: number;
  accessibleCards: number;
  lockedCardsCount: number;
  isPracticeLocked: boolean;
};

export { FREE_PRACTICE_ACCESSIBLE_COUNT, hasFullPracticeAccess };

export function resolvePracticeGating(
  planId: PlanId,
  totalGenerated: number,
  cards?: LearnCardOutput[],
): PracticeGating {
  const access = cards
    ? getPracticeCardAccessForPlan(planId, cards)
    : getPracticeCardAccessForPlan(
        planId,
        Array.from({ length: totalGenerated }, () => ({
          type: "concept" as const,
          title: "",
          content: "",
        })),
      );

  return {
    totalGeneratedCards: access.totalCount,
    accessibleCards: access.accessibleCount,
    lockedCardsCount: access.lockedCount,
    isPracticeLocked: access.isLimited,
  };
}

export function splitByPracticeGating<T>(items: T[], gating: PracticeGating): {
  accessible: T[];
  locked: T[];
} {
  return {
    accessible: items.slice(0, gating.accessibleCards),
    locked: items.slice(gating.accessibleCards),
  };
}

export type { PracticeCardAccess };
