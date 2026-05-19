"use client";

import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/events";

type CtaStripProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** When set, primary CTA fires `guide_cta_clicked` with this surface id. */
  analyticsSurface?: string;
};

export function CtaStrip({
  title,
  description,
  primaryHref = "/upload",
  primaryLabel = "Try Summify free",
  secondaryHref = "/pricing",
  secondaryLabel = "View plans",
  analyticsSurface,
}: CtaStripProps) {
  function onPrimaryClick() {
    if (!analyticsSurface) return;
    trackEvent("guide_cta_clicked", {
      surface: analyticsSurface,
      href: primaryHref,
      label: primaryLabel,
    });
  }

  return (
    <section className="border-b border-white/[0.04] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 to-zinc-950/80 px-6 py-8 text-center sm:px-8">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href={primaryHref} size="sm" onClick={onPrimaryClick}>
            {primaryLabel}
          </Button>
          {secondaryHref ? (
            <Button href={secondaryHref} variant="secondary" size="sm">
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
