import { PricingSection } from "@/components/pricing/PricingSection";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getBillingStatusCopy } from "@/lib/billing/provider";
import { PRICING_BETA_NOTE } from "@/lib/public-copy";
import { pageSeo } from "@/lib/page-metadata";
import { productPricingSchema } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = pageSeo.pricing;

export default function PricingPage() {
  const billing = getBillingStatusCopy();

  return (
    <>
      <JsonLd data={productPricingSchema()} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Plans for every workflow"
        description="Choose the Summify workspace tier that matches your learning and document intelligence workflow."
      />

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-zinc-500">
        {PRICING_BETA_NOTE}
      </p>
      <p className="mx-auto mt-3 max-w-xl rounded-lg border border-violet-500/15 bg-violet-950/15 px-3 py-2 text-center text-xs text-violet-200/90">
        {billing.badge}: <span className="text-violet-100/70">{billing.description}</span>
      </p>

      <PricingSection />
      <ProductDisclaimer className="mx-auto mt-8 max-w-3xl text-center" />

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Provider-neutral", sub: "Paddle or Lemon-ready" },
          { label: "Checkout paused", sub: "until review approval" },
          { label: "Beta access", sub: "current access preserved" },
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
    </>
  );
}
