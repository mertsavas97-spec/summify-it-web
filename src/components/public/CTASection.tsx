import { Button } from "@/components/ui/Button";

type CTASectionProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTASection({
  title,
  description,
  primaryHref = "/upload",
  primaryLabel = "Start summarizing",
  secondaryHref,
  secondaryLabel,
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-950/40 via-zinc-950/60 to-zinc-950/80 px-6 py-10 text-center shadow-[0_30px_120px_-70px_rgba(124,58,237,0.7)] ring-1 ring-white/[0.05] sm:px-12">
        <div className="mx-auto mb-5 grid max-w-[240px] grid-cols-12 gap-1.5 opacity-40" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className={
                i % 6 === 0
                  ? "h-1.5 rounded-full bg-violet-400"
                  : i % 4 === 0
                    ? "h-1.5 rounded-full bg-cyan-300"
                    : "h-1.5 rounded-full bg-white/10"
              }
            />
          ))}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button href={primaryHref} size="lg" className="shadow-lg shadow-violet-500/20">
            {primaryLabel}
          </Button>
          {secondaryHref && secondaryLabel && (
            <Button href={secondaryHref} variant="secondary" size="md" className="opacity-80 hover:opacity-100">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
