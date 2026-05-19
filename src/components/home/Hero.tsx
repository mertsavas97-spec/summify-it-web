import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.04] px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <Badge variant="accent" className="mb-4">
              Web workspace
            </Badge>
            <h1 className="max-w-xl text-[2rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl sm:leading-[1.12]">
              {siteConfig.tagline}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
              Side-by-side review, Smart Templates, and export-ready output—built
              for long documents on desktop, not a mobile app on a bigger screen.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button href="/upload" size="md">
                Upload a document
              </Button>
              <Button href="/dashboard" variant="secondary" size="md">
                Open workspace
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              UI preview · no processing yet ·{" "}
              <Link href="/upload" className="text-zinc-500 hover:text-zinc-400">
                try the upload flow
              </Link>
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/80 shadow-2xl shadow-black/50 ring-1 ring-white/[0.04]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-950/80 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                <span className="ml-2 text-[10px] text-zinc-500">
                  Summify — Workspace
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                <div className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Source
                  </p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 w-full rounded bg-zinc-700/80" />
                    <div className="h-1.5 w-4/5 rounded bg-zinc-800/80" />
                    <div className="h-1.5 w-full rounded bg-violet-500/30" />
                    <div className="h-1.5 w-3/5 rounded bg-zinc-800/80" />
                  </div>
                </div>
                <div className="bg-violet-950/20 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-violet-300/70">
                    Summary
                  </p>
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] font-medium text-zinc-300">
                      Overview
                    </p>
                    <div className="h-1 w-full rounded bg-zinc-700/60" />
                    <div className="h-1 w-11/12 rounded bg-zinc-700/40" />
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-600 lg:text-left">
              Side-by-side document workspace
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
