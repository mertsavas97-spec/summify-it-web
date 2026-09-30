"use client";

import {
  BookOpen,
  Brain,
  HelpCircle,
  Layers,
  Lightbulb,
  Network,
  type LucideIcon,
} from "lucide-react";

export type ResultsSectionId =
  | "learn"
  | "quiz"
  | "summary"
  | "insights"
  | "flashcards"
  | "mindmap";

type TabMeta = {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  activeText: string;
  activeBar: string;
};

const TAB_META: Record<ResultsSectionId, TabMeta> = {
  learn: {
    label: "Learn",
    shortLabel: "Learn",
    Icon: Brain,
    activeText: "text-sky-100",
    activeBar: "bg-sky-400",
  },
  quiz: {
    label: "Quiz",
    shortLabel: "Quiz",
    Icon: HelpCircle,
    activeText: "text-violet-100",
    activeBar: "bg-violet-400",
  },
  summary: {
    label: "Summary",
    shortLabel: "Summary",
    Icon: BookOpen,
    activeText: "text-emerald-100",
    activeBar: "bg-emerald-400",
  },
  insights: {
    label: "Key insights",
    shortLabel: "Insights",
    Icon: Lightbulb,
    activeText: "text-amber-100",
    activeBar: "bg-amber-400",
  },
  flashcards: {
    label: "Study cards",
    shortLabel: "Study",
    Icon: Layers,
    activeText: "text-fuchsia-100",
    activeBar: "bg-fuchsia-400",
  },
  mindmap: {
    label: "Mind map",
    shortLabel: "MindMap",
    Icon: Network,
    activeText: "text-cyan-100",
    activeBar: "bg-cyan-400",
  },
};

type ResultsSectionTabsProps = {
  sections: ResultsSectionId[];
  activeId?: ResultsSectionId;
  onNavigate: (id: ResultsSectionId) => void;
  ariaLabel?: string;
  /** @deprecated sticky caused layout shift; ignored */
  sticky?: boolean;
};

/**
 * Underline segmented tabs — stable width, no floating card glow.
 */
export function ResultsSectionTabs({
  sections,
  activeId,
  onNavigate,
  ariaLabel = "Results sections",
}: ResultsSectionTabsProps) {
  if (sections.length === 0) return null;

  return (
    <nav
      className="w-full border-b border-white/[0.08] overflow-x-auto scrollbar-hide"
      aria-label={ariaLabel}
      data-results-section-tabs
      role="tablist"
    >
      <div className="flex min-w-max">
        {sections.map((id) => {
          const meta = TAB_META[id];
          const Icon = meta.Icon;
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onNavigate(id)}
              className={`relative inline-flex shrink-0 min-w-0 items-center justify-center gap-1.5 px-2 py-3 text-[11px] font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
                active ? meta.activeText : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              <span className="min-w-0 truncate sm:hidden">{meta.shortLabel}</span>
              <span className="hidden min-w-0 truncate sm:inline">{meta.label}</span>
              {active ? (
                <span
                  className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full sm:inset-x-3 ${meta.activeBar}`}
                  aria-hidden
                />
              ) : null}
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
  const top = el.getBoundingClientRect().top + window.scrollY - 112;
  window.scrollTo({ top, behavior: "smooth" });
}
