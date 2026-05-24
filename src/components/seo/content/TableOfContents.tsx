"use client";

import Link from "next/link";
export type TocItem = {
  id: string;
  label: string;
};

type TableOfContentsProps = {
  items: TocItem[];
  title?: string;
};

export function TableOfContents({ items, title = "On this page" }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className="rounded-2xl border border-white/[0.08] bg-zinc-950/55 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      aria-label="Table of contents"
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400/90 shadow-[0_0_0_4px_rgba(167,139,250,0.12)]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          {title}
        </p>
        <span className="ml-1 h-px flex-1 bg-gradient-to-r from-violet-400/35 to-transparent" />
      </div>
      <ol className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="group">
            <Link
              href={`#${item.id}`}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-transparent border-l-white/5 px-3 py-2 text-sm text-zinc-400 transition-all duration-200 hover:border-violet-400/15 hover:bg-violet-500/8 hover:text-zinc-100 focus-visible:border-violet-400/25 focus-visible:bg-violet-500/12 focus-visible:text-violet-200 focus-visible:outline-none"
            >
              <span className="h-5 w-px shrink-0 rounded-full bg-white/8 transition-colors group-hover:bg-violet-400/70" />
              <span className="min-w-0 flex-1 leading-5 break-words">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
