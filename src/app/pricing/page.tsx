import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/PricingCards";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PRICING_BETA_NOTE } from "@/lib/public-copy";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Planned Summify.it pricing for public beta. The workspace is free today — Pro Intelligence and checkout are not live yet.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Planned tiers — free during public beta"
        description="Use the workspace at no cost while we ship Pro Intelligence. Prices below are for transparency only."
      />

      <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-relaxed text-zinc-500">
        {PRICING_BETA_NOTE}
      </p>

      <div className="mt-10">
        <PricingCards />
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { label: "No credit card", sub: "required in beta" },
          { label: "No checkout", sub: "billing not enabled" },
          { label: "Four active modes", sub: "in the workspace today" },
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

      <div className="mt-8 rounded-xl border border-white/[0.06] bg-zinc-900/30 px-5 py-5 text-center sm:text-left">
        <h3 className="text-sm font-semibold text-white">
          Batch upload and team seats
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          On the roadmap for Pro Intelligence at launch. Join the public beta in the
          workspace — we will announce paid tiers before any billing goes live.
        </p>
      </div>
    </div>
  );
}
