"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

function trackLandingCta(placement: string, target: string) {
  trackProductEventV2Client("landing_cta_clicked", {
    metadata: { placement, target },
  });
}

/**
 * Homepage hero CTAs. One primary path to /upload; light text shortcuts
 * for audio/podcast intent (same workspace, after summary).
 */
export function HomeHeroActions() {
  return (
    <div className="mt-8 space-y-3 sm:mt-10" data-home-hero-actions>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
        <Button
          href="/upload"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => trackLandingCta("hero_primary", "/upload")}
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
        Same workspace after you upload —{" "}
        <Link
          href="/upload?intent=audio"
          className="font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline"
          onClick={() => trackLandingCta("hero_intent_audio", "/upload?intent=audio")}
        >
          Audio lesson
        </Link>
        <span className="text-zinc-600"> · </span>
        <Link
          href="/upload?intent=podcast"
          className="font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline"
          onClick={() => trackLandingCta("hero_intent_podcast", "/upload?intent=podcast")}
        >
          Podcast
        </Link>
      </p>
    </div>
  );
}
