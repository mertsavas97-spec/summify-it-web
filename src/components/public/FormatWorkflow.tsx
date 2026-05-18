type Step = {
  title: string;
  description: string;
};

type FormatWorkflowProps = {
  title?: string;
  steps: Step[];
};

export function FormatWorkflow({
  title = "How it works",
  steps,
}: FormatWorkflowProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4"
            >
              <span className="font-mono text-[10px] text-violet-400/90">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-sm font-medium text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
