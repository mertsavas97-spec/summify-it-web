"use client";

import { Button } from "@/components/ui/Button";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

function trackLandingCta(placement: string, target: string) {
  trackProductEventV2Client("landing_cta_clicked", {
    metadata: { placement, target },
  });
}

/** Homepage hero CTAs. Primary action stays on this page. */
export function HomeHeroActions() {
  return (
    <div className="mt-8 space-y-3 sm:mt-10" data-home-hero-actions>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
        <Button
          href="#home-workspace"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => trackLandingCta("hero_primary", "#home-workspace")}
        >
          Summarize for free
        </Button>
        <Button
          href="#how-it-works"
          variant="secondary"
          size="md"
          className="w-full opacity-90 hover:opacity-100 sm:w-auto"
          onClick={() => trackLandingCta("hero_secondary", "#how-it-works")}
        >
          See how it works
        </Button>
      </div>

      <p className="text-center text-[12px] leading-relaxed text-zinc-500 sm:text-left">
        Start here. The finished summary opens in your workspace, with study cards, audio, or a
        podcast from the same result.
      </p>
    </div>
  );
}
