"use client";

import { useCallback, useRef, useState } from "react";
import { Headphones, Loader2, Mic, Play } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Button } from "@/components/ui/Button";
import type { AudioStudyMetadata } from "@/types/audio-study";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionMetadata,
} from "@/lib/podcast/podcast-types";

type PublicShareAudioLessonProps = {
  shareId: string;
  audioStudy: AudioStudyMetadata;
};

type PublicSharePodcastProps = {
  shareId: string;
  podcast: PodcastDiscussionMetadata;
};

type AudioPlayResponse = {
  success?: boolean;
  audioUrl?: string;
  audioBase64?: string;
  audioMime?: string;
  error?: string;
  message?: string;
};

type PodcastPlayResponse = {
  success?: boolean;
  audio?: PodcastDiscussionAudio;
  error?: string;
  message?: string;
};

const SESSION_AUDIO_PREFIX = "summify.share.play.audio.";
const SESSION_PODCAST_PREFIX = "summify.share.play.podcast.";

function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded (large podcast) — memory cache still works for this tab.
  }
}

function playErrorMessage(status: number, data: { error?: string; message?: string } | null): string {
  if (status === 429) {
    if (data?.error === "play_already_used") {
      return (
        data.message ??
        "Audio was already generated in this browser. Use Play again without refreshing."
      );
    }
    return "Play limit reached for this share. Try again later.";
  }
  return "Audio could not be generated right now.";
}

export function PublicShareAudioLesson({ shareId, audioStudy }: PublicShareAudioLessonProps) {
  const sessionKey = `${SESSION_AUDIO_PREFIX}${shareId}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readSessionJson<{ audioUrl: string }>(sessionKey)?.audioUrl ?? null;
  });
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cacheRef = useRef<string | null>(audioUrl);
  const inFlightRef = useRef(false);

  const play = useCallback(async () => {
    setError(null);
    if (cacheRef.current) {
      setAudioUrl(cacheRef.current);
      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => undefined);
      });
      return;
    }

    if (inFlightRef.current || blocked) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(`/api/share/${encodeURIComponent(shareId)}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "audio" }),
      });
      const data = (await res.json().catch(() => null)) as AudioPlayResponse | null;
      if (!res.ok || !data) {
        if (res.status === 429) setBlocked(true);
        setError(playErrorMessage(res.status, data));
        return;
      }
      const url =
        data.audioUrl ||
        (data.audioBase64
          ? `data:${data.audioMime ?? "audio/mpeg"};base64,${data.audioBase64}`
          : null);
      if (!url) {
        setError("Audio could not be generated right now.");
        return;
      }
      cacheRef.current = url;
      writeSessionJson(sessionKey, { audioUrl: url });
      setAudioUrl(url);
      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => undefined);
      });
    } catch {
      setError("Audio could not be generated right now.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [blocked, sessionKey, shareId]);

  return (
    <div className="min-w-0 space-y-4" data-public-share-audio>
      <div className="rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-950/30 to-zinc-950/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/15 text-sky-200">
            <Headphones className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
              Audio lesson
            </p>
            <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">{audioStudy.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {audioStudy.durationEstimate}
              {audioStudy.voice ? ` · ${audioStudy.voice}` : ""}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                onClick={() => void play()}
                disabled={loading || (blocked && !audioUrl)}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden />
                )}
                {loading ? "Generating audio…" : audioUrl ? "Play again" : "Play audio"}
              </Button>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300/90">{error}</p> : null}
            {audioUrl ? (
              <audio
                ref={audioRef}
                className="mt-4 w-full"
                controls
                src={audioUrl}
                preload="metadata"
              />
            ) : null}
          </div>
        </div>
      </div>

      <CollapsibleSection title="Lesson script" defaultOpen={false}>
        <div className="max-w-prose space-y-3 text-sm leading-relaxed text-zinc-400">
          {audioStudy.sections?.length > 0 ? (
            audioStudy.sections.map((section) => (
              <div key={`${section.title}-${section.text.slice(0, 24)}`}>
                <p className="font-medium text-zinc-300">{section.title}</p>
                <p className="mt-1 whitespace-pre-wrap">{section.text}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{audioStudy.script}</p>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export function PublicSharePodcast({ shareId, podcast }: PublicSharePodcastProps) {
  const sessionKey = `${SESSION_PODCAST_PREFIX}${shareId}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState<PodcastDiscussionAudio | null>(() => {
    if (typeof window === "undefined") return null;
    const cached = readSessionJson<PodcastDiscussionAudio>(sessionKey);
    if (cached?.audioBase64 || cached?.audioUrl) return cached;
    return null;
  });
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cacheRef = useRef<PodcastDiscussionAudio | null>(audio);
  const inFlightRef = useRef(false);

  const play = useCallback(async () => {
    setError(null);
    if (cacheRef.current) {
      setAudio(cacheRef.current);
      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => undefined);
      });
      return;
    }

    if (inFlightRef.current || blocked) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(`/api/share/${encodeURIComponent(shareId)}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "podcast" }),
      });
      const data = (await res.json().catch(() => null)) as PodcastPlayResponse | null;
      if (!res.ok || !data?.audio) {
        if (res.status === 429) setBlocked(true);
        setError(
          res.status === 429
            ? playErrorMessage(res.status, data)
            : "Podcast audio could not be generated right now.",
        );
        return;
      }
      cacheRef.current = data.audio;
      writeSessionJson(sessionKey, data.audio);
      setAudio(data.audio);
      requestAnimationFrame(() => {
        void audioRef.current?.play().catch(() => undefined);
      });
    } catch {
      setError("Podcast audio could not be generated right now.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [blocked, sessionKey, shareId]);

  const src =
    audio?.audioUrl ||
    (audio?.audioBase64
      ? `data:${audio.audioMime ?? "audio/mpeg"};base64,${audio.audioBase64}`
      : undefined);

  return (
    <div className="min-w-0 space-y-4" data-public-share-podcast>
      <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-950/30 to-zinc-950/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-200">
            <Mic className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
              Podcast discussion
            </p>
            <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">{podcast.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              ~{podcast.estimatedDurationMinutes} min
              {podcast.densityMode ? ` · ${podcast.densityMode}` : ""}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                onClick={() => void play()}
                disabled={loading || (blocked && !src)}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden />
                )}
                {loading ? "Generating podcast…" : src ? "Play again" : "Play podcast"}
              </Button>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300/90">{error}</p> : null}
            {src ? (
              <audio ref={audioRef} className="mt-4 w-full" controls src={src} preload="metadata" />
            ) : null}
          </div>
        </div>
      </div>

      <CollapsibleSection title="Discussion script" defaultOpen={false}>
        <ul className="max-w-prose space-y-3">
          {podcast.script.map((turn, index) => (
            <li key={`${turn.speaker}-${index}`} className="text-sm leading-relaxed text-zinc-400">
              <span className="font-medium text-zinc-200">
                {turn.speaker === "host" ? "Host" : "Expert"}
              </span>
              <p className="mt-0.5 whitespace-pre-wrap">{turn.text}</p>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
