import Link from "next/link";
import { getFeaturedDemoWorkflows } from "@/data/demos/workflows";
import { Button } from "@/components/ui/Button";

type DemoWorkflowBlockProps = {
  title?: string;
  limit?: number;
  className?: string;
  variant?: "default" | "subtle";
};

export function DemoWorkflowBlock({
  title = "Example workflows",
  limit = 2,
  className = "",
  variant = "default",
}: DemoWorkflowBlockProps) {
  const workflows = getFeaturedDemoWorkflows(limit);
  const isSubtle = variant === "subtle";

  return (
    <section
      className={`rounded-xl border ${
        isSubtle
          ? "border-white/[0.035] bg-black/10 p-3.5 opacity-75"
          : "border-white/[0.06] bg-zinc-950/30 p-5"
      } ${className}`}
      data-workspace-example-workflows
    >
      <h2
        className={
          isSubtle
            ? "text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500"
            : "text-sm font-semibold text-zinc-200"
        }
      >
        {title}
      </h2>
      <ul className={isSubtle ? "mt-3 space-y-2.5" : "mt-4 space-y-4"}>
        {workflows.map((workflow) => (
          <li
            key={workflow.id}
            className={
              isSubtle
                ? "rounded-lg border border-white/[0.035] bg-white/[0.015] p-3"
                : "rounded-lg border border-white/[0.05] bg-zinc-950/50 p-4"
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {workflow.badge ? (
                <span className="rounded border border-violet-500/15 bg-violet-950/25 px-1.5 py-px text-[9px] font-medium text-violet-300/70">
                  {workflow.badge}
                </span>
              ) : null}
              <h3
                className={
                  isSubtle
                    ? "text-xs font-medium text-zinc-400"
                    : "text-sm font-medium text-zinc-200"
                }
              >
                {workflow.title}
              </h3>
            </div>
            <p
              className={
                isSubtle
                  ? "mt-1 text-[11px] leading-relaxed text-zinc-600"
                  : "mt-1.5 text-xs leading-relaxed text-zinc-500"
              }
            >
              {workflow.description}
            </p>
            <Link
              href={workflow.ctaHref}
              className={
                isSubtle
                  ? "mt-2 inline-block text-[11px] font-medium text-violet-400/70 hover:text-violet-300/90"
                  : "mt-3 inline-block text-xs font-medium text-violet-400/90 hover:text-violet-300"
              }
            >
              {workflow.ctaLabel} →
            </Link>
          </li>
        ))}
      </ul>
      {!isSubtle && (
        <div className="mt-4">
          <Button href="/upload" size="sm" variant="secondary">
            Start your own analysis
          </Button>
        </div>
      )}
    </section>
  );
}
