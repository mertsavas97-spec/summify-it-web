"use client";

import { BookOpen, Check, Headphones, Mic, Sparkles } from "lucide-react";
import {
  LEARNING_EXPERIENCE_OPTIONS,
  type LearningExperienceId,
} from "@/types/learning-experience";

const ICONS = {
  "summary-learn": BookOpen,
  audio: Headphones,
  podcast: Mic,
} as const;

type ExperienceVisual = {
  eyebrow: string;
  formatLabel: string;
  accentBar: string;
  idle: {
    border: string;
    bg: string;
    decor: string;
    iconWrap: string;
    icon: string;
    title: string;
    chip: string;
  };
  selected: {
    border: string;
    bg: string;
    glow: string;
    decor: string;
    iconWrap: string;
    icon: string;
    title: string;
    chip: string;
    badge: string;
    check: string;
  };
};

const EXPERIENCE_VISUALS: Record<LearningExperienceId, ExperienceVisual> = {
  "summary-learn": {
    eyebrow: "Read & study",
    formatLabel: "Text-first",
    accentBar: "bg-gradient-to-r from-violet-400 via-violet-300 to-indigo-400",
    idle: {
      border: "border-violet-500/12",
      bg: "bg-gradient-to-br from-violet-950/35 via-[#0f1018] to-[#0c0e14]",
      decor: "bg-[radial-gradient(ellipse_at_100%_0%,rgba(139,92,246,0.14),transparent_55%)]",
      iconWrap: "bg-violet-500/10 ring-violet-400/20",
      icon: "text-violet-300/70",
      title: "text-violet-50/90",
      chip: "border-violet-400/10 bg-violet-500/[0.07] text-violet-200/55",
    },
    selected: {
      border: "border-violet-400/35",
      bg: "bg-gradient-to-br from-violet-600/20 via-violet-950/50 to-[#100d18]",
      glow: "shadow-[0_0_48px_rgba(139,92,246,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]",
      decor: "bg-[radial-gradient(ellipse_at_100%_0%,rgba(167,139,250,0.28),transparent_50%)]",
      iconWrap: "bg-violet-500/25 ring-violet-300/40 shadow-[0_0_20px_rgba(139,92,246,0.35)]",
      icon: "text-violet-100",
      title: "text-white",
      chip: "border-violet-300/25 bg-violet-500/15 text-violet-100/90",
      badge: "border-violet-300/25 bg-violet-500/20 text-violet-100",
      check: "bg-violet-400 text-violet-950 shadow-violet-400/40",
    },
  },
  audio: {
    eyebrow: "Listen & learn",
    formatLabel: "Audio lesson",
    accentBar: "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400",
    idle: {
      border: "border-sky-500/12",
      bg: "bg-gradient-to-br from-sky-950/30 via-[#0c1016] to-[#0a0d12]",
      decor: "bg-[radial-gradient(ellipse_at_0%_100%,rgba(56,189,248,0.12),transparent_55%)]",
      iconWrap: "bg-sky-500/10 ring-sky-400/20",
      icon: "text-sky-300/70",
      title: "text-sky-50/90",
      chip: "border-sky-400/10 bg-sky-500/[0.07] text-sky-200/55",
    },
    selected: {
      border: "border-sky-400/35",
      bg: "bg-gradient-to-br from-sky-500/18 via-sky-950/45 to-[#0a1218]",
      glow: "shadow-[0_0_48px_rgba(56,189,248,0.24),inset_0_1px_0_rgba(255,255,255,0.06)]",
      decor: "bg-[radial-gradient(ellipse_at_0%_100%,rgba(125,211,252,0.22),transparent_50%)]",
      iconWrap: "bg-sky-500/25 ring-sky-300/40 shadow-[0_0_20px_rgba(56,189,248,0.3)]",
      icon: "text-sky-100",
      title: "text-white",
      chip: "border-sky-300/25 bg-sky-500/15 text-sky-100/90",
      badge: "border-sky-300/25 bg-sky-500/20 text-sky-100",
      check: "bg-sky-400 text-sky-950 shadow-sky-400/40",
    },
  },
  podcast: {
    eyebrow: "Discuss & explore",
    formatLabel: "Two hosts",
    accentBar: "bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400",
    idle: {
      border: "border-amber-500/12",
      bg: "bg-gradient-to-br from-amber-950/25 via-[#100e0c] to-[#0c0b0a]",
      decor: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,146,60,0.1),transparent_60%)]",
      iconWrap: "bg-amber-500/10 ring-amber-400/20",
      icon: "text-amber-300/70",
      title: "text-amber-50/90",
      chip: "border-amber-400/10 bg-amber-500/[0.07] text-amber-200/55",
    },
    selected: {
      border: "border-amber-400/35",
      bg: "bg-gradient-to-br from-amber-500/16 via-orange-950/40 to-[#120e0a]",
      glow: "shadow-[0_0_48px_rgba(251,146,60,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
      decor: "bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.2),transparent_55%)]",
      iconWrap: "bg-amber-500/25 ring-amber-300/40 shadow-[0_0_20px_rgba(251,146,60,0.28)]",
      icon: "text-amber-100",
      title: "text-white",
      chip: "border-amber-300/25 bg-amber-500/15 text-amber-100/90",
      badge: "border-amber-300/25 bg-amber-500/20 text-amber-100",
      check: "bg-amber-400 text-amber-950 shadow-amber-400/40",
    },
  },
};

