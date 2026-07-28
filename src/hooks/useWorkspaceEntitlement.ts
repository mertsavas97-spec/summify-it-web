"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasActivePaidEntitlement } from "@/lib/billing/entitlements";
import { resolveModeEntitlementPlanId } from "@/lib/mode-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isEduEmail } from "@/lib/auth/edu-email";
import type { Profile } from "@/types/database";
import type { PlanId } from "@/types/plan";

type ProfileEntitlementRow = Pick<
  Profile,
  "plan" | "subscription_status" | "polar_subscription_id"
>;

export type WorkspaceEntitlement = {
  entitlementPlanId: PlanId;
  isAuthenticated: boolean;
  isPaidActive: boolean;
  /** School email (.edu) — unlocks Scholar checkout. */
  isEduEligible: boolean;
  ready: boolean;
};

export function useWorkspaceEntitlement(): WorkspaceEntitlement {
  const [entitlement, setEntitlement] = useState<WorkspaceEntitlement>(() => ({
    entitlementPlanId: "free",
    isAuthenticated: false,
    isPaidActive: false,
    isEduEligible: false,
    ready: !isSupabaseConfigured(),
  }));

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEntitlement({
          entitlementPlanId: "free",
          isAuthenticated: false,
          isPaidActive: false,
          isEduEligible: false,
          ready: true,
        });
        return;
      }

      const eduEligible = isEduEmail(user.email);

      // Auth known — mark authenticated immediately so guest UI never flashes
      // while the profile entitlement query is still in flight.
      setEntitlement((prev) => ({
        ...prev,
        isAuthenticated: true,
        isEduEligible: eduEligible,
        ready: true,
      }));

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, subscription_status, polar_subscription_id")
        .eq("id", user.id)
        .maybeSingle();

      const row = profile as ProfileEntitlementRow | null;
      const profileForEntitlement = row as Profile | null;
      setEntitlement({
        entitlementPlanId: resolveModeEntitlementPlanId(profileForEntitlement, true),
        isAuthenticated: true,
        isPaidActive: hasActivePaidEntitlement(profileForEntitlement),
        isEduEligible: eduEligible,
        ready: true,
      });
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return entitlement;
}

/** @deprecated Use useWorkspaceEntitlement().entitlementPlanId */
export function useWorkspaceEntitlementPlan(): PlanId {
  return useWorkspaceEntitlement().entitlementPlanId;
}
