"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import { ModesMegaMenu } from "@/components/public/ModesMegaMenu";
import { HeaderAuth } from "@/components/auth/HeaderAuth";

const navLinks = [
  { href: "/upload", label: "Workspace" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const modesActive =
    pathname === "/modes" || pathname.startsWith("/modes/");

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e1016]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandMark href="/" size="nav" priority className="shrink-0" />

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          <ModesMegaMenu isActive={modesActive} />
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

        <div className="flex shrink-0 items-center gap-2">
          <HeaderAuth />
          <Button href="/modes" variant="ghost" size="sm" className="hidden sm:inline-flex md:hidden">
            Explore modes
          </Button>
          <Button href="/upload" size="sm">
            Start summarizing
          </Button>
        </div>
      </div>
    </header>
  );
}
