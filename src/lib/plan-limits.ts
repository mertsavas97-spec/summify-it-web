import { getPlanDefinition } from "@/data/pricingPlans";
import type { UserLimits } from "@/types/database";
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
  dailyAnalysisCount: number;
  remainingToday: number | null;
  maxFileSizeMb: number;
  maxLearnCards: number;
  maxSavedAnalyses: number | null;
  isBeta: boolean;
};

export type AnalysisQuotaResult = {
  /** Always true until hard enforcement is enabled in a future phase. */
  allowed: boolean;
  /** True when usage would block once enforcement is turned on. */
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

/** Resolve stored profile plan — unknown values map to beta for safety. */
export function resolvePlanId(storedPlan: string | null | undefined): PlanId {
  if (storedPlan && isPlanId(storedPlan)) return storedPlan;
  return "beta";
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
    dailyAnalysisCount: usedToday,
    remainingToday,
    maxFileSizeMb: plan.limits.maxFileSizeMb,
    maxLearnCards: plan.limits.maxLearnCards,
    maxSavedAnalyses: plan.limits.maxSavedAnalyses,
    isBeta: planId === "beta",
  };
}

/** Remaining analyses today (`null` = unlimited / not capped). */
export function getRemainingAnalyses(
  storedPlan: string | null | undefined,
  usage: UserLimits | UserLimitsUsageSnapshot | null,
): number | null {
  return getUserPlanLimits(storedPlan, usage).remainingToday;
}

/**
 * Quota check for running analysis.
 * Hard blocks are disabled — `allowed` stays true; `wouldBlock` signals future enforcement.
 */
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
  if (remaining === 0 && !wouldBlock) {
    warning = `You're at today's ${plan.name} analysis limit.`;
  } else if (remaining === 1) {
    warning = `You're approaching today's ${plan.name.toLowerCase()} analysis limit.`;
  } else if (remaining <= 2 && remaining > 1) {
    warning = `You have ${remaining} analyses left today on ${plan.name}.`;
  }

  return {
    allowed: true,
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
