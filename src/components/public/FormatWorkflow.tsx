type Step = {
  title: string;
  description: string;
};

type FormatWorkflowProps = {
  id?: string;
  title?: string;
  steps: Step[];
};

export function FormatWorkflow({
  id,
  title = "How it works",
  steps,
}: FormatWorkflowProps) {
  return (
    <section id={id} className="border-b border-white/[0.04] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <div className="relative mt-10">
          <div
            className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent lg:block"
            aria-hidden
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex h-full min-h-[168px] flex-col rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-6 shadow-[0_18px_70px_-56px_rgba(34,211,238,0.35)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-950/30 font-mono text-xs font-semibold text-violet-200">
                    <span
                      className="pointer-events-none absolute -inset-2 rounded-full bg-violet-500/14 blur-md"
                      aria-hidden
                    />
                    <span className="relative">{String(index + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-zinc-950/40 px-2 py-0.5 text-[10px] text-zinc-500">
                    Step
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-medium text-zinc-100">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
