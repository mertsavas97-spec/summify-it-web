"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { canRunAnalysis } from "@/lib/plan-limits";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type WorkspaceUsageWarningProps = {
  /** Optional server-provided warning when parent has profile context */
  initialWarning?: string | null;
};

export function WorkspaceUsageWarning({ initialWarning }: WorkspaceUsageWarningProps) {
  const [message, setMessage] = useState<string | null>(initialWarning ?? null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      const { data: limits } = await supabase
        .from("user_limits")
        .select("daily_analysis_count, last_reset_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const quota = canRunAnalysis({
        storedPlan: profile?.plan,
        usage: limits,
        isAuthenticated: true,
      });

      setMessage(quota.warning ?? null);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!message) return null;

  return (
    <p className="mt-3 rounded-lg border border-amber-500/15 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
      {message}{" "}
      <Link href="/pricing" className="font-medium text-amber-100/90 hover:underline">
        View plans to upgrade
      </Link>
    </p>
  );
}
