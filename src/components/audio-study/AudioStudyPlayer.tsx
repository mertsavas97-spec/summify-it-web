"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PollyVoiceId } from "@/lib/audio-study/pollyVoices";

type AudioStudyPlayerProps = {
  audioUrl?: string;
  audioBase64?: string;
  audioMime?: string;
  title: string;
  durationEstimate: string;
  voiceId: PollyVoiceId;
  onRegenerate: () => void;
  onShowScript: () => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioStudyPlayer({
  audioUrl,
  audioBase64,
  audioMime = "audio/mpeg",
  title,
  durationEstimate,
  voiceId,
  onRegenerate,
  onShowScript,
}: AudioStudyPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);

  const src = audioUrl || (audioBase64 ? `data:${audioMime};base64,${audioBase64}` : undefined);

  // Set up audio event listeners
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleTimeUpdate() {
      if (audioEl) setCurrentTime(audioEl.currentTime);
    }

    function handleLoadedMetadata() {
      if (audioEl) setDuration(audioEl.duration);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
    }

    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audioEl = audioRef.current;
    if (!audioEl || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioEl.currentTime = percent * duration;
  }, [duration]);

  const handleSkip = useCallback((seconds: number) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.currentTime = Math.max(0, Math.min(duration, audioEl.currentTime + seconds));
  }, [duration]);

  const handleToggleMute = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const newVolume = parseFloat(e.target.value);
    audioEl.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSkip(-15);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSkip(15);
          break;
        case "m":
        case "M":
          handleToggleMute();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay, handleSkip, handleToggleMute]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Player card */}
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-zinc-950/40 to-zinc-950/60 p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {title}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">
                {durationEstimate}
              </span>
              <span className="text-[10px] text-zinc-600">·</span>
              <span className="text-[10px] text-zinc-500">
                Voice: {voiceId}
              </span>
            </div>
          </div>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/15">
            <Headphones className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="relative mb-3 h-1.5 cursor-pointer rounded-full bg-zinc-800 overflow-hidden"
          onClick={handleSeek}
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Glow effect at progress head */}
          {isPlaying && (
            <div
              className="absolute top-1/2 -mt-1.5 h-3 w-3 rounded-full bg-violet-400 blur-sm"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Time display */}
          <div className="text-[10px] font-mono text-zinc-500 min-w-[70px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSkip(-15)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label="Skip back 15 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-105 hover:bg-violet-400"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSkip(15)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label="Skip forward 15 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleMute}
              onMouseEnter={() => setShowVolume(true)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <div
              className={`absolute right-full mr-2 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/95 px-2 py-1.5 transition-opacity duration-200 ${
                showVolume ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onMouseLeave={() => setShowVolume(false)}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onShowScript}
          className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
        >
          Show script
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex-1 rounded-lg bg-gradient-to-r from-violet-500/20 to-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition-all hover:from-violet-500/30 hover:to-violet-500/15"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}