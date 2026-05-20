import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductHuntBadge } from "@/components/public/ProductHuntBadge";

type PublicHeroProps = {
  badge?: string;
  title: string;
  description: React.ReactNode;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  /** Homepage only — official Product Hunt featured badge under CTAs. */
  showProductHuntBadge?: boolean;
  children?: React.ReactNode;
};

export function PublicHero({
  badge,
  title,
  description,
  primaryCta = { href: "/upload", label: "Start summarizing" },
  secondaryCta,
  showProductHuntBadge = false,
  children,
}: PublicHeroProps) {
  const headingId = "public-hero-heading";

  return (
    <section
      className="relative overflow-hidden border-b border-white/[0.04] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[100px]" />
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div className="min-w-0">
            {badge && (
              <Badge variant="accent" className="mb-4">
                {badge}
              </Badge>
            )}
            <h1
              id={headingId}
              className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl sm:leading-[1.12]"
            >
              {title}
            </h1>
            <div className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
              {description}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Button href={primaryCta.href} size="md">
                {primaryCta.label}
              </Button>
              {secondaryCta && (
                <Button href={secondaryCta.href} variant="secondary" size="md">
                  {secondaryCta.label}
                </Button>
              )}
            </div>
            {showProductHuntBadge && <ProductHuntBadge />}
          </div>
          {children && (
            <div className="min-w-0 lg:scale-[1.03] lg:origin-center">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}
