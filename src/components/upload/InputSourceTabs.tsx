"use client";

import { FileText, Globe, PlaySquare, Type, type LucideIcon } from "lucide-react";
import type { WorkspaceInputMode } from "@/types/extraction";

const TABS: {
  id: WorkspaceInputMode;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "file", label: "File", icon: FileText },
  { id: "text", label: "Text", icon: Type },
  { id: "url", label: "Web URL", icon: Globe },
  { id: "youtube", label: "YouTube", icon: PlaySquare },
];

type InputSourceTabsProps = {
  active: WorkspaceInputMode;
  onChange: (mode: WorkspaceInputMode) => void;
  disabled?: boolean;
};

export function InputSourceTabs({
  active,
  onChange,
  disabled = false,
}: InputSourceTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/25 p-1"
      role="tablist"
      aria-label="Input source"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
              isActive
                ? "bg-violet-500/15 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.12)] ring-1 ring-violet-400/25"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-violet-300/90" : "text-zinc-600"}`}
              strokeWidth={1.75}
              aria-hidden={true}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
