"use client";

import {
  BookOpen,
  Brain,
  HelpCircle,
  Layers,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

export type ResultsSectionId =
  | "learn"
  | "quiz"
  | "summary"
  | "insights"
  | "flashcards";

type TabMeta = {
  label: string;
  Icon: LucideIcon;
  idle: string;
  active: string;
  iconActive: string;
};

const TAB_META: Record<ResultsSectionId, TabMeta> = {
  learn: {
    label: "Learn",
    Icon: Brain,
    idle: "border-sky-500/15 bg-sky-500/[0.04] text-sky-200/70 hover:border-sky-400/30 hover:text-sky-100",
    active:
      "border-sky-400/40 bg-sky-500/20 text-sky-50 shadow-[0_0_20px_rgba(56,189,248,0.18)]",
    iconActive: "text-sky-200",
  },
  quiz: {
    label: "Quiz",
    Icon: HelpCircle,
    idle: "border-violet-500/15 bg-violet-500/[0.04] text-violet-200/70 hover:border-violet-400/30 hover:text-violet-100",
    active:
      "border-violet-400/40 bg-violet-500/20 text-violet-50 shadow-[0_0_20px_rgba(139,92,246,0.22)]",
    iconActive: "text-violet-200",
  },
  summary: {
    label: "Summary",
    Icon: BookOpen,
    idle: "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-200/70 hover:border-emerald-400/30 hover:text-emerald-100",
    active:
      "border-emerald-400/40 bg-emerald-500/20 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.16)]",
    iconActive: "text-emerald-200",
  },
  insights: {
    label: "Key insights",
    Icon: Lightbulb,
    idle: "border-amber-500/15 bg-amber-500/[0.04] text-amber-200/70 hover:border-amber-400/30 hover:text-amber-100",
    active:
      "border-amber-400/40 bg-amber-500/20 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.16)]",
    iconActive: "text-amber-200",
  },
  flashcards: {
    label: "Flashcards",
    Icon: Layers,
    idle: "border-fuchsia-500/15 bg-fuchsia-500/[0.04] text-fuchsia-200/70 hover:border-fuchsia-400/30 hover:text-fuchsia-100",
    active:
      "border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.16)]",
    iconActive: "text-fuchsia-200",
  },
};

type ResultsSectionTabsProps = {
  sections: ResultsSectionId[];
  activeId?: ResultsSectionId;
  onNavigate: (id: ResultsSectionId) => void;
};

export function ResultsSectionTabs({
  sections,
  activeId,
  onNavigate,
}: ResultsSectionTabsProps) {
  if (sections.length === 0) return null;

  return (
    <nav
      className="sticky top-[4.25rem] z-20 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0d1018]/95 p-1.5 backdrop-blur-md"
      aria-label="Results sections"
      data-results-section-tabs
    >
      <div className="flex min-w-max gap-1.5">
        {sections.map((id) => {
          const meta = TAB_META[id];
          const Icon = meta.Icon;
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                active ? meta.active : meta.idle
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${active ? meta.iconActive : "opacity-80"}`}
                aria-hidden
              />
              {meta.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function scrollToResultsSection(id: ResultsSectionId) {
  const el = document.getElementById(`result-section-${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 120;
  window.scrollTo({ top, behavior: "smooth" });
}
