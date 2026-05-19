import Link from "next/link";
import { getFeaturedDemoWorkflows } from "@/data/demos/workflows";
import { Button } from "@/components/ui/Button";

type DemoWorkflowBlockProps = {
  title?: string;
  limit?: number;
  className?: string;
};

export function DemoWorkflowBlock({
  title = "Example workflows",
  limit = 2,
  className = "",
}: DemoWorkflowBlockProps) {
  const workflows = getFeaturedDemoWorkflows(limit);

  return (
    <section className={`rounded-xl border border-white/[0.06] bg-zinc-950/30 p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      <ul className="mt-4 space-y-4">
        {workflows.map((workflow) => (
          <li
            key={workflow.id}
            className="rounded-lg border border-white/[0.05] bg-zinc-950/50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {workflow.badge ? (
                <span className="rounded border border-violet-500/20 bg-violet-950/30 px-1.5 py-px text-[10px] font-medium text-violet-300/80">
                  {workflow.badge}
                </span>
              ) : null}
              <h3 className="text-sm font-medium text-zinc-200">{workflow.title}</h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{workflow.description}</p>
            <Link
              href={workflow.ctaHref}
              className="mt-3 inline-block text-xs font-medium text-violet-400/90 hover:text-violet-300"
            >
              {workflow.ctaLabel} →
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button href="/upload" size="sm" variant="secondary">
          Start your own analysis
        </Button>
      </div>
    </section>
  );
}
