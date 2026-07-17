"use client";

import { Headphones, Mic } from "lucide-react";

type ListeningExperienceSuggestionsProps = {
  onTryAudio?: () => void;
  onTryPodcast?: () => void;
  showAudio?: boolean;
  showPodcast?: boolean;
};

export function ListeningExperienceSuggestions({
  onTryAudio,
  onTryPodcast,
  showAudio = true,
  showPodcast = true,
}: ListeningExperienceSuggestionsProps) {
  if (!showAudio && !showPodcast) return null;
  if (!onTryAudio && !onTryPodcast) return null;

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-zinc-950/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-listening-suggestions
    >
      <p className="text-xs leading-relaxed text-zinc-500 sm:max-w-md">
        <span className="font-medium text-zinc-400">Prefer listening?</span>
        {" — "}
        turn this summary into an audio lesson or a two-host podcast.
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {showAudio && onTryAudio ? (
          <button
            type="button"
            onClick={onTryAudio}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-400/30 hover:text-violet-100"
          >
            <Headphones className="h-3.5 w-3.5 text-violet-300" aria-hidden />
            Audio lesson
          </button>
        ) : null}
        {showPodcast && onTryPodcast ? (
          <button
            type="button"
            onClick={onTryPodcast}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-400/30 hover:text-violet-100"
          >
            <Mic className="h-3.5 w-3.5 text-violet-300" aria-hidden />
            Podcast
          </button>
        ) : null}
      </div>
    </section>
  );
}
