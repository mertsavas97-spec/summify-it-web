"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function HeaderAuthInner() {
  const router = useRouter();
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
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <span className="hidden h-9 w-16 rounded-lg bg-white/5 sm:inline-block" aria-hidden />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/dashboard"
          className="rounded-lg border border-violet-400/25 bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-100 shadow-sm shadow-violet-500/10 transition-colors hover:border-violet-300/35 hover:bg-violet-500/25"
        >
          Dashboard
        </Link>
        <Link
          href="/account"
          className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
        >
          Account
        </Link>
      </div>
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
