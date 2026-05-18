type UseCase = {
  title: string;
  description: string;
};

type UseCaseSectionProps = {
  title: string;
  subtitle?: string;
  cases: UseCase[];
};

export function UseCaseSection({ title, subtitle, cases }: UseCaseSectionProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-zinc-500">{subtitle}</p>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-zinc-900/60 to-zinc-950/40 p-5"
            >
              <h3 className="text-sm font-medium text-violet-200">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
