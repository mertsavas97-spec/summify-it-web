"use client";

import Link from "next/link";
import type { GuideTocItem } from "@/data/guides/types";

type TableOfContentsProps = {
  items: GuideTocItem[];
  title?: string;
};

export function TableOfContents({ items, title = "On this page" }: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4"
      aria-label="Table of contents"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {title}
      </p>
      <ol className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              className="text-sm text-zinc-400 transition-colors hover:text-violet-300"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
