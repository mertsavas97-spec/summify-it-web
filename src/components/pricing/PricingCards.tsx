import { getPricingPlansForInterval } from "@/data/pricingPlans";
import { getPlanCheckoutLabel } from "@/lib/billing/provider";
import type { BillingStatusCopy } from "@/types/billing";
import type { BillingInterval } from "@/types/plan";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type PricingCardsProps = {
  interval: BillingInterval;
  billing: BillingStatusCopy;
};

export function PricingCards({ interval, billing }: PricingCardsProps) {
  const plans = getPricingPlansForInterval(interval);

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      {plans.map((plan) => {
        const isPro = plan.highlighted;

        return (
          <article
            key={`${plan.id}-${interval}`}
            className={`relative flex flex-col rounded-xl border p-5 ${
              isPro
                ? "z-10 border-violet-500/40 bg-gradient-to-b from-violet-950/50 via-zinc-900/90 to-zinc-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)] ring-1 ring-violet-500/25 xl:scale-[1.02]"
                : "border-white/[0.08] bg-zinc-900/50"
            }`}
          >
            {isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-400/30 bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-500/30">
                Recommended
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {plan.badge && <Badge variant={plan.comingSoon ? "muted" : "accent"}>{plan.badge}</Badge>}
              {plan.savings && (
                <span className="text-[11px] font-medium text-emerald-400">{plan.savings}</span>
              )}
            </div>

            <h3 className="mt-3 text-base font-semibold text-white">{plan.name}</h3>

            <p className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-semibold tracking-tight text-white ${
                  isPro ? "text-3xl" : "text-2xl"
                }`}
              >
                {plan.displayPrice}
              </span>
              <span className="text-sm text-zinc-500">{plan.displayPeriod}</span>
            </p>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{plan.tagline}</p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.featureBullets.map((feature) => (
                <li key={feature} className="flex gap-2 text-xs text-zinc-300">
                  <span
                    className={`mt-0.5 shrink-0 ${isPro ? "text-violet-400" : "text-zinc-500"}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.id === "free" ? (
              <Button
                href={plan.ctaHref ?? "/upload"}
                variant={isPro ? "primary" : "secondary"}
                className="mt-6 w-full"
                size="md"
              >
                {plan.cta}
              </Button>
            ) : plan.id === "scholar" || plan.id === "pro" || plan.id === "team" ? (
              <CheckoutButton
                plan={plan.id}
                interval={interval}
                label={getPlanCheckoutLabel(plan.id, billing)}
                variant={isPro ? "primary" : "secondary"}
                className="mt-6"
                billing={billing}
              />
            ) : (
              <Button href="/upload" variant="secondary" className="mt-6 w-full" size="md">
                Open workspace
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
