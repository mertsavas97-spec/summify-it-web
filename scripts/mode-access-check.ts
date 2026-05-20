/**
 * Local entitlement mode matrix (no Supabase).
 * Run: npx tsx scripts/mode-access-check.ts
 */

import {
  canAccessMode,
  countModesForEntitlement,
  resolveModeEntitlementPlanId,
} from "../src/lib/mode-access";
import type { Profile } from "../src/types/database";

type Fixture = {
  name: string;
  profile: Pick<Profile, "plan" | "subscription_status" | "polar_subscription_id">;
  auth: boolean;
};

const fixtures: Fixture[] = [
  {
    name: "free",
    profile: { plan: "free", subscription_status: null, polar_subscription_id: null },
    auth: true,
  },
  {
    name: "beta",
    profile: { plan: "beta", subscription_status: null, polar_subscription_id: null },
    auth: true,
  },
  {
    name: "pro active",
    profile: {
      plan: "pro",
      subscription_status: "active",
      polar_subscription_id: "sub_test",
    },
    auth: true,
  },
  {
    name: "team active",
    profile: {
      plan: "team",
      subscription_status: "active",
      polar_subscription_id: "sub_test",
    },
    auth: true,
  },
  {
    name: "scholar active",
    profile: {
      plan: "scholar",
      subscription_status: "active",
      polar_subscription_id: "sub_test",
    },
    auth: true,
  },
];

const expectations: Record<string, { available: number; keyPoints: boolean }> = {
  free: { available: 5, keyPoints: false },
  beta: { available: 5, keyPoints: false },
  "pro active": { available: 28, keyPoints: true },
  "team active": { available: 28, keyPoints: true },
  "scholar active": { available: 15, keyPoints: true },
};

let failed = 0;

for (const fx of fixtures) {
  const planId = resolveModeEntitlementPlanId(fx.profile as Profile, fx.auth);
  const counts = countModesForEntitlement(planId);
  const expected = expectations[fx.name];
  const keyPoints = canAccessMode("key-points", planId);
  const ok =
    counts.available === expected.available && keyPoints === expected.keyPoints;

  console.log(
    `${ok ? "✓" : "✗"} ${fx.name}: plan=${planId} available=${counts.available}/${expected.available} locked=${counts.locked} key-points=${keyPoints}`,
  );

  if (!ok) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);