function ExperienceDecor({
  id,
  selected,
  compact,
}: {
  id: LearningExperienceId;
  selected: boolean;
  compact: boolean;
}) {
  if (compact) return null;

  if (id === "summary-learn") {
    return (
      <div
        className={`pointer-events-none absolute right-4 top-14 flex flex-col gap-1 opacity-30 transition-opacity ${
          selected ? "opacity-55" : "group-hover:opacity-45"
        }`}
        aria-hidden
      >
        {[72, 56, 40].map((width) => (
          <span
            key={width}
            className="h-1 rounded-full bg-gradient-to-r from-violet-400/50 to-transparent"
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  if (id === "audio") {
    return (
      <div
        className={`pointer-events-none absolute right-4 top-14 flex items-end gap-0.5 opacity-30 transition-opacity ${
          selected ? "opacity-60" : "group-hover:opacity-45"
        }`}
        aria-hidden
      >
        {[10, 16, 22, 14, 20, 12, 18].map((height, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-sky-500/60 to-cyan-300/80"
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute right-5 top-14 flex -space-x-2 opacity-30 transition-opacity ${
        selected ? "opacity-65" : "group-hover:opacity-50"
      }`}
      aria-hidden
    >
      <span className="h-7 w-7 rounded-full border border-amber-300/30 bg-amber-500/25" />
      <span className="h-7 w-7 rounded-full border border-rose-300/30 bg-rose-500/25" />
    </div>
  );
}

type LearningExperienceSelectorProps = {
  value: LearningExperienceId;
  onChange: (value: LearningExperienceId) => void;
  disabled?: boolean;
  compact?: boolean;
  showHeader?: boolean;
};

export function LearningExperienceSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  showHeader = true,
}: LearningExperienceSelectorProps) {
  return (
    <section className={compact ? "space-y-3" : "space-y-5"} data-learning-experience-selector>
      {showHeader ? (
        <div>
          {!compact ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/70">
              Step 2 · Output
            </p>
          ) : null}
          <h2
            className={`font-semibold tracking-tight text-white ${
              compact ? "text-sm sm:text-base" : "mt-1 text-lg sm:text-xl"
            }`}
          >
            Choose your summarizer output
          </h2>
          {!compact ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Start with an AI summary — then learn with flashcards and quiz, or listen as audio.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500">AI summary, audio lesson, or podcast.</p>
          )}
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
        {LEARNING_EXPERIENCE_OPTIONS.map((option) => {
          const Icon = ICONS[option.id];
          const visual = EXPERIENCE_VISUALS[option.id];
          const palette = value === option.id ? visual.selected : visual.idle;
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                compact
                  ? "min-h-[120px] p-2.5 sm:min-h-[138px] sm:p-3"
                  : "min-h-[148px] p-3 sm:min-h-[220px] sm:p-5"
              } ${palette.border} ${palette.bg} ${
                selected
                  ? `${visual.selected.glow} sm:scale-[1.02]`
                  : "sm:hover:scale-[1.01]"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${visual.accentBar} ${
                  selected ? "opacity-100" : "opacity-35 group-hover:opacity-55"
                }`}
                aria-hidden
              />

              <span
                className={`pointer-events-none absolute inset-0 ${palette.decor}`}
                aria-hidden
              />

              <div className="relative flex min-w-0 items-start justify-between gap-1.5">
                <div className="min-w-0">
                  {!compact ? (
                    <p
                      className={`hidden text-[10px] font-semibold uppercase tracking-[0.12em] sm:block ${
                        selected
                          ? option.id === "summary-learn"
                            ? "text-violet-300/90"
                            : option.id === "audio"
                              ? "text-sky-300/90"
                              : "text-amber-300/90"
                          : "text-zinc-600"
                      }`}
                    >
                      {visual.eyebrow}
                    </p>
                  ) : null}
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center rounded-xl ring-1 transition-all sm:mt-1.5 ${
                      compact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9 sm:h-11 sm:w-11"
                    } ${palette.iconWrap}`}
                  >
                    <Icon
                      className={`${compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"} ${palette.icon}`}
                      strokeWidth={1.75}
                    />
                  </span>
                </div>

                {selected ? (
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold uppercase tracking-wide backdrop-blur-sm ${
                      compact
                        ? "px-1.5 py-0.5 text-[8px] sm:px-2 sm:text-[9px]"
                        : "px-1.5 py-0.5 text-[8px] sm:px-2.5 sm:py-1 sm:text-[10px]"
                    } ${visual.selected.badge}`}
                  >
                    {!compact ? (
                      <Sparkles className="hidden h-3 w-3 opacity-90 sm:inline" />
                    ) : null}
                    Selected
                  </span>
                ) : !compact ? (
                  <span
                    className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline ${palette.chip}`}
                  >
                    {visual.formatLabel}
                  </span>
                ) : null}
              </div>

              <div className={`relative min-w-0 flex-1 ${compact ? "mt-2" : "mt-2.5 sm:mt-4"}`}>
                <h3
                  className={`break-words font-semibold tracking-tight [overflow-wrap:anywhere] ${
                    compact ? "text-xs leading-snug sm:text-sm" : "text-sm leading-snug sm:text-base"
                  } ${selected ? visual.selected.title : visual.idle.title}`}
                >
                  {option.title}
                </h3>
                {!compact ? (
                  <p className="mt-1.5 hidden max-w-[18rem] text-xs leading-relaxed text-zinc-500 sm:block">
                    {option.description}
                  </p>
                ) : null}
              </div>

              <div
                className={`relative flex min-w-0 flex-wrap gap-1 ${
                  compact ? "mt-2" : "mt-2.5 sm:mt-4"
                }`}
              >
                {(compact ? option.chips.slice(0, 1) : option.chips.slice(0, 2)).map((chip) => (
                  <span
                    key={chip}
                    className={`max-w-full truncate rounded-full border font-medium sm:max-w-none ${
                      compact
                        ? "px-1.5 py-0.5 text-[8px] sm:text-[9px]"
                        : "px-1.5 py-0.5 text-[8px] sm:px-2.5 sm:text-[10px]"
                    } ${palette.chip}`}
                  >
                    {chip}
                  </span>
                ))}
                {!compact
                  ? option.chips.slice(2).map((chip) => (
                      <span
                        key={chip}
                        className={`hidden rounded-full border px-2.5 py-0.5 text-[10px] font-medium sm:inline ${palette.chip}`}
                      >
                        {chip}
                      </span>
                    ))
                  : null}
              </div>

              <ExperienceDecor id={option.id} selected={selected} compact={compact} />

              {selected && !compact ? (
                <span
                  className={`absolute bottom-3 right-3 hidden h-6 w-6 items-center justify-center rounded-full shadow-lg sm:bottom-4 sm:right-4 sm:flex ${visual.selected.check}`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
