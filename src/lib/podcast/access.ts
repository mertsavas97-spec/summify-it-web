import { isPaidPlanId } from "@/lib/billing/entitlements";
import type { PlanId } from "@/types/plan";

export function canUsePodcastDiscussionMode(
  planId: PlanId,
  isPaidActive: boolean,
): boolean {
  return isPaidActive && isPaidPlanId(planId);
}
