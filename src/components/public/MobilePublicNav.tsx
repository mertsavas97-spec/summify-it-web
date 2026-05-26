"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";
import { FORMAT_NAV_ITEMS, SEGMENT_NAV_ITEMS } from "@/data/seo-nav";
import { SUMMIFY_SOCIAL_LINKS } from "@/lib/social-links";
import { createClient, recoverInvalidRefreshSession } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function MobileNavGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: { href: string; label: string }[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-zinc-300"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="space-y-1 pb-3 pl-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block py-1.5 text-sm text-zinc-500 transition-colors hover:text-violet-300"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function navLinkClass(active: boolean): string {
  return `block border-b border-white/[0.04] py-3 text-sm font-medium transition-colors ${
    active ? "text-violet-200" : "text-zinc-300 hover:text-zinc-100"
  }`;
}

function accountLinkClass(active = false): string {
  return active
    ? "rounded-lg border border-violet-400/25 bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-100 shadow-sm shadow-violet-500/10 transition-colors hover:border-violet-300/35 hover:bg-violet-500/25"
    : "rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100";
}

export function MobilePublicNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const workspaceName = "Workspace";

  useEffect(() => {
    if (!supabaseConfigured) return;

    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error && (await recoverInvalidRefreshSession(supabase, "MobilePublicNav.getUser", error))) {
          setUser(null);
          setAuthReady(true);
          return;
        }

        setUser(data.user ?? null);
        setAuthReady(true);
      })
      .catch(async (error) => {
        if (await recoverInvalidRefreshSession(supabase, "MobilePublicNav.getUser.catch", error)) {
          setUser(null);
          setAuthReady(true);
          return;
        }

        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabaseConfigured]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  async function handleSignOut() {
    if (!supabaseConfigured) return;

    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      close();
      router.refresh();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  }

  const panel = menuOpen ? (
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={close}
      />
      <nav
        className="absolute right-0 top-0 flex h-full w-[min(100%,300px)] flex-col border-l border-white/[0.08] bg-[#0e1016] shadow-2xl shadow-black/40"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex shrink-0 items-center justify-between px-4">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-zinc-200">Menu</span>
            <p className="max-w-[180px] truncate text-xs text-zinc-500">{workspaceName}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            aria-label="Close menu"
            onClick={close}
          >
            ✕
          </button>
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          <Link href="/modes" onClick={close} className={navLinkClass(pathname.startsWith("/modes"))}>
            Modes
          </Link>
          <MobileNavGroup label="Formats" items={FORMAT_NAV_ITEMS} onNavigate={close} />
          <MobileNavGroup label="Segments" items={SEGMENT_NAV_ITEMS} onNavigate={close} />
          <Link href="/upload" onClick={close} className={navLinkClass(pathname === "/upload")}>
            Workspace
          </Link>
          <Link href="/pricing" onClick={close} className={navLinkClass(pathname === "/pricing")}>
            Pricing
          </Link>
          <Link href="/blog" onClick={close} className={navLinkClass(pathname.startsWith("/blog"))}>
            Blog
          </Link>
          <Link
            href="/audio-study"
            onClick={close}
            className={navLinkClass(pathname.startsWith("/audio-study") || pathname === "/learn-by-listening")}
          >
            Voice Study
          </Link>

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Account
            </p>
            {authReady ? (
              user ? (
                <div className="flex flex-col gap-1.5">
                  <Link href="/dashboard" onClick={close} className={accountLinkClass(pathname.startsWith("/dashboard"))}>
                    Dashboard
                  </Link>
                  <Link href="/account" onClick={close} className={accountLinkClass(pathname.startsWith("/account"))}>
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`${accountLinkClass()} w-full text-left disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Link href="/login" onClick={close} className={accountLinkClass()}>
                    Sign in
                  </Link>
                </div>
              )
            ) : (
              <span className="inline-block h-9 w-24 rounded-lg bg-white/5" aria-hidden />
            )}
          </div>

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Connect
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href={SUMMIFY_SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 transition-colors hover:text-violet-300"
              >
                X / Twitter
              </a>
              <a
                href={SUMMIFY_SOCIAL_LINKS.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 transition-colors hover:text-violet-300"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-4 pt-4">
          <Link
            href="/upload"
            onClick={close}
            className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Start summarizing
          </Link>
        </div>
      </nav>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="h-9 w-9 shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 md:hidden"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? (
          <span className="text-lg leading-none" aria-hidden>
            ✕
          </span>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>
      {menuOpen && typeof document !== "undefined"
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
