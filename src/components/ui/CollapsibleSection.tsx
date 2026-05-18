"use client";

import { useId, useState } from "react";

type CollapsibleSectionProps = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "learn";
};

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
  className = "",
  variant = "default",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={`border-b border-white/[0.06] last:border-b-0 ${className}`}
      data-workspace-section={title.toLowerCase().replace(/\s+/g, "-")}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="group flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-zinc-200"
      >
        <span className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              variant === "learn" ? "text-violet-300/90" : "text-zinc-400"
            }`}
          >
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-500">
              {count}
            </span>
          )}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-zinc-900/80 text-zinc-500 transition-transform duration-200 ease-out group-hover:border-white/10 group-hover:text-zinc-400 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div id={panelId} className="overflow-hidden">
          <div className="pb-4 pt-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
