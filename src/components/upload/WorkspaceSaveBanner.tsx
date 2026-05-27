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
      <p className="text-xs text-zinc-600">
        <Link
          href="/login?next=/upload"
          className="text-violet-400/80 hover:text-violet-300"
        >
          Sign in to save analyses.
        </Link>
      </p>
    );
  }

  if (isLoggedIn && savedToWorkspace === false) {
    return (
      <p className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500">
        Analysis ready. Copy or export it here; workspace save status will update automatically.
      </p>
    );
  }

  return null;
}
