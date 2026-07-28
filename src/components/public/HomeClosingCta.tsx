"use client";

import { Button } from "@/components/ui/Button";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

/** Tracked closing CTA for the homepage. */
export function HomeClosingCta() {
  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/12 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-950/40 via-zinc-950/60 to-zinc-950/80 px-6 py-10 text-center shadow-[0_30px_120px_-70px_rgba(124,58,237,0.7)] ring-1 ring-white/[0.05] sm:px-12">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to summarize?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Try Summify free — structured AI summaries for PDFs, decks, videos, and articles. Study
          cards next; audio or podcast when you want them.
        </p>
        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            href="/upload"
            size="lg"
            className="w-full shadow-lg shadow-violet-500/20 sm:w-auto"
            onClick={() =>
              trackProductEventV2Client("landing_cta_clicked", {
                metadata: { placement: "closing_primary", target: "/upload" },
              })
            }
          >
            Summarize for free
          </Button>
          <Button
            href="#how-it-works"
            variant="secondary"
            size="md"
            className="w-full opacity-80 hover:opacity-100 sm:w-auto"
            onClick={() =>
              trackProductEventV2Client("landing_cta_clicked", {
                metadata: { placement: "closing_secondary", target: "#how-it-works" },
              })
            }
          >
            See how it works
          </Button>
        </div>
      </div>
    </section>
  );
}
