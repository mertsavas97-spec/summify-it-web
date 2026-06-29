import Link from "next/link";
import { ChevronRight, FileText, Headphones, Newspaper, Video } from "lucide-react";

const FORMAT_CARDS = [
  {
    href: "/pdf-summarizer",
    label: "PDF Summarizer",
    description: "Summarize research papers, textbooks, and PDFs",
    icon: FileText,
  },
  {
    href: "/video-summarizer",
    label: "Video Summarizer",
    description: "Get summaries from YouTube videos, lectures, and tutorials",
    icon: Video,
  },
  {
    href: "/summarize-web-articles",
    label: "Article Summarizer",
    description: "Summarize web articles, blog posts, and research",
    icon: Newspaper,
  },
  {
    href: "/summarize-mp3",
    label: "Podcast Summarizer",
    description: "Turn podcasts and audio into study notes and quizzes",
    icon: Headphones,
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
          Summarize anything
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
          Free AI summarizer for PDFs, YouTube videos, articles, and podcasts — pick your format and
          start in the workspace.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMAT_CARDS.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-42px_rgba(124,58,237,0.28)] transition-all duration-300 hover:border-violet-300/70 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-zinc-950/45 dark:shadow-[0_18px_70px_-56px_rgba(124,58,237,0.55)] dark:hover:border-violet-500/25 dark:hover:bg-zinc-950/55"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/50 bg-violet-100 text-violet-700 dark:border-violet-500/20 dark:bg-violet-950/35 dark:text-violet-200">
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
                  {card.label}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
                  {card.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-300/90">
                  Open tool
                  <ChevronRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
