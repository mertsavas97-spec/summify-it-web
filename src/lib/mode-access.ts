import { getIntelligenceModeById, INTELLIGENCE_MODES } from "@/config/modes";
import type { IntelligenceModeDefinition, IntelligenceModeId } from "@/types/modes";
import {
  hasActivePaidEntitlement,
  resolveEntitlementPlanIdFromProfile,
} from "@/lib/billing/entitlements";
import { getPlanDefinition } from "@/data/pricingPlans";
import { getUpgradePlanForMode, isModeIncludedInPlan } from "@/lib/plan-features";
import { formatPlanBadgeLabel } from "@/lib/plan-upgrade-ui";
import { resolvePlanId } from "@/lib/plan-limits";
import type { Profile } from "@/types/database";
import type { PlanId } from "@/types/plan";
import type { ModeAvailability } from "@/types/modes";

export type ModeAccessState = {
  canAccess: boolean;
  canRun: boolean;
  effectiveAvailability: ModeAvailability;
  lockReason?: "coming_soon" | "upgrade_required";
  upgradePlanId?: PlanId;
};

export type EntitlementModeCounts = {
  available: number;
  locked: number;
  comingSoon: number;
  total: number;
};

/**
 * Plan id used for intelligence mode gating (UI + API).
 * Paid tiers apply only when subscription entitlement is active.
 */
export function resolveModeEntitlementPlanId(
  profile: Profile | null | undefined,
  isAuthenticated: boolean,
): PlanId {
  if (!isAuthenticated || !profile) return "free";

  if (hasActivePaidEntitlement(profile)) {
    return resolveEntitlementPlanIdFromProfile(profile);
  }

  const stored = resolvePlanId(profile.plan);
  if (stored === "beta") return "beta";
  return "free";
}

export function canAccessMode(
  modeId: IntelligenceModeId,
  entitlementPlanId: PlanId,
): boolean {
  const mode = getIntelligenceModeById(modeId);
  if (!mode || mode.availability === "coming_soon") return false;
  return isModeIncludedInPlan(modeId, entitlementPlanId);
}

export function canRunMode(
  modeId: IntelligenceModeId,
  entitlementPlanId: PlanId,
): boolean {
  return canAccessMode(modeId, entitlementPlanId);
}

export function getModeAccessState(
  mode: IntelligenceModeDefinition,
  entitlementPlanId: PlanId,
): ModeAccessState {
  if (mode.availability === "coming_soon") {
    return {
      canAccess: false,
      canRun: false,
      effectiveAvailability: "coming_soon",
      lockReason: "coming_soon",
    };
  }

  if (isModeIncludedInPlan(mode.id, entitlementPlanId)) {
    return {
      canAccess: true,
      canRun: true,
      effectiveAvailability: "active",
    };
  }

  return {
    canAccess: false,
    canRun: false,
    effectiveAvailability: "locked",
    lockReason: "upgrade_required",
    upgradePlanId: getUpgradePlanForMode(mode),
  };
}

export function countModesForEntitlement(
  entitlementPlanId: PlanId,
  modes: IntelligenceModeDefinition[] = INTELLIGENCE_MODES,
): EntitlementModeCounts {
  let available = 0;
  let locked = 0;
  let comingSoon = 0;

  for (const mode of modes) {
    const state = getModeAccessState(mode, entitlementPlanId);
    if (state.effectiveAvailability === "coming_soon") comingSoon += 1;
    else if (state.canAccess) available += 1;
    else locked += 1;
  }

  return { available, locked, comingSoon, total: modes.length };
}

export function formatEntitlementModeCountLabel(
  counts: EntitlementModeCounts,
  entitlementPlanId: PlanId,
): string {
  const { intelligenceModesIncluded } =
    getPlanDefinition(entitlementPlanId).limits;

  if (intelligenceModesIncluded === "all" && counts.locked === 0) {
    return `${counts.available} modes available`;
  }

  if (counts.locked === 0) {
    return `${counts.available} active${counts.comingSoon > 0 ? ` · ${counts.comingSoon} coming soon` : ""}`;
  }

  return `${counts.available} active · ${counts.locked} locked${counts.comingSoon > 0 ? ` · ${counts.comingSoon} coming soon` : ""}`;
}

export { formatPlanBadgeLabel };
