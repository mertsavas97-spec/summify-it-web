import { PricingPageTracker } from "@/components/analytics/PricingPageTracker";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { PricingSection } from "@/components/pricing/PricingSection";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getOptionalUser } from "@/lib/auth";
import { isEduEmail } from "@/lib/auth/edu-email";
import { getBillingStatusCopy } from "@/lib/billing/provider";
import { PRICING_BETA_NOTE } from "@/lib/public-copy";
import { pageSeo } from "@/lib/page-metadata";
import { pricingPageJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { VoiceStudyPromo } from "@/components/marketing/VoiceStudyPromo";

export const metadata = pageSeo.pricing;

/** Read BILLING_PROVIDER from env on each request (not at static build time). */
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const billing = getBillingStatusCopy();
  const user = await getOptionalUser();
  const scholarCheckoutEligible = isEduEmail(user?.email);

  return (
    <>
      <PricingPageTracker />
      <ProductEventTracker event="pricing_view" />
      <JsonLd data={pricingPageJsonLd()} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Plans for every workflow"
        description="Choose the Summify workspace tier that matches your learning and document intelligence workflow."
      />

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-zinc-500">
        {PRICING_BETA_NOTE}
      </p>

      <PricingSection billing={billing} scholarCheckoutEligible={scholarCheckoutEligible} />

      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-violet-500/15 bg-violet-950/15 px-4 py-3 text-center text-xs leading-relaxed text-violet-200/85 shadow-sm shadow-violet-950/10">
        Polar checkout: Secure checkout powered by Polar. Subscriptions sync to your account automatically.
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <VoiceStudyPromo />
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Audio Study Mode on Pro, Scholar, and Team — teacher-style lessons with natural voice audio.
        </p>
      </div>

      <ProductDisclaimer className="mx-auto mt-8 max-w-3xl text-center" />

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {(billing.provider === "polar" && billing.enabled
          ? [
              { label: "Polar checkout", sub: "Secure subscription billing" },
              { label: "Cancel anytime", sub: "Manage from your account" },
              { label: "Free tier", sub: "Open workspace without a card" },
            ]
          : billing.provider === "none"
            ? [
                { label: "Public beta", sub: "Core access unchanged" },
                { label: "Checkout paused", sub: "Billing coming soon" },
                { label: "No card required", sub: "Try the workspace free" },
              ]
            : [
                { label: "Provider-neutral", sub: "Checkout via billing API" },
                { label: "Secure payments", sub: "Handled by your provider" },
                { label: "Beta access", sub: "current access preserved" },
              ]
        ).map((item) => (
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
