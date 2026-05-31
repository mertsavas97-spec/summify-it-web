"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type WorkspaceSaveBannerProps = {
  savedToWorkspace?: boolean;
  isAuthenticated?: boolean;
};

const supabaseConfigured = isSupabaseConfigured();

export function WorkspaceSaveBanner({ savedToWorkspace, isAuthenticated = false }: WorkspaceSaveBannerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);

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
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (savedToWorkspace) {
    return (
      <p className="rounded-lg border border-emerald-500/15 bg-emerald-950/15 px-3 py-2 text-xs text-emerald-300/80">
        Saved to your workspace.{" "}
        <Link href="/dashboard" className="font-medium underline-offset-2 hover:underline">
          Dashboard
        </Link>
      </p>
    );
  }

  const isLoggedIn = Boolean(user) || isAuthenticated;

  if (!isLoggedIn && supabaseConfigured) {
    return (
      <section
        className="mt-8 w-full rounded-2xl border border-violet-300/30 bg-gradient-to-b from-violet-950/35 via-[#171322]/90 to-[#12111c]/95 px-5 py-6 text-xs shadow-[0_0_38px_rgba(139,92,246,0.2)] sm:mt-10 sm:px-6 sm:py-7"
        aria-label="Save this study session"
      >
        <p className="text-base font-semibold tracking-tight text-violet-50 sm:text-lg">Save this study session</p>
        <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
          <p>Keep your Learn Cards.</p>
          <p>Continue listening later.</p>
          <p>Build your memory library.</p>
        </div>
        <Link
          href="/login?next=/upload"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-violet-200/45 bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(139,92,246,0.35)] transition-colors hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12111c] sm:mt-6"
        >
          Create Free Account
        </Link>
        <p className="mt-3 text-[11px] text-zinc-400 sm:mt-3.5">Your analysis will stay linked after signup.</p>
      </section>
    );
  }

  if (isLoggedIn && savedToWorkspace === false) {
    return (
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-xs">
        <p className="font-medium text-zinc-200">Continue learning from this analysis</p>
        <p className="mt-1 leading-relaxed text-zinc-500">
          Use Dashboard for history and saved sessions, or continue with Learn, Quiz, and Audio right here.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-colors hover:border-violet-400/30 hover:text-violet-100"
        >
          Open Dashboard
        </Link>
      </section>
    );
  }

  return null;
}
