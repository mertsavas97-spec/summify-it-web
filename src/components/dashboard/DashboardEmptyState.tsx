import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Suggestion = {
  href: string;
  label: string;
  description: string;
};

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    href: "/summarize-pdf",
    label: "Upload a PDF",
    description: "Reports, papers, and study packs",
  },
  {
    href: "/summarize-youtube-video",
    label: "Analyze a YouTube video",
    description: "Transcript intelligence in one step",
  },
  {
    href: "/summarize-powerpoint",
    label: "Summarize a PowerPoint",
    description: "Decks and slide narratives",
  },
];

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: { href: string; label: string };
  suggestions?: Suggestion[];
};

export function DashboardEmptyState({
  title,
  description,
  primaryAction = { href: "/upload", label: "Open workspace" },
  suggestions = DEFAULT_SUGGESTIONS,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] bg-gradient-to-b from-violet-950/15 to-zinc-900/30 px-6 py-10 text-center sm:px-10">
      <p className="text-base font-semibold text-zinc-200">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
      <Button href={primaryAction.href} size="md" className="mt-6">
        {primaryAction.label}
      </Button>
      <ul className="mx-auto mt-8 grid max-w-lg gap-2 text-left sm:grid-cols-3">
        {suggestions.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3 py-3 transition-colors hover:border-violet-500/25 hover:bg-zinc-900/60"
            >
              <p className="text-xs font-medium text-violet-200/90">{item.label}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
