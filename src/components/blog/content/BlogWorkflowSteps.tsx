type BlogWorkflowStepsProps = {
  title?: string;
  steps: Array<{ name: string; description: string }>;
};

export function BlogWorkflowSteps({ title = "Workflow", steps }: BlogWorkflowStepsProps) {
  return (
    <section className="my-8 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-5 not-prose">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.name} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-950/40 text-xs font-semibold text-violet-200"
              aria-hidden
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">{step.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
