"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
      <FeaturedPracticeCard>
        <PracticeCardHeader />
        <p className="mt-2 max-w-lg text-[13px] leading-snug text-zinc-400">
          Sign in to turn this analysis into adaptive review cards and reinforce key
          concepts.
        </p>
        <div className="mt-4">
          <Button
            href="/login?next=/upload"
            size="sm"
            className="shadow-md shadow-violet-500/15"
          >
            Sign in to start practice
          </Button>
        </div>
      </FeaturedPracticeCard>
    );
  }

  if (!savedAnalysisId) {
    return (
      <p className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-2.5 text-xs text-zinc-500">
        {savedToWorkspace === undefined
          ? "Preparing your saved analysis…"
          : "Save this analysis to your workspace first, then start a practice session."}
      </p>
    );
  }

  return (
    <FeaturedPracticeCard>
      <PracticeCardHeader />
      {message && (
        <p className="mt-2 text-xs text-amber-200/90">{message}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => void handlePractice()}
          className="shadow-md shadow-violet-500/15"
        >
          {loading ? "Preparing session…" : "Start practice session"}
        </Button>
        <Link
          href="/dashboard/memory"
          className="text-[11px] text-zinc-500 transition-colors hover:text-violet-300/90"
        >
          Open memory dashboard →
        </Link>
      </div>
    </FeaturedPracticeCard>
  );
}

function PracticeCardHeader() {
  return (
    <div className="relative min-w-0">
      <Badge variant="accent" className="mb-1.5 text-[10px]">
        Learning workflow
      </Badge>
      <h3 className="text-base font-semibold tracking-tight text-white sm:text-[17px]">
        Practice what you learned
      </h3>
      <p className="mt-1.5 max-w-lg text-[13px] leading-snug text-zinc-400">
        Turn this analysis into adaptive review cards and reinforce key concepts.
      </p>
    </div>
  );
}

function FeaturedPracticeCard({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/35 via-zinc-950/85 to-zinc-950/95 px-4 py-4 sm:px-5 sm:py-5"
      data-workspace-practice-cta
    >
      <div
        className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-violet-600/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-36 rounded-full bg-indigo-600/8 blur-2xl motion-safe:animate-pulse"
        aria-hidden
      />
      <div className="relative flex max-w-2xl gap-3">
        <PracticeIcon />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}

function PracticeIcon() {
  return (
    <span
      className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300/85 sm:flex"
      aria-hidden
    >
      <svg
        className="h-4 w-4 motion-safe:animate-pulse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    </span>
  );
}
