"use client";

import { useRef } from "react";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import type { PodcastDiscussionScript } from "@/lib/podcast/podcast-types";

type PodcastDiscussionPreviewProps = {
  podcast: PodcastDiscussionScript;
  cached?: boolean;
  sourceType?: string | null;
  intelligenceMode?: string | null;
  analysisId?: string | null;
};

export function PodcastDiscussionPreview({
  podcast,
  cached = false,
  sourceType,
  intelligenceMode,
  analysisId,
}: PodcastDiscussionPreviewProps) {
  const openedTracked = useRef(false);

  function trackOpened(open: boolean) {
    if (!open) return;
    if (openedTracked.current) return;
    openedTracked.current = true;
    trackProductEventClient({
      eventType: "podcast_preview_opened",
      sourceType: sourceType ?? "podcast",
      intelligenceMode: intelligenceMode ?? null,
      metadata: {
        analysis_id: analysisId ?? "live-analysis",
        cached,
        duration_minutes: podcast.estimatedDurationMinutes,
        word_count: podcast.totalWordCount,
      },
    });
  }

  return (
    <details
      className="mt-3 rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4 sm:p-5"
      data-podcast-discussion-preview
      onToggle={(event) => trackOpened(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-xs font-medium text-zinc-300">
        Preview script
      </summary>

      <div className="mt-4 border-b border-white/[0.06] pb-4">
        <p className="text-[11px] font-semibold uppercase text-violet-200/80">
          Podcast discussion preview
        </p>
        <h3 className="mt-1 text-base font-semibold leading-snug text-white">
          {podcast.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          {podcast.estimatedDurationMinutes} min estimate · {podcast.totalWordCount} words
          {cached ? " · cached script" : ""}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <p className="text-xs font-medium text-zinc-300">Outline</p>
          <ol className="mt-2 space-y-2">
            {podcast.outline.slice(0, 6).map((item) => (
              <li key={`${item.title}:${item.summary}`} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                  {item.summary}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-300">Opening exchanges</p>
          <div className="mt-2 space-y-2">
            {podcast.script.slice(0, 6).map((turn, index) => (
              <div
                key={`${turn.speaker}:${index}`}
                className="rounded-lg border border-white/[0.06] bg-zinc-900/45 px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase text-violet-200/75">
                  {turn.speaker === "host" ? "Host" : "Expert"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{turn.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </details>
  );
}
