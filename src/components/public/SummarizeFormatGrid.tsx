import Link from "next/link";
import { ChevronRight, FileText, Presentation, Newspaper, Video } from "lucide-react";

const FORMAT_CARDS = [
  {
    href: "/summarize-pdf",
    label: "PDF Summarizer",
    description: "Summarize research papers, textbooks, and reports with AI",
    icon: FileText,
  },
  {
    href: "/summarize-powerpoint",
    label: "PowerPoint Summarizer",
    description: "Summarize PPTX decks — narrative, themes, and key slides",
    icon: Presentation,
  },
  {
    href: "/summarize-youtube-video",
    label: "YouTube Summarizer",
    description: "Get AI summaries from YouTube transcripts and lectures",
    icon: Video,
  },
  {
    href: "/summarize-web-articles",
    label: "Article Summarizer",
    description: "Summarize web articles, blog posts, and research URLs",
    icon: Newspaper,
  },
] as const;

export function SummarizeFormatGrid() {
  return (
    <section
      className="border-b border-slate-200/70 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:border-white/[0.04]"
      aria-labelledby="summarize-format-grid-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="summarize-format-grid-heading"
          className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
        >
          Choose your AI summarizer
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 dark:text-zinc-500">
          Same workspace for every format — structured summary, insights, flashcards, and quiz.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-violet-400/40 dark:border-white/[0.06] dark:bg-zinc-950/40 dark:hover:border-violet-500/25"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/50 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {card.label}
                  </span>
                  <span className="mt-2 flex-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-500">
                    {card.description}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-600 group-hover:gap-1.5 dark:text-violet-300">
                    Open
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
