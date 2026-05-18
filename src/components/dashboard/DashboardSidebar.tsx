"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◫" },
  { href: "/upload", label: "New summary", icon: "↑" },
  { href: "/dashboard", label: "Summaries", icon: "≡" },
  { href: "/dashboard", label: "Documents", icon: "▤" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-52 shrink-0 border-r border-white/[0.06] bg-zinc-950/50 lg:block">
      <div className="sticky top-16 px-3 py-5">
        <p className="px-2 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">
          Workspace
        </p>
        <nav className="mt-3 space-y-0.5">
          {navItems.map((item, i) => {
            const isActive = i === 0 && pathname === "/dashboard";
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <span className="w-4 text-center text-[10px] opacity-60">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/[0.04] pt-4">
          <p className="px-2 text-[10px] text-zinc-600">Usage (sample)</p>
          <p className="mt-2 px-2 text-xs text-zinc-400">
            3 / 3 summaries
            <span className="text-zinc-600"> · Free plan</span>
          </p>
          <div className="mx-2 mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-full rounded-full bg-violet-500/80" />
          </div>
        </div>
      </div>
    </aside>
  );
}
