"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type PracticeAnalysisCtaProps = {
  savedAnalysisId?: string | null;
  savedToWorkspace?: boolean;
};

const supabaseConfigured = isSupabaseConfigured();

export function PracticeAnalysisCta({
  savedAnalysisId,
  savedToWorkspace,
}: PracticeAnalysisCtaProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePractice() {
    if (!savedAnalysisId || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/analyses/${savedAnalysisId}/memory`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setMessage(data.error ?? "Review cards could not be prepared yet.");
        return;
      }

      router.push("/dashboard/memory");
    } catch {
      setMessage("We couldn't prepare review cards. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3">
        <p className="text-sm font-medium text-violet-100">
          Practice this analysis
        </p>
        <p className="mt-1 text-xs leading-relaxed text-violet-200/70">
          Sign in to practice this analysis and save review cards.
        </p>
        <Link
          href="/login?next=/upload"
          className="mt-3 inline-flex rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-100 transition-colors hover:bg-violet-500/25"
        >
          Sign in to save your work
        </Link>
      </div>
    );
  }

  if (!savedAnalysisId) {
    return (
      <p className="mt-4 rounded-lg border border-white/[0.08] bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400">
        {savedToWorkspace === undefined
          ? "Saved analysis is preparing..."
          : "Practice cards need this analysis saved first. Try re-running after a moment."}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-950/35 to-zinc-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">Reinforce what you learned</p>
        <p className="mt-1 text-xs text-zinc-400">
          Turn key ideas from this analysis into a short review set.
        </p>
        {message && <p className="mt-2 text-xs text-amber-200/90">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => void handlePractice()}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-violet-300/30 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-50 transition-colors hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Preparing..." : "Practice this analysis"}
      </button>
    </div>
  );
}
