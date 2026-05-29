import { getPlanDefinition } from "@/data/pricingPlans";
import { getPlanLimits } from "@/lib/plans/planLimits";
import type { UserLimits } from "@/types/database";
import type { MemoryPlanLimits } from "@/types/memory";
import { isPlanId, type PlanId } from "@/types/plan";

/** Subset of `user_limits` rows used for daily quota math. */
export type UserLimitsUsageSnapshot = Pick<
  UserLimits,
  "daily_analysis_count" | "last_reset_date"
>;

export type UserPlanLimits = {
  planId: PlanId;
  planName: string;
  enforceLimits: boolean;
  analysesPerDay: number | null;
  maxDailyAudioLessons: number;
  maxDailyPodcasts: number;
  dailyAnalysisCount: number;
  remainingToday: number | null;
  maxFileSizeMb: number;
  maxLearnCards: number;
  maxSavedAnalyses: number | null;
  maxReviewItems: number | null;
  dailyReviewTarget: number;
  memoryEnabled: boolean;
  remindersEnabled: boolean;
  isBeta: boolean;
};

export type AnalysisQuotaResult = {
  allowed: boolean;
  /** True when usage blocks or would block for informational beta views. */
  wouldBlock: boolean;
  planId: PlanId;
  remaining: number | null;
  limit: number | null;
  usedToday: number;
  warning?: string;
  isAnonymous: boolean;
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function effectiveDailyCount(limits: UserLimitsUsageSnapshot | null): number {
  if (!limits) return 0;
  const today = utcToday();
  const last =
    typeof limits.last_reset_date === "string"
      ? limits.last_reset_date.slice(0, 10)
      : today;
  if (last !== today) return 0;
  return limits.daily_analysis_count ?? 0;
}

/** Resolve stored profile plan — unknown values map to Free for public safety. */
export function resolvePlanId(storedPlan: string | null | undefined): PlanId {
  if (storedPlan && isPlanId(storedPlan)) return storedPlan;
  return "free";
}

/** Limits + usage for dashboard / account (authenticated). */
export function getUserPlanLimits(
  storedPlan: string | null | undefined,
  usage: UserLimits | UserLimitsUsageSnapshot | null,
): UserPlanLimits {
  const planId = resolvePlanId(storedPlan);
  const plan = getPlanDefinition(planId);
  const usedToday = effectiveDailyCount(usage);
  const cap = plan.limits.analysesPerDay;

  let remainingToday: number | null = null;
  if (cap != null) {
    remainingToday = Math.max(0, cap - usedToday);
  }

  return {
    planId,
    planName: plan.name,
    enforceLimits: plan.enforceLimits,
    analysesPerDay: cap,
    maxDailyAudioLessons:
      planId === "free" ? 2 : planId === "scholar" ? 10 : 999,
    maxDailyPodcasts:
      planId === "free" ? 1 : planId === "scholar" ? 5 : 999,
    dailyAnalysisCount: usedToday,
    remainingToday,
    maxFileSizeMb: getPlanLimits(planId).maxUploadMb,
    maxLearnCards: plan.limits.maxLearnCards,
    maxSavedAnalyses: plan.limits.maxSavedAnalyses,
    maxReviewItems: getMemoryPlanLimits(planId).maxReviewItems,
    dailyReviewTarget: getMemoryPlanLimits(planId).dailyReviewTarget,
    memoryEnabled: getMemoryPlanLimits(planId).spacedRepetitionEnabled,
    remindersEnabled: getMemoryPlanLimits(planId).remindersEnabled,
    isBeta: planId === "beta",
  };
}

export function getMemoryPlanLimits(storedPlan: string | null | undefined): MemoryPlanLimits {
  const planId = resolvePlanId(storedPlan);
  const plan = getPlanDefinition(planId);

  if (planId === "free") {
    return {
      maxReviewItems: 25,
      dailyReviewTarget: 8,
      remindersEnabled: false,
      spacedRepetitionEnabled: plan.limits.spacedRepetitionEnabled,
    };
  }

  if (planId === "scholar") {
    return {
      maxReviewItems: 500,
      dailyReviewTarget: 20,
      remindersEnabled: false,
      spacedRepetitionEnabled: true,
    };
  }

  return {
    maxReviewItems: null,
    dailyReviewTarget: planId === "pro" ? 30 : 16,
    remindersEnabled: plan.limits.emailRemindersEnabled,
    spacedRepetitionEnabled: plan.limits.spacedRepetitionEnabled,
  };
}

/** Remaining analyses today (`null` = unlimited / not capped). */
export function getRemainingAnalyses(
  storedPlan: string | null | undefined,
  usage: UserLimits | UserLimitsUsageSnapshot | null,
): number | null {
  return getUserPlanLimits(storedPlan, usage).remainingToday;
}

/** Quota check for running analysis. */
export function canRunAnalysis(input: {
  storedPlan?: string | null;
  usage?: UserLimits | UserLimitsUsageSnapshot | null;
  isAuthenticated: boolean;
}): AnalysisQuotaResult {
  const isAnonymous = !input.isAuthenticated;
  const planId = isAnonymous ? "free" : resolvePlanId(input.storedPlan);
  const plan = getPlanDefinition(planId);
  const usedToday = isAnonymous ? 0 : effectiveDailyCount(input.usage ?? null);
  const limit = plan.limits.analysesPerDay;

  if (!plan.enforceLimits || limit == null) {
    return {
      allowed: true,
      wouldBlock: false,
      planId,
      remaining: null,
      limit,
      usedToday,
      isAnonymous,
    };
  }

  const remaining = Math.max(0, limit - usedToday);
  const wouldBlock = usedToday >= limit;

  let warning: string | undefined;
  if (wouldBlock) {
    warning = `You've used today's ${limit} free analyses.`;
  } else if (remaining === 1) {
    warning = `You have 1 free analysis left today.`;
  } else if (remaining <= 2 && remaining > 1) {
    warning = `You have ${remaining} free analyses left today.`;
  }

  return {
    allowed: !wouldBlock,
    wouldBlock,
    planId,
    remaining,
    limit,
    usedToday,
    warning,
    isAnonymous,
  };
}

export function getUsageWarningMessage(
  storedPlan: string | null | undefined,
  usage: UserLimits | UserLimitsUsageSnapshot | null,
  isAuthenticated: boolean,
): string | null {
  return (
    canRunAnalysis({ storedPlan, usage, isAuthenticated }).warning ?? null
  );
}
