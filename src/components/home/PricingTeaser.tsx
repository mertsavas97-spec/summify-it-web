import Link from "next/link";
import { pricingTeaserPlans } from "@/data/pricing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function PricingTeaser() {
  return (
    <Section variant="muted">
      <SectionHeading
        eyebrow="Pricing"
        title="Start free. Scale when you need more."
        description="Annual Pro includes two months free—best for regular document work."
      />

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {pricingTeaserPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-4 ${
              plan.highlighted
                ? "border-violet-500/35 bg-gradient-to-b from-violet-950/40 to-zinc-900/60 ring-1 ring-violet-500/20"
                : "border-white/[0.08] bg-zinc-900/50"
            }`}
          >
            {plan.badge && (
              <Badge variant="accent" className="mb-3">
                {plan.badge}
              </Badge>
            )}
            <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-white">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-xs text-zinc-500">{plan.period}</span>
              )}
            </p>
            {plan.savings && (
              <p className="mt-0.5 text-xs font-medium text-emerald-400/90">
                {plan.savings}
              </p>
            )}
            <p className="mt-2 text-xs text-zinc-500">{plan.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button href="/pricing" variant="secondary" size="md">
          Compare all plans
        </Button>
        <p className="text-xs text-zinc-600">
          <Link href="/pricing" className="text-violet-400/90 hover:text-violet-300">
            Full pricing
          </Link>
          {" · "}no checkout in preview
        </p>
      </div>
    </Section>
  );
}
