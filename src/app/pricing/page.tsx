import { PricingSection } from "@/components/pricing/PricingSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PRICING_BETA_NOTE } from "@/lib/public-copy";
import { pageSeo } from "@/lib/page-metadata";

export const metadata = pageSeo.pricing;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Plans for every workflow"
        description="Public beta pricing preview — the workspace stays free for current users. Paid tiers and checkout are coming soon."
      />

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-zinc-500">
        {PRICING_BETA_NOTE}
      </p>

      <PricingSection />

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { label: "No credit card", sub: "required in beta" },
          { label: "No checkout", sub: "Stripe not connected" },
          { label: "Beta accounts", sub: "keep full access" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.05] bg-zinc-900/40 px-4 py-3 text-center"
          >
            <p className="text-xs font-medium text-zinc-300">{item.label}</p>
            <p className="mt-0.5 text-[10px] text-zinc-600">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
