"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function HeaderAuthInner() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
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

  if (!ready) {
    return (
      <span className="hidden h-9 w-16 rounded-lg bg-white/5 sm:inline-block" aria-hidden />
    );
  }

  if (user) {
    return (
      <Link
        href="/account"
        className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
      >
        Account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
    >
      Sign in
    </Link>
  );
}

export function HeaderAuth() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return <HeaderAuthInner />;
}
