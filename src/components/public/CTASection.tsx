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
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/30 to-zinc-950/60 px-6 py-10 text-center sm:px-10">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button href={primaryHref} size="md">
            {primaryLabel}
          </Button>
          {secondaryHref && secondaryLabel && (
            <Button href={secondaryHref} variant="secondary" size="md">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
