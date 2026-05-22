"use client";

import { useMemo, useState } from "react";
import {
  filterInternalLinks,
  getInternalLinkCatalog,
  type InternalLinkOption,
} from "@/lib/blog/internalLinkCatalog";

type InternalLinkPickerProps = {
  open: boolean;
  extraBlogSlugs?: { slug: string; title: string }[];
  onClose: () => void;
  onSelect: (markdown: string) => void;
};

export function InternalLinkPicker({
  open,
  extraBlogSlugs = [],
  onClose,
  onSelect,
}: InternalLinkPickerProps) {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");

  const catalog = useMemo(
    () => getInternalLinkCatalog(extraBlogSlugs),
    [extraBlogSlugs],
  );
  const filtered = useMemo(() => filterInternalLinks(catalog, query), [catalog, query]);

  const groups = useMemo(() => {
    const map = new Map<string, InternalLinkOption[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-white/[0.1] bg-zinc-950 shadow-2xl">
        <div className="border-b border-white/[0.06] p-4">
          <h3 className="text-sm font-semibold text-white">Internal link picker</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="mt-3 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Link label (optional)"
            className="mt-2 w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-3">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {group}
              </p>
              <ul>
                {items.map((item) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => {
                        const text = label.trim() || item.label;
                        onSelect(`[${text}](${item.href})`);
                        onClose();
                      }}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-violet-200"
                    >
                      <span className="block font-medium text-zinc-300">{item.label}</span>
                      <span className="text-[11px] text-zinc-600">{item.href}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
