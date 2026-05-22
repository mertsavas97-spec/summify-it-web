import { isPaidPlanId } from "@/lib/billing/entitlements";
import type { PlanId } from "@/types/plan";

/** Audio Study Mode is Pro / Scholar / Team with an active paid entitlement. */
export function canUseAudioStudyMode(
  planId: PlanId,
  isPaidActive: boolean,
): boolean {
  return isPaidActive && isPaidPlanId(planId);
}

export type AudioStudyScriptLimits = {
  minWords: number;
  maxWords: number;
  durationLabel: string;
};

export function getAudioStudyScriptLimits(planId: PlanId): AudioStudyScriptLimits {
  if (planId === "team" || planId === "scholar") {
    return {
      minWords: 900,
      maxWords: 1400,
      durationLabel: "6–10 min",
    };
  }
  return {
    minWords: 500,
    maxWords: 900,
    durationLabel: "3–6 min",
  };
}

export const AUDIO_STUDY_UPGRADE_HREF = "/pricing?plan=pro";
