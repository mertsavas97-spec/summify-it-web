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
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-950/45 via-zinc-950/60 to-zinc-950/75 px-6 py-12 text-center shadow-[0_30px_120px_-70px_rgba(124,58,237,0.85)] ring-1 ring-white/[0.06] sm:px-12">
        <div className="mx-auto mb-6 grid max-w-lg grid-cols-9 gap-2 opacity-70" aria-hidden>
          {Array.from({ length: 27 }).map((_, i) => (
            <span
              key={i}
              className={
                i % 7 === 0
                  ? "h-2 rounded-full bg-violet-400/25"
                  : i % 5 === 0
                    ? "h-2 rounded-full bg-cyan-300/20"
                    : "h-2 rounded-full bg-white/5"
              }
            />
          ))}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href={primaryHref} size="lg">
            {primaryLabel}
          </Button>
          {secondaryHref && secondaryLabel && (
            <Button href={secondaryHref} variant="secondary" size="md" className="opacity-90 hover:opacity-100">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
