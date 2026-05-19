"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FORMAT_NAV_ITEMS, SEGMENT_NAV_ITEMS } from "@/data/seo-nav";

function MobileNavGroup({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
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
        <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul className="space-y-1 pb-3 pl-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block py-1.5 text-sm text-zinc-500 hover:text-violet-300">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MobilePublicNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!menuOpen) {
    return (
      <button
        type="button"
        className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 md:hidden"
        aria-label="Open menu"
        onClick={() => setMenuOpen(true)}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />
      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,280px)] flex-col border-l border-white/[0.08] bg-[#0e1016] px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <Link
            href="/modes"
            onClick={() => setMenuOpen(false)}
            className={`block border-b border-white/[0.04] py-3 text-sm font-medium ${
              pathname.startsWith("/modes") ? "text-violet-200" : "text-zinc-300"
            }`}
          >
            Modes
          </Link>
          <MobileNavGroup label="Formats" items={FORMAT_NAV_ITEMS} />
          <MobileNavGroup label="Segments" items={SEGMENT_NAV_ITEMS} />
          <Link
            href="/upload"
            onClick={() => setMenuOpen(false)}
            className={`block border-b border-white/[0.04] py-3 text-sm font-medium ${
              pathname === "/upload" ? "text-violet-200" : "text-zinc-300"
            }`}
          >
            Workspace
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className={`block py-3 text-sm font-medium ${
              pathname === "/pricing" ? "text-violet-200" : "text-zinc-300"
            }`}
          >
            Pricing
          </Link>
        </div>
      </nav>
    </div>
  );
}
