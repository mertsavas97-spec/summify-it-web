import Link from "next/link";
import type { BlogContentCluster } from "@/data/blog-clusters";
import { BLOG_CONTENT_CLUSTERS } from "@/data/blog-clusters";

type BlogWorkflowCtaProps = {
  cluster: BlogContentCluster;
  steps?: string[];
};

export function BlogWorkflowCta({ cluster, steps }: BlogWorkflowCtaProps) {
  const meta = BLOG_CONTENT_CLUSTERS[cluster];
  const defaultSteps: Record<BlogContentCluster, string[]> = {
    "ai-pdf-summarizer": ["Upload PDF", "Choose mode", "Review Learn cards", "Take quiz"],
    "ai-youtube-summarizer": ["Paste YouTube URL", "Analyze transcript", "Study with Learn cards"],
    "pptx-summarizer": ["Upload PPTX", "Executive or team mode", "Export insights"],
    "learn-cards": ["Run analysis", "Complete Learn session", "Schedule review"],
    "ai-quiz-generation": ["Finish Learn cards", "Start quiz", "Review weak themes"],
    "study-workflows": ["Summarize source", "Learn cards", "Quiz", "Spaced review"],
    "research-workflows": ["Upload paper PDF", "Key insights", "Verify in source"],
  };
  const workflowSteps = steps ?? defaultSteps[cluster];

  return (
    <section
      className="rounded-2xl border border-white/[0.08] bg-zinc-950/70 px-5 py-5 sm:px-6"
      data-blog-cta="workflow"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
        {meta.label} workflow
      </p>
      <p className="mt-2 text-sm text-zinc-400">{meta.description}</p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {workflowSteps.map((step, i) => (
          <li
            key={step}
            className="rounded-lg border border-white/[0.06] bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400"
          >
            <span className="mr-1 font-medium text-violet-300/90">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      <Link
        href={meta.primaryCtaHref}
        className="mt-4 inline-flex text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        {meta.primaryCtaLabel} →
      </Link>
    </section>
  );
}
