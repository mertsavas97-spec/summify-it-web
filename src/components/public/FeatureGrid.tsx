type Feature = {
  title: string;
  description: string;
};

type FeatureGridProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  features: Feature[];
};

export function FeatureGrid({ eyebrow, title, subtitle, features }: FeatureGridProps) {
  return (
    <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">{subtitle}</p>
        )}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-5 transition-colors hover:border-violet-500/20"
            >
              <h3 className="text-sm font-semibold text-zinc-100">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
