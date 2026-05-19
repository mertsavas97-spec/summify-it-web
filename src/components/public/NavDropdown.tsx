"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type NavDropdownItem = {
  href: string;
  label: string;
  description?: string;
};

type NavDropdownProps = {
  label: string;
  items: NavDropdownItem[];
  isActive?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export function NavDropdown({
  label,
  items,
  isActive = false,
  viewAllHref,
  viewAllLabel = "View all",
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
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
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-white/[0.08] bg-[#12141c]/98 p-2 shadow-xl shadow-black/40 backdrop-blur-xl"
          role="menu"
        >
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.href} role="none">
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className="block rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-zinc-200">{item.label}</span>
                  {item.description ? (
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              onClick={close}
              className="mt-2 block rounded-lg border-t border-white/[0.06] px-3 py-2 text-center text-[11px] font-medium text-violet-300/90 hover:bg-violet-500/10"
            >
              {viewAllLabel}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
