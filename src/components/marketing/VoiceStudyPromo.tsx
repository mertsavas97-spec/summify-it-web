import Link from "next/link";
import { Headphones, Lock } from "lucide-react";
import { AUDIO_STUDY_UPGRADE_HREF } from "@/lib/audio-study/access";

type VoiceStudyPromoProps = {
  /** When true, links to workspace; when false, upgrade teaser. */
  unlocked?: boolean;
  className?: string;
};

/** Lightweight Voice Study CTA — same footprint as LearnByListeningBanner. */
export function VoiceStudyPromo({ unlocked = false, className = "" }: VoiceStudyPromoProps) {
  return (
    <section
      className={`listening-banner-card group relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/25 via-violet-950/10 to-zinc-950/60 px-4 py-3.5 transition-[border-color,box-shadow] duration-300 hover:border-violet-400/35 ${className}`.trim()}
    >
      <div className="listening-banner-sweep pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center self-center">
            <span
              className="listening-banner-icon-glow absolute -inset-2 rounded-full bg-violet-500/25 blur-md"
              aria-hidden
            />
            {unlocked ? (
              <Headphones className="listening-banner-icon-pulse relative z-[1] h-4 w-4 text-violet-300" aria-hidden />
            ) : (
              <Lock className="relative z-[1] h-3.5 w-3.5 text-violet-300/90" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100">Learn by listening</p>
            <p className="text-xs text-zinc-500">
              Teacher-style audio lessons from your analyses.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">
            {unlocked ? "Pro" : "New"}
          </span>
          {unlocked ? (
            <Link
              href="/upload"
              className="listening-banner-cta text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
            >
              Generate from an analysis
              <span className="listening-banner-cta-arrow ml-0.5 inline-block" aria-hidden>
                →
              </span>
            </Link>
          ) : (
            <Link
              href={AUDIO_STUDY_UPGRADE_HREF}
              className="listening-banner-cta text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
            >
              Unlock voice learning
              <span className="listening-banner-cta-arrow ml-0.5 inline-block" aria-hidden>
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
