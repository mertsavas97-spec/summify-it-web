"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveModeEntitlementPlanId } from "@/lib/mode-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/types/database";
import type { PlanId } from "@/types/plan";

type ProfileEntitlementRow = Pick<
  Profile,
  "plan" | "subscription_status" | "polar_subscription_id"
>;

export function useWorkspaceEntitlementPlan(): PlanId {
  const [entitlementPlanId, setEntitlementPlanId] = useState<PlanId>("free");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEntitlementPlanId("free");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, subscription_status, polar_subscription_id")
        .eq("id", user.id)
        .maybeSingle();

      setEntitlementPlanId(
        resolveModeEntitlementPlanId(
          profile as Profile | null,
          true,
        ),
      );
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return entitlementPlanId;
}
