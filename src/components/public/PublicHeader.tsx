"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import { ModesMegaMenu } from "@/components/public/ModesMegaMenu";
import { NavDropdown } from "@/components/public/NavDropdown";
import { MobilePublicNav } from "@/components/public/MobilePublicNav";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { createClient, recoverInvalidRefreshSession } from "@/lib/supabase/client";
import { FORMAT_NAV_ITEMS, SEGMENT_NAV_ITEMS } from "@/data/seo-nav";

const navLinks = [
  { href: "/upload", label: "Workspace" },
  { href: "/pricing", label: "Pricing" },
];

const FORMAT_PATHS = FORMAT_NAV_ITEMS.map((i) => i.href);
const SEGMENT_PATHS = SEGMENT_NAV_ITEMS.map((i) => i.href);

export function PublicHeader() {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const modesActive = pathname === "/modes" || pathname.startsWith("/modes/");
  const formatsActive = FORMAT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const segmentsActive = SEGMENT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error && (await recoverInvalidRefreshSession(supabase, "PublicHeader.getUser", error))) {
          setIsSignedIn(false);
          return;
        }

        setIsSignedIn(Boolean(data.user));
      })
      .catch(async (error) => {
        if (await recoverInvalidRefreshSession(supabase, "PublicHeader.getUser.catch", error)) {
          setIsSignedIn(false);
          return;
        }

        setIsSignedIn(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;

    const mobileHeaderItems = ["brand", "auth", "menu", "start_summarizing"] as const;
    const authState = isSignedIn ? "signed_in" : "signed_out";

    if (process.env.NODE_ENV === "development") {
      console.info("mobile_header_layout_rendered", {
        authState,
        items: mobileHeaderItems,
        viewport: "mobile",
      });
    }
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e1016]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-initial">
          <div className="shrink-0 md:hidden">
            <BrandMark href="/" size="nav" priority showWordmark={!isSignedIn} className="shrink-0" />
          </div>
          <div className="hidden shrink-0 md:block">
            <BrandMark href="/" size="nav" priority className="shrink-0" />
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1 md:hidden">
          <div className="shrink-0">
            <HeaderAuth layout="mobile" />
          </div>
          <div className="shrink-0">
            <MobilePublicNav />
          </div>
          <Button
            href="/upload"
            size="sm"
            className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs sm:px-4"
          >
            <span className="hidden min-[390px]:inline">Start summarizing</span>
            <span className="min-[390px]:hidden">Start</span>
          </Button>
        </div>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          <ModesMegaMenu isActive={modesActive} />
          <NavDropdown label="Formats" items={FORMAT_NAV_ITEMS} isActive={formatsActive} />
          <NavDropdown label="Segments" items={SEGMENT_NAV_ITEMS} isActive={segmentsActive} />
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-500/15 text-violet-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <div className="hidden md:block">
            <HeaderAuth />
          </div>
          <Button href="/upload" size="sm" className="hidden sm:inline-flex">
            Start summarizing
          </Button>
        </div>
      </div>
    </header>
  );
}
