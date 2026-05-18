"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getIntelligenceModeById } from "@/config/modes";
import { MODES_NAV_MENU_SECTIONS } from "@/data/modes-nav-menu";
import { getCategoryColors } from "@/lib/mode-category-colors";

function modeHref(modeId: string, availability: string | undefined): string {
  if (availability === "active") return `/modes/${modeId}`;
  return "/upload";
}

function AvailabilityBadge({ availability }: { availability: string | undefined }) {
  if (availability === "active") {
    return (
      <span className="rounded border border-emerald-500/25 bg-emerald-950/30 px-1 py-px text-[9px] font-medium uppercase text-emerald-400/90">
        Active
      </span>
    );
  }
  if (availability === "coming_soon") {
    return (
      <span className="rounded border border-zinc-600/40 bg-zinc-800/40 px-1 py-px text-[9px] font-medium uppercase text-zinc-500">
        Soon
      </span>
    );
  }
  return (
    <span className="rounded border border-violet-500/20 bg-violet-950/25 px-1 py-px text-[9px] font-medium uppercase text-violet-300/80">
      Pro
    </span>
  );
}

type ModesMegaMenuProps = {
  isActive?: boolean;
};

export function ModesMegaMenu({ isActive = false }: ModesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  return (
    <div
      ref={rootRef}
      className="relative hidden md:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive || open
            ? "bg-violet-500/15 text-violet-200"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        Modes
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute left-1/2 top-full z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 pt-2 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        role="menu"
      >
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e1016]/95 shadow-2xl shadow-black/50 ring-1 ring-white/[0.04] backdrop-blur-xl">
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {MODES_NAV_MENU_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="border-b border-white/[0.04] p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map(({ modeId }) => {
                    const mode = getIntelligenceModeById(modeId);
                    if (!mode) return null;
                    const colors = getCategoryColors(mode.category);
                    return (
                      <li key={modeId}>
                        <Link
                          href={modeHref(modeId, mode.availability)}
                          role="menuitem"
                          onClick={close}
                          className={`group block rounded-lg border border-transparent px-2 py-1.5 transition-colors ${colors.hover}`}
                        >
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-zinc-100 group-hover:text-white">
                              {mode.label}
                            </span>
                            <AvailabilityBadge availability={mode.availability} />
                          </span>
                          <span
                            className={`mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500 group-hover:text-zinc-400`}
                          >
                            {mode.shortDescription}
                          </span>
                          <span className={`mt-1 text-[10px] ${colors.label}`}>
                            {section.title}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-zinc-950/50 px-4 py-2.5">
            <p className="text-[11px] text-zinc-500">29 intelligence modes · 4 active in beta</p>
            <Link
              href="/modes"
              onClick={close}
              className="text-[11px] font-medium text-violet-300 hover:text-violet-200"
            >
              View all modes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
