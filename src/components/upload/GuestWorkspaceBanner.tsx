"use client";

import Link from "next/link";

type GuestWorkspaceBannerProps = {
  exhausted: boolean;
  className?: string;
  compact?: boolean;
  /** Snapshot pending analysis / auth return before navigating to login. */
  onCreateAccountClick?: () => void;
};

export function GuestWorkspaceBanner({
  exhausted,
  className = "",
  compact = false,
  onCreateAccountClick,
}: GuestWorkspaceBannerProps) {
  const title = exhausted
    ? "Your free guest analysis is used."
    : "You’re using Summify as a guest.";
  const description = exhausted
    ? "Create a free account for 5 analyses per day — and recover your last result after you sign in."
    : compact
      ? "Create a free account for 5 analyses/day and saved history."
      : "Create a free account for 5 analyses per day, saved history, audio lessons, and podcasts.";

  const href = `/login?returnTo=${encodeURIComponent("/upload")}`;

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-950/40 via-zinc-950/60 to-zinc-950 shadow-[0_0_28px_rgba(139,92,246,0.12)] ${
        compact ? "px-3 py-2.5 sm:px-4" : "px-4 py-4 sm:px-5"
      } ${className}`}
      aria-label="Guest workspace banner"
      data-guest-banner
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          {!compact ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/80">
              Guest
            </p>
          ) : null}
          <p
            className={`break-words font-semibold text-white [overflow-wrap:anywhere] ${
              compact ? "text-xs sm:text-sm" : "mt-1 text-sm"
            }`}
          >
            {title}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-300/80">{description}</p>
          ) : (
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{description}</p>
          )}
        </div>
        <Link
          href={href}
          onClick={() => onCreateAccountClick?.()}
          className={`inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/10 font-semibold text-violet-100 transition-colors hover:border-violet-200/35 hover:bg-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-300/35 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          Create free account
        </Link>
      </div>
    </section>
  );
}
