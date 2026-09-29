"use client";

import { CheckCircle, XCircle, BookOpen, Headphones, Network, HelpCircle, Zap } from "lucide-react";

type DiffRow = {
  title: string;
  description: string;
  icon: typeof Zap;
  sumiffy: true;
  others: boolean | "partial";
};

const DIFFERENTIATORS: DiffRow[] = [
  {
    title: "Study workflow, not just summaries",
    description: "Flashcards → Quiz → Mind map → Audio → Podcast from ONE upload. Others stop at text.",
    icon: Zap,
    sumiffy: true,
    others: false,
  },
  {
    title: "Source-grounded quiz (not templates)",
    description: "Questions generated from YOUR document with LLM. Distractors are real facts from the source — no generic 'create a blog post' options.",
    icon: HelpCircle,
    sumiffy: true,
    others: false,
  },
  {
    title: "Interactive mind map",
    description: "Explore concepts as a navigable graph. Zoom, pan, click nodes for details. Pro only.",
    icon: Network,
    sumiffy: true,
    others: false,
  },
  {
    title: "Audio lessons & two-host podcasts",
    description: "Teacher-style narration or conversational podcast generated from your analysis. Natural voices, playback controls.",
    icon: Headphones,
    sumiffy: true,
    others: "partial",
  },
  {
    title: "Intelligence modes (lenses)",
    description: "6 modes: General, Student, Executive, Creator, Contract, Exam. Each tunes depth, structure & output.",
    icon: BookOpen,
    sumiffy: true,
    others: "partial",
  },
  {
    title: "No hallucination guarantee on citations",
    description: "Every insight, card, and quiz answer traces to your source. We don't invent facts.",
    icon: CheckCircle,
    sumiffy: true,
    others: false,
  },
];

function CheckIcon({ met }: { met: boolean | "partial" }) {
  if (met === true) {
    return <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden />;
  }
  if (met === "partial") {
    return (
      <svg className="h-5 w-5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }
  return <XCircle className="h-5 w-5 text-zinc-600 shrink-0" aria-hidden />;
}

export function DifferentiationStrip() {
  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="diff-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 id="diff-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Why Summify?
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed text-zinc-500">
            We&apos;re not another chat wrapper. Summify is a structured study workspace — summary first,
            then active recall, then audio — all from the same upload.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left" role="table">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-sm font-medium text-zinc-400">Capability</th>
                <th className="pb-3 text-sm font-medium text-zinc-400 text-center w-28">Summify</th>
                <th className="pb-3 text-sm font-medium text-zinc-400 text-center w-28">NotebookLM</th>
                <th className="pb-3 text-sm font-medium text-zinc-400 text-center w-28">ChatPDF</th>
                <th className="pb-3 text-sm font-medium text-zinc-400 text-center w-28">Notion AI</th>
              </tr>
            </thead>
            <tbody>
              {DIFFERENTIATORS.map((row, i) => {
                const othersMet = row.others === true ? true : row.others === "partial" ? "partial" : false;
                return (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300" aria-hidden>
                          <row.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-zinc-100">{row.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">{row.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center"><CheckIcon met={row.sumiffy} /></td>
                    <td className="py-4 text-center"><CheckIcon met={othersMet} /></td>
                    <td className="py-4 text-center"><CheckIcon met={othersMet} /></td>
                    <td className="py-4 text-center"><CheckIcon met={othersMet} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          <CheckCircle className="inline h-3 w-3 text-emerald-400" aria-hidden /> Full support &nbsp;
          <svg className="inline h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><line x1="5" y1="12" x2="19" y2="12" /></svg> Partial / limited &nbsp;
          <XCircle className="inline h-3 w-3 text-zinc-600" aria-hidden /> Not available
        </p>
      </div>
    </section>
  );
}