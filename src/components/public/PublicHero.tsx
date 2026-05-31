import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductHuntBadge } from "@/components/public/ProductHuntBadge";

type PublicHeroProps = {
  badge?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  /** Visual density + hierarchy. Use "home" for the homepage only. */
  variant?: "default" | "home";
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
  variant = "default",
  showProductHuntBadge = false,
  children,
}: PublicHeroProps) {
  const headingId = "public-hero-heading";
  const isHome = variant === "home";

  return (
    <section
      className={
        isHome
          ? "relative overflow-hidden border-b border-white/[0.04] px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8"
          : "relative overflow-hidden border-b border-white/[0.04] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      }
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div
          className={
            isHome
              ? "absolute left-1/2 top-0 h-[360px] w-[680px] -translate-x-1/2 rounded-full bg-violet-600/14 blur-[110px]"
              : "absolute left-1/2 top-0 h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[100px]"
          }
        />
      </div>
      <div className="mx-auto max-w-6xl">
        <div
          className={
            isHome
              ? "grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
              : "grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14"
          }
        >
          <div className="min-w-0">
            {badge && (
              <Badge variant="accent" className="mb-4">
                {badge}
              </Badge>
            )}
            <h1
              id={headingId}
              className={
                isHome
                  ? "max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl"
                  : "max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl sm:leading-[1.12]"
              }
            >
              {title}
            </h1>
            <div
              className={
                isHome
                  ? "mt-3 max-w-2xl text-base leading-relaxed text-zinc-400"
                  : "mt-4 max-w-xl text-base leading-relaxed text-zinc-400"
              }
            >
              {description}
            </div>
            <div
              className={
                isHome
                  ? "mt-10 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
                  : "mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
              }
            >
              <Button href={primaryCta.href} size={isHome ? "lg" : "md"}>
                {primaryCta.label}
              </Button>
              {secondaryCta && (
                <Button
                  href={secondaryCta.href}
                  variant="secondary"
                  size={isHome ? "md" : "md"}
                  className={isHome ? "opacity-90 hover:opacity-100" : undefined}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
            {showProductHuntBadge && <ProductHuntBadge />}
          </div>
          {children && (
            <div
              className={
                isHome
                  ? "min-w-0 lg:scale-[1.06] lg:origin-center"
                  : "min-w-0 lg:scale-[1.03] lg:origin-center"
              }
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
