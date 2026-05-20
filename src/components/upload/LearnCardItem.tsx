"use client";

import { useState } from "react";
import { LearnSourceTracePanel } from "@/components/learn/LearnSourceTracePanel";
import type { LearnCardOutput, LearnCardOutputType } from "@/types/text-analysis";
import { parseQuizContent } from "@/types/text-analysis";

const CARD_STYLES: Record<
  LearnCardOutputType,
  {
    label: string;
    border: string;
    bg: string;
    accent: string;
    hoverShadow: string;
    icon: React.ReactNode;
  }
> = {
  concept: {
    label: "Concept",
    border: "border-violet-500/25",
    bg: "bg-violet-950/20",
    accent: "text-violet-400/80",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(139,92,246,0.45)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.189a6.01 6.01 0 01-1.5-.189m1.5.189a6.01 6.01 0 001.5-.189M12 12.75V6m0 0a6.01 6.01 0 00-1.5-.189M12 6a6.01 6.01 0 011.5-.189M12 6V4.5" />
      </svg>
    ),
  },
  why: {
    label: "Why",
    border: "border-indigo-500/25",
    bg: "bg-indigo-950/20",
    accent: "text-indigo-400/80",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(99,102,241,0.4)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  why_it_matters: {
    label: "Why",
    border: "border-indigo-500/25",
    bg: "bg-indigo-950/20",
    accent: "text-indigo-400/80",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(99,102,241,0.4)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  memory_hook: {
    label: "Hook",
    border: "border-amber-500/25",
    bg: "bg-amber-950/15",
    accent: "text-amber-400/80",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(245,158,11,0.35)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  quiz: {
    label: "Quiz",
    border: "border-emerald-500/25",
    bg: "bg-emerald-950/15",
    accent: "text-emerald-400/80",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(52,211,153,0.35)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  connection: {
    label: "Link",
    border: "border-cyan-500/20",
    bg: "bg-cyan-950/10",
    accent: "text-cyan-400/75",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(34,211,238,0.3)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5m0 0l-1.757 1.757a4.5 4.5 0 01-6.364 0m0 0l1.757-1.757m0 0a4.5 4.5 0 000-6.364l-4.5-4.5a4.5 4.5 0 011.242-7.244" />
      </svg>
    ),
  },
  misconception: {
    label: "Myth",
    border: "border-rose-500/20",
    bg: "bg-rose-950/10",
    accent: "text-rose-400/75",
    hoverShadow: "hover:shadow-[0_0_16px_-10px_rgba(244,63,94,0.3)]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
};

function resolveStyle(type: LearnCardOutputType) {
  return CARD_STYLES[type] ?? CARD_STYLES.concept;
}

type LearnCardItemProps = {
  card: LearnCardOutput;
};

function FutureHookButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className="rounded border border-white/[0.05] bg-zinc-950/40 px-1.5 py-px text-[8px] font-medium text-zinc-600 cursor-not-allowed"
    >
      {label}
    </button>
  );
}

export function LearnCardItem({ card }: LearnCardItemProps) {
  const style = resolveStyle(card.type);
  const isQuiz = card.type === "quiz";
  const quiz = isQuiz ? parseQuizContent(card.content) : null;
  const [showAnswer, setShowAnswer] = useState(false);

  const displayContent = isQuiz && quiz ? quiz.question : card.content;
  const relCount = card.cardRelationships?.length ?? 0;
  const difficultyLabel =
    card.difficulty === "high"
      ? "Dense"
      : card.difficulty === "low"
        ? "Recall"
        : card.difficulty === "medium"
          ? "Medium"
          : null;

  return (
    <li
      className={`group rounded-lg border p-2.5 transition-colors duration-150 hover:border-white/15 ${style.border} ${style.bg} ${style.hoverShadow}`}
      data-learn-card-type={card.type}
      data-workspace-learn-card
    >
      <div className="flex gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-zinc-950/50 ${style.accent}`}
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`text-[8px] font-medium uppercase tracking-wider ${style.accent}`}>
              {style.label}
            </p>
            {difficultyLabel ? (
              <span
                className="rounded border border-white/[0.06] bg-zinc-950/60 px-1 py-px text-[8px] text-zinc-500"
                title={`Abstraction: ${card.abstractionLevel ?? "n/a"} · Memory weight: ${card.memoryWeight ?? "n/a"}`}
              >
                {difficultyLabel}
              </span>
            ) : null}
            {relCount > 0 ? (
              <span
                className="rounded border border-white/[0.06] bg-zinc-950/60 px-1 py-px text-[8px] text-zinc-500"
                title={card.cardRelationships?.map((r) => `${r.type} → ${r.targetCardId}`).join(", ")}
              >
                {relCount} link{relCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-50">
            {card.title}
          </p>
          <p className="mt-1 line-clamp-4 text-[11px] leading-snug text-zinc-500">
            {displayContent}
          </p>
          {isQuiz && quiz?.answer && (
            <div className="mt-1.5">
              {showAnswer ? (
                <p className="rounded border border-emerald-500/15 bg-emerald-950/15 px-2 py-1.5 text-[11px] leading-snug text-emerald-200/85">
                  {quiz.answer}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="text-[9px] font-medium text-emerald-500/80 hover:text-emerald-400"
                >
                  Show answer
                </button>
              )}
            </div>
          )}
          <LearnSourceTracePanel trace={card.sourceTrace} />
          <div className="mt-2 flex flex-wrap gap-1 opacity-50 transition-opacity md:opacity-0 md:group-hover:opacity-45">
            <FutureHookButton label="Save" />
            <FutureHookButton label="Remembered" />
            <FutureHookButton label="Review later" />
            {isQuiz && <FutureHookButton label="Quiz mode" />}
          </div>
        </div>
      </div>
    </li>
  );
}
