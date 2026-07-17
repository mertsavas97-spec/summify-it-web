"use client";

import Link from "next/link";

type GuestWorkspaceBannerProps = {
  exhausted: boolean;
  className?: string;
  compact?: boolean;
};

export function GuestWorkspaceBanner({
  exhausted,
  className = "",
  compact = false,
}: GuestWorkspaceBannerProps) {
  const title = exhausted
    ? "Your guest analysis has been used."
    : "You’re using Summify as a guest.";
  const description = exhausted
    ? "Create a free account to continue with 5 summaries per day."
    : compact
      ? "Create a free account for 5 summaries/day and saved history."
      : "Create a free account and unlock 5 summaries per day, Audio Lessons, Podcast Mode, saved history and exports.";

  return (
    <section
      className={`rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-950/40 via-zinc-950/60 to-zinc-950 shadow-[0_0_28px_rgba(139,92,246,0.12)] ${
        compact ? "px-3 py-2.5 sm:px-4" : "px-4 py-4 sm:px-5"
      } ${className}`}
      aria-label="Guest workspace banner"
      data-guest-banner
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          {!compact ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/80">Guest</p>
          ) : null}
          <p className={`font-semibold text-white ${compact ? "text-xs sm:text-sm" : "mt-1 text-sm"}`}>{title}</p>
          {!compact ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-300/80">{description}</p>
          ) : (
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{description}</p>
          )}
        </div>
        <Link
          href={`/login?returnTo=${encodeURIComponent("/upload")}`}
          className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/10 font-semibold text-violet-100 transition-colors hover:border-violet-200/35 hover:bg-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-300/35 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          Create Free Account
        </Link>
      </div>
    </section>
  );
}
