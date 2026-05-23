"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionScript,
} from "@/lib/podcast/podcast-types";

/** Human-readable labels for podcast density modes. */
function getDensityLabel(mode: string | undefined): string {
  switch (mode) {
    case "quick":
      return "Quick Discussion";
    case "deep-dive":
      return "Deep Dive";
    case "critical":
      return "Critical Analysis";
    case "debate":
      return "Debate Mode";
    default:
      return "Discussion";
  }
}

/** Badge color for density modes. */
function getDensityBadgeClass(mode: string | undefined): string {
  switch (mode) {
    case "quick":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "deep-dive":
      return "border-violet-400/20 bg-violet-500/10 text-violet-200";
    case "critical":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "debate":
      return "border-rose-400/20 bg-rose-500/10 text-rose-200";
    default:
      return "border-violet-400/20 bg-violet-500/10 text-violet-200";
  }
}

type PodcastPlayerProps = {
  podcast: PodcastDiscussionScript;
  audio: PodcastDiscussionAudio;
  cached?: boolean;
  regenerating?: boolean;
  onRegenerate: () => void;
};

export function PodcastPlayer({
  podcast,
  audio,
  cached = false,
  regenerating = false,
  onRegenerate,
}: PodcastPlayerProps) {
  const densityLabel = getDensityLabel(podcast.densityMode);
  const densityBadgeClass = getDensityBadgeClass(podcast.densityMode);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTracked = useRef(false);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    function handlePlay() {
      if (playTracked.current) return;
      playTracked.current = true;
      trackEvent("podcast_audio_played", {
        state: "eligible",
      });
    }

    audioEl.addEventListener("play", handlePlay);
    return () => {
      audioEl.removeEventListener("play", handlePlay);
    };
  }, []);
  return (
    <section
      className="mt-4 rounded-xl border border-violet-400/25 bg-gradient-to-b from-violet-950/20 to-zinc-950/70 p-4 sm:p-5"
      data-podcast-player
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase text-violet-200/80">
              Podcast discussion
            </p>
            {podcast.densityMode && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${densityBadgeClass}`}
              >
                {densityLabel}
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
            {podcast.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            ~{podcast.estimatedDurationMinutes} min · {podcast.totalWordCount} words
            {cached ? " · cached" : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={regenerating}
          onClick={onRegenerate}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-violet-400/25 hover:text-violet-100 disabled:opacity-60"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} aria-hidden />
          {regenerating ? "Regenerating" : "Regenerate"}
        </button>
      </div>

      <audio
        ref={audioRef}
        className="mt-4 w-full"
        controls
        preload="metadata"
        src={audio.audioUrl}
        data-podcast-audio
      >
        Your browser does not support podcast playback.
      </audio>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="Podcast voices">
        {audio.voices.map((voice) => (
          <span
            key={voice.speaker}
            className="rounded-md border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[11px] text-zinc-400"
          >
            <span className="font-medium text-zinc-200">{voice.name}</span> · {voice.voiceId}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <details className="rounded-lg border border-white/[0.07] bg-zinc-950/55 px-3 py-2.5">
          <summary className="cursor-pointer text-xs font-medium text-zinc-200">
            Show outline
          </summary>
          <ol className="mt-3 space-y-2">
            {podcast.outline.map((item) => (
              <li key={`${item.title}:${item.summary}`} className="rounded-md bg-white/[0.025] px-2.5 py-2">
                <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                  {item.summary}
                </p>
              </li>
            ))}
          </ol>
        </details>

        <details className="rounded-lg border border-white/[0.07] bg-zinc-950/55 px-3 py-2.5">
          <summary className="cursor-pointer text-xs font-medium text-zinc-200">
            Show script
          </summary>
          <div className="mt-3 space-y-2">
            {podcast.script.map((turn, index) => (
              <div key={`${turn.speaker}:${index}`} className="rounded-md bg-white/[0.025] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase text-violet-200/75">
                  {turn.speaker === "host" ? "Host" : "Expert"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{turn.text}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
