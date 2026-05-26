"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canRunAnalysis } from "@/lib/plan-limits";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type WorkspaceUsageWarningProps = {
  /** Optional server-provided warning when parent has profile context */
  initialWarning?: string | null;
  className?: string;
};

function normalizeWarningCopy(message: string): string {
  if (message.includes("You've used today's 3 free analyses")) {
    return "You’ve used today’s 3 free analyses.";
  }

  return message;
}

export function WorkspaceUsageWarning({
  initialWarning,
  className = "mt-4",
}: WorkspaceUsageWarningProps) {
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
    <div
      className={`${className} w-full rounded-xl border border-red-500/35 bg-gradient-to-r from-red-950/70 via-red-950/55 to-zinc-950 px-4 py-3.5 shadow-[0_0_0_1px_rgba(239,68,68,0.08)] sm:px-5 sm:py-4`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-400/35 bg-red-500/12 text-red-200">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="min-w-0 text-sm font-medium leading-6 text-red-100 sm:text-[15px]">
            {normalizeWarningCopy(message)}
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300/30 bg-red-400/10 px-3.5 py-2 text-sm font-semibold text-red-50 transition-colors hover:border-red-200/45 hover:bg-red-400/16 focus:outline-none focus:ring-2 focus:ring-red-300/35 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          View plans to upgrade
        </Link>
      </div>
    </div>
  );
}
