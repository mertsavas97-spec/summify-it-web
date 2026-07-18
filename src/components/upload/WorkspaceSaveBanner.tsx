"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveAuthReturnTo } from "@/lib/auth/return-to";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type WorkspaceSaveBannerProps = {
  savedToWorkspace?: boolean;
  isAuthenticated?: boolean;
  savedAnalysisId?: string | null;
  onGuestSaveClick?: () => void;
  onRetrySave?: () => void;
};

const supabaseConfigured = isSupabaseConfigured();

export function WorkspaceSaveBanner({
  savedToWorkspace,
  isAuthenticated = false,
  savedAnalysisId,
  onGuestSaveClick,
  onRetrySave,
}: WorkspaceSaveBannerProps) {
  const router = useRouter();
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
        Saved to your dashboard.{" "}
        <Link
          href={savedAnalysisId ? `/dashboard/${savedAnalysisId}` : "/dashboard"}
          className="font-medium underline-offset-2 hover:underline"
        >
          Open analysis
        </Link>
      </p>
    );
  }

  const isLoggedIn = Boolean(user) || isAuthenticated;

  function handleGuestSave() {
    onGuestSaveClick?.();
    const returnTo = saveAuthReturnTo("/upload");
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!isLoggedIn && supabaseConfigured) {
    return (
      <section
        className="sticky bottom-3 z-30 mt-6 w-full min-w-0 overflow-hidden rounded-2xl border border-violet-300/30 bg-gradient-to-b from-violet-950/50 via-[#171322]/95 to-[#12111c] p-4 shadow-[0_0_38px_rgba(139,92,246,0.22)] sm:static sm:mt-8 sm:p-6"
        aria-label="Create a free account to keep this analysis"
        data-guest-results-save-cta
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
              Free account
            </p>
            <h3 className="mt-1 break-words text-base font-semibold tracking-tight text-white sm:text-lg">
              Keep this analysis — create a free account
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              Your guest preview is ready. Sign up free and we’ll save it to your dashboard so you
              can open it again in one click.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          {[
            "This analysis is held for you until you sign in",
            "After register/login you’ll land back on this result",
            "Then unlock 5 free analyses per day",
          ].map((item) => (
            <li key={item} className="flex min-w-0 items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
              <span className="min-w-0 break-words leading-snug [overflow-wrap:anywhere]">
                {item}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleGuestSave}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-violet-200/45 bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(139,92,246,0.35)] transition-colors hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12111c]"
        >
          Create free account
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-zinc-500">
          No credit card. Sign in works too if you already have an account.
        </p>
      </section>
    );
  }

  if (isLoggedIn && savedToWorkspace === false) {
    return (
      <section
        className="min-w-0 rounded-xl border border-amber-400/25 bg-amber-950/20 px-3.5 py-3 text-xs"
        role="status"
      >
        <p className="font-medium text-amber-100">Couldn’t save to your dashboard</p>
        <p className="mt-1 leading-relaxed text-amber-100/70">
          Your summary is ready here, but it wasn’t saved yet. Retry save or open the dashboard to
          confirm.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {onRetrySave ? (
            <button
              type="button"
              onClick={onRetrySave}
              className="inline-flex items-center rounded-lg border border-amber-300/30 bg-amber-500/15 px-3 py-1.5 text-[11px] font-medium text-amber-50 transition-colors hover:border-amber-200/40"
            >
              Retry save
            </button>
          ) : null}
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-200 transition-colors hover:border-violet-400/30 hover:text-violet-100"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (isLoggedIn && savedToWorkspace === undefined) {
    return (
      <p className="rounded-lg border border-violet-400/15 bg-violet-950/15 px-3 py-2 text-xs text-violet-200/80">
        Saving your analysis to the dashboard…
      </p>
    );
  }

  return null;
}
