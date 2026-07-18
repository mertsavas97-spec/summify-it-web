"use client";

import Link from "next/link";
import { Headphones, Mic } from "lucide-react";
import { saveAuthReturnTo } from "@/lib/auth/return-to";
import { useWorkspaceEntitlement } from "@/hooks/useWorkspaceEntitlement";

type ShareListeningUpsellProps = {
  hasAudio: boolean;
  hasPodcast: boolean;
};

function destinationHref(intent: "audio" | "podcast", isAuthenticated: boolean): string {
  const upload = `/upload?intent=${intent}`;
  if (isAuthenticated) return upload;
  return `/login?returnTo=${encodeURIComponent(upload)}`;
}

export function ShareListeningUpsell({ hasAudio, hasPodcast }: ShareListeningUpsellProps) {
  const { isAuthenticated } = useWorkspaceEntitlement();

  if (hasAudio && hasPodcast) return null;

  function handleClick(intent: "audio" | "podcast") {
    if (!isAuthenticated) {
      saveAuthReturnTo(`/upload?intent=${intent}`);
    }
  }

  return (
    <aside
      className="print-hide rounded-xl border border-white/[0.08] bg-zinc-950/50 p-4 sm:p-5"
      data-share-listening-upsell
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
        Listen next
      </p>
      <h2 className="mt-1.5 text-sm font-semibold text-white sm:text-base">
        {isAuthenticated
          ? "Generate Audio or Podcast from your own source"
          : "Generate Audio or Podcast — free account, one click"}
      </h2>
      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
        {isAuthenticated
          ? "Open upload with Audio or Podcast selected and run the same listening formats on your document."
          : "Sign up or log in — we’ll take you straight to upload with Audio or Podcast ready. Your next analysis stays with you."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!hasAudio ? (
          <Link
            href={destinationHref("audio", isAuthenticated)}
            onClick={() => handleClick("audio")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/15 px-3.5 py-2.5 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/25 sm:text-sm"
          >
            <Headphones className="h-3.5 w-3.5" aria-hidden />
            Generate Audio lesson
          </Link>
        ) : null}
        {!hasPodcast ? (
          <Link
            href={destinationHref("podcast", isAuthenticated)}
            onClick={() => handleClick("podcast")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/15 px-3.5 py-2.5 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/25 sm:text-sm"
          >
            <Mic className="h-3.5 w-3.5" aria-hidden />
            Generate Podcast
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
