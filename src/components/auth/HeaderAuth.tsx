"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, recoverInvalidRefreshSession } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type HeaderAuthLayout = "desktop" | "mobile";

type HeaderAuthProps = {
  layout?: HeaderAuthLayout;
};

function authLinkClass(layout: HeaderAuthLayout, active = false): string {
  if (layout === "mobile") {
    return active
      ? "shrink-0 rounded-lg border border-violet-400/25 bg-violet-500/15 px-2 py-1.5 text-xs font-medium text-violet-100 shadow-sm shadow-violet-500/10 transition-colors hover:border-violet-300/35 hover:bg-violet-500/25"
      : "shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100";
  }

  return active
    ? "rounded-lg border border-violet-400/25 bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-100 shadow-sm shadow-violet-500/10 transition-colors hover:border-violet-300/35 hover:bg-violet-500/25"
    : "rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200";
}

function HeaderAuthInner({ layout = "desktop" }: HeaderAuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error && (await recoverInvalidRefreshSession(supabase, "HeaderAuth.getUser", error))) {
          setUser(null);
          setReady(true);
          return;
        }

        setUser(data.user ?? null);
        setReady(true);
      })
      .catch(async (error) => {
        if (await recoverInvalidRefreshSession(supabase, "HeaderAuth.getUser.catch", error)) {
          setUser(null);
          setReady(true);
          return;
        }

        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <span
        className={layout === "mobile" ? "h-7 w-14 shrink-0 rounded-lg bg-white/5" : "hidden h-9 w-16 rounded-lg bg-white/5 sm:inline-block"}
        aria-hidden
      />
    );
  }

  if (user) {
    return (
      <div className={layout === "mobile" ? "flex shrink-0 items-center gap-1" : "flex items-center gap-1.5"}>
        <Link
          href="/dashboard"
          className={authLinkClass(layout, true)}
        >
          Dashboard
        </Link>
        <Link
          href="/account"
          className={authLinkClass(layout)}
        >
          Account
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={authLinkClass(layout)}
    >
      Sign in
    </Link>
  );
}

export function HeaderAuth({ layout = "desktop" }: HeaderAuthProps) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return <HeaderAuthInner layout={layout} />;
}
