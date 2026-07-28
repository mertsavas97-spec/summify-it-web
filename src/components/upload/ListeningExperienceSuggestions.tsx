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
    <p
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600"
      data-listening-suggestions
    >
      <span className="text-zinc-500">Prefer listening?</span>
      {showAudio && onTryAudio ? (
        <button
          type="button"
          onClick={onTryAudio}
          className="inline-flex items-center gap-1 font-medium text-zinc-400 transition-colors hover:text-violet-200"
        >
          <Headphones className="h-3 w-3" aria-hidden />
          Audio lesson
        </button>
      ) : null}
      {showPodcast && onTryPodcast ? (
        <button
          type="button"
          onClick={onTryPodcast}
          className="inline-flex items-center gap-1 font-medium text-zinc-400 transition-colors hover:text-violet-200"
        >
          <Mic className="h-3 w-3" aria-hidden />
          Podcast
        </button>
      ) : null}
    </p>
  );
}
