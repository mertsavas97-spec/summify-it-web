"use client";

import Link from "next/link";
import { BookOpen, Headphones, Layers, Network, HelpCircle } from "lucide-react";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

const NEXT_STEPS = [
  {
    title: "Summary",
    body: "Structured overview and key insights first — the default path for every source.",
    href: "/upload",
    intent: "summary",
    Icon: BookOpen,
    primary: true,
  },
  {
    title: "Study cards",
    body: "Turn insights into flashcards for active recall from the same analysis.",
    href: "/upload",
    intent: "study",
    Icon: Layers,
    primary: false,
  },
  {
    title: "Quiz",
    body: "Test your understanding with source-grounded questions — not generic templates.",
    href: "/upload",
    intent: "quiz",
    Icon: HelpCircle,
    primary: false,
  },
  {
    title: "Mind map",
    body: "Explore the analysis as an interactive concept graph — available on Pro plans.",
    href: "/upload",
    intent: "mindmap",
    Icon: Network,
    primary: false,
  },
  {
    title: "Audio & Podcast",
    body: "Generate a teacher-style lesson or two-host discussion after your summary.",
    href: "/upload?intent=audio",
    intent: "audio",
    Icon: Headphones,
    primary: false,
  },
] as const;

/** Post-hero value props aligned with Summary → Study → Audio/Podcast. */
export function HomeAfterSummarySection() {
  return (
    <section
      className="border-b border-slate-200/70 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:border-white/[0.04]"
      aria-labelledby="home-after-summary-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2
            id="home-after-summary-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
          >
            After the summary, keep going
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
            Most summarizers stop at text. Summify continues into study cards, quiz questions, an
            interactive mind map, then optional audio or podcast — always from the same upload.
          </p>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEXT_STEPS.map((item) => {
            const Icon = item.Icon;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  onClick={() =>
                    trackProductEventV2Client("landing_cta_clicked", {
                      metadata: {
                        placement: "after_summary_card",
                        target: item.href,
                        intent: item.intent,
                      },
                    })
                  }
                  className={`group flex h-full min-w-0 flex-col rounded-2xl border p-5 transition-colors ${
                    item.primary
                      ? "border-violet-300/50 bg-violet-50/80 hover:border-violet-400/70 dark:border-violet-400/25 dark:bg-violet-950/25 dark:hover:border-violet-400/40"
                      : "border-slate-200/80 bg-white hover:border-violet-400/40 dark:border-white/[0.06] dark:bg-zinc-950/40 dark:hover:border-violet-500/25"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      item.primary
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-700 dark:text-violet-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.08] dark:bg-zinc-950/50 dark:text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
                    {item.body}
                  </p>
                  <span className="mt-3 text-xs font-medium text-violet-700 group-hover:underline dark:text-violet-300">
                    Open workspace
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-sm text-slate-500 dark:text-zinc-500">
          Prefer a dedicated page?{" "}
          <Link
            href="/for-students"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
          >
            For students
          </Link>
          {" · "}
          <Link
            href="/audio-study"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
          >
            Audio study
          </Link>
        </p>
      </div>
    </section>
  );
}
