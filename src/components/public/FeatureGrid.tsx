import { ChevronRight } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald" | "amber" | "fuchsia" | "sky";
};

type FeatureGridProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  features: Feature[];
  variant?: "default" | "loop";
};

export function FeatureGrid({ eyebrow, title, subtitle, features, variant = "default" }: FeatureGridProps) {
  const isLoop = variant === "loop";

  return (
    <section className="border-b border-white/[0.04] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
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
        
        <ul className={`mt-10 grid gap-4 ${isLoop ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {features.map((feature, idx) => (
            <li
              key={feature.title}
              className="group relative flex h-full flex-col"
            >
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-zinc-950/45 p-5 shadow-[0_18px_70px_-56px_rgba(124,58,237,0.55)] transition-all duration-300 hover:border-violet-500/25 hover:bg-zinc-950/55">
                <div className="flex flex-col gap-4">
                  <span
                    className={
                      feature.accent === "cyan"
                        ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-950/25 text-cyan-200"
                        : feature.accent === "emerald"
                          ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-950/20 text-emerald-200"
                          : feature.accent === "amber"
                            ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-950/15 text-amber-200"
                            : feature.accent === "fuchsia"
                              ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/25 bg-fuchsia-950/15 text-fuchsia-200"
                              : feature.accent === "sky"
                                ? "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-950/15 text-sky-200"
                                : "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-950/25 text-violet-200"
                    }
                  >
                    <span
                      className={
                        feature.accent === "cyan"
                          ? "pointer-events-none absolute -inset-3 rounded-full bg-cyan-400/16 blur-lg"
                          : feature.accent === "emerald"
                            ? "pointer-events-none absolute -inset-3 rounded-full bg-emerald-400/16 blur-lg"
                            : feature.accent === "amber"
                              ? "pointer-events-none absolute -inset-3 rounded-full bg-amber-400/14 blur-lg"
                              : feature.accent === "fuchsia"
                                ? "pointer-events-none absolute -inset-3 rounded-full bg-fuchsia-400/14 blur-lg"
                                : feature.accent === "sky"
                                  ? "pointer-events-none absolute -inset-3 rounded-full bg-sky-400/14 blur-lg"
                                  : "pointer-events-none absolute -inset-3 rounded-full bg-violet-500/16 blur-lg"
                      }
                      aria-hidden
                    />
                    <span className="relative text-[14px] font-semibold">
                      {feature.icon ?? "✦"}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-100">{feature.title}</h3>
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 group-hover:text-zinc-400">{feature.description}</p>
                  </div>
                </div>
              </div>

              {/* Connector Arrow for Desktop Loop */}
              {isLoop && idx < features.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                  <ChevronRight className="h-5 w-5 text-white/10" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
