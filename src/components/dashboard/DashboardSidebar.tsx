"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◫", match: (p: string) => p === "/dashboard" },
  {
    href: "/dashboard/memory",
    label: "Memory",
    icon: "◇",
    match: (p: string) => p.startsWith("/dashboard/memory"),
  },
  {
    href: "/upload",
    label: "New summary",
    icon: "↑",
    match: (p: string) => p.startsWith("/upload"),
  },
  {
    href: "/account",
    label: "Account",
    icon: "◎",
    match: (p: string) => p.startsWith("/account"),
  },
];

type DashboardSidebarProps = {
  savedCount?: number;
  dailyCount?: number;
  planLabel?: string;
};

export function DashboardSidebar({
  savedCount = 0,
  dailyCount = 0,
  planLabel = "Public Beta",
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-52 shrink-0 border-r border-white/[0.06] bg-zinc-950/50 lg:block">
      <div className="sticky top-16 px-3 py-5">
        <p className="px-2 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">
          Workspace
        </p>
        <nav className="mt-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <span className="w-4 text-center text-[10px] opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/[0.04] pt-4">
          <p className="px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            This workspace
          </p>
          <p className="mt-2 px-2 text-xs leading-relaxed text-zinc-400">
            <span className="font-medium text-zinc-200">{savedCount}</span> saved
            <span className="text-zinc-600"> · </span>
            <span className="font-medium text-zinc-200">{dailyCount}</span> today
          </p>
          <p className="mt-1 px-2 text-[10px] text-zinc-600">{planLabel}</p>
        </div>
      </div>
    </aside>
  );
}
