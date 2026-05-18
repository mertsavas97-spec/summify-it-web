import { pricingPlans } from "@/data/pricing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PricingCards() {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
      {pricingPlans.map((plan) => {
        const isAnnual = plan.highlighted;

        return (
          <article
            key={plan.id}
            className={`relative flex flex-col rounded-xl border p-5 ${
              isAnnual
                ? "z-10 border-violet-500/40 bg-gradient-to-b from-violet-950/50 via-zinc-900/90 to-zinc-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)] ring-1 ring-violet-500/25 lg:scale-[1.03]"
                : "border-white/[0.08] bg-zinc-900/50"
            }`}
          >
            {isAnnual && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                Planned tier
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {plan.badge && <Badge variant="accent">{plan.badge}</Badge>}
              {plan.savings && (
                <span className="text-[11px] font-medium text-emerald-400">
                  {plan.savings}
                </span>
              )}
            </div>

            <h3 className="mt-3 text-base font-semibold text-white">
              {plan.name}
            </h3>

            <p className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-semibold tracking-tight text-white ${
                  isAnnual ? "text-4xl" : "text-3xl"
                }`}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-zinc-500">{plan.period}</span>
              )}
            </p>

            {isAnnual && (
              <p className="mt-1 text-xs text-zinc-500">
                ~$15.83/mo at launch (illustrative)
              </p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {plan.description}
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-2 text-xs text-zinc-300"
                >
                  <span
                    className={`mt-0.5 shrink-0 ${isAnnual ? "text-violet-400" : "text-zinc-500"}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.comingSoon ? (
              <div className="mt-6 space-y-2">
                <p className="rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2.5 text-center text-xs text-violet-200/90">
                  {plan.cta}
                </p>
                <Button href="/modes" variant="secondary" className="w-full" size="md">
                  Browse intelligence modes
                </Button>
              </div>
            ) : (
              <Button
                href={plan.ctaHref ?? "/upload"}
                variant={isAnnual ? "primary" : "secondary"}
                className="mt-6 w-full"
                size="md"
              >
                {plan.cta}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
