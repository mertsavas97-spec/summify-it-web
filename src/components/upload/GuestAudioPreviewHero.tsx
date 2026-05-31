import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type GuestAudioPreviewHeroProps = {
  state: "idle" | "generating" | "ready" | "error" | "timeout" | "fallback";
  previewSrc: string | null;
};

const FALLBACK_TITLE = "Audio preview unavailable right now.";
const FALLBACK_BODY = "Try another document or create a free account to unlock Audio Study Mode.";

export function GuestAudioPreviewHero({ state, previewSrc }: GuestAudioPreviewHeroProps) {
  const playable = Boolean(previewSrc) && state === "ready";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playable) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [playable, previewSrc]);

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        if (audio.currentTime >= (audio.duration || duration)) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const seek = (nextPct: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = Math.max(0, Math.min(100, nextPct));
    const nextTime = (pct / 100) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const formatTime = (value: number) => {
    const safe = Math.max(0, Math.floor(value));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-300/20 bg-gradient-to-br from-sky-500/10 via-[#121826] to-[#0d1320] p-5 shadow-[0_18px_50px_rgba(2,132,199,0.2)] sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="relative min-w-0 space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200/90">Listen Before You Read</p>
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">30-Second Audio Preview</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">Teacher-style explanation generated from this document.</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/15 bg-black/25 p-3.5 sm:p-4">
          {playable ? (
            <div className="space-y-3">
              <audio ref={audioRef} className="sr-only" src={previewSrc ?? undefined} preload="metadata" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-300/30 bg-sky-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100">30 sec preview</span>
                <span className="text-xs text-zinc-300">Teacher-style explanation</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  aria-label={isPlaying ? "Pause preview" : "Play preview"}
                  className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-cyan-300/45 bg-gradient-to-br from-cyan-500/45 to-violet-500/45 text-white shadow-[0_0_30px_rgba(56,189,248,0.35)] transition-transform hover:scale-[1.03]"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="group relative h-10 w-full">
                    <div className="absolute inset-0 flex items-center gap-1 overflow-hidden">
                      {Array.from({ length: 36 }).map((_, idx) => {
                        const active = (idx / 35) * 100 <= progressPct;
                        return (
                          <span
                            key={idx}
                            className={`w-1 flex-1 rounded-full transition-all ${active ? "bg-cyan-300/90" : "bg-white/15"} ${isPlaying && active ? "animate-pulse" : ""}`}
                            style={{ height: `${10 + ((idx * 11) % 18)}px` }}
                          />
                        );
                      })}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progressPct}
                      onChange={(e) => seek(Number(e.target.value))}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Audio preview progress"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-300">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : state === "generating" || state === "idle" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-100">Preparing your 30-second preview…</p>
              <div className="grid grid-cols-12 items-end gap-1.5" aria-hidden>
                {Array.from({ length: 12 }).map((_, idx) => (
                  <span key={idx} className="h-6 rounded-full bg-sky-300/35" style={{ height: `${16 + ((idx * 7) % 24)}px` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-100">{FALLBACK_TITLE}</p>
              <p className="text-sm leading-relaxed text-amber-100/90">{FALLBACK_BODY}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/login?next=/upload"
            className="inline-flex w-full items-center justify-center rounded-xl border border-violet-300/40 bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 sm:w-auto"
          >
            Create Free Account
          </Link>
          <Link
            href="/audio-study"
            className="inline-flex w-full items-center justify-center rounded-xl border border-sky-300/30 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/20 sm:w-auto"
          >
            Continue with full Audio Study Mode →
          </Link>
        </div>
      </div>
    </section>
  );
}