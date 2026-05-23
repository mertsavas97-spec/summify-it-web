"use client";

import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type {
  PodcastDiscussionAudio,
  PodcastDiscussionScript,
} from "@/lib/podcast/podcast-types";

/** Human-readable labels for podcast density modes. */
function getDensityLabel(mode: string | undefined): string {
  switch (mode) {
    case "quick":
      return "Quick";
    case "deep-dive":
      return "Deep Dive";
    case "critical":
      return "Critical";
    case "debate":
      return "Debate";
    default:
      return "Standard";
  }
}

/**
 * Create a short teaser from transcript text for collapsed preview.
 * - Max 140 characters
 * - Cuts at sentence boundary if possible
 * - Otherwise cuts at word boundary
 * - Appends ellipsis
 */
function getTranscriptPreviewText(text: string): string {
  const maxLength = 140;

  // Clean up text: remove extra whitespace and line breaks
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Try to cut at sentence boundary (period, question mark, exclamation)
  const sentenceEnd = cleaned.slice(0, maxLength).search(/[.!?]\s/);
  if (sentenceEnd > maxLength * 0.5) {
    return cleaned.slice(0, sentenceEnd + 1);
  }

  // Otherwise cut at word boundary
  const lastSpace = cleaned.slice(0, maxLength).lastIndexOf(" ");
  if (lastSpace > maxLength * 0.5) {
    return cleaned.slice(0, lastSpace) + "…";
  }

  // Fallback: hard cut
  return cleaned.slice(0, maxLength) + "…";
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

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

const STORAGE_KEY = "summify_podcast_playback_state";
const SAVED_KEY = "summify_saved_podcasts";
const HISTORY_KEY = "summify_podcast_history";

interface PlaybackState {
  analysisId?: string;
  currentTime: number;
  playbackSpeed: PlaybackSpeed;
  timestamp: number;
}

interface SavedPodcast {
  analysisId: string;
  title: string;
  mode?: string;
  duration: number;
  progress: number;
  currentTime: number;
  createdAt: number;
  lastListened: number;
}

type CinematicPodcastPlayerProps = {
  podcast: PodcastDiscussionScript;
  audio: PodcastDiscussionAudio;
  cached?: boolean;
  regenerating?: boolean;
  onRegenerate: () => void;
  analysisId?: string | null;
};

export function CinematicPodcastPlayer({
  podcast,
  audio,
  cached = false,
  regenerating = false,
  onRegenerate,
  analysisId,
}: CinematicPodcastPlayerProps) {
  const densityLabel = getDensityLabel(podcast.densityMode);
  const densityBadgeClass = getDensityBadgeClass(podcast.densityMode);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const playTracked = useRef(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isMuted, setIsMuted] = useState(false);

  // Active speaker detection
  const [activeSpeaker, setActiveSpeaker] = useState<"host" | "expert" | null>(null);

  // Active chapter
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Mini player
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  // Continue listening prompt
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const continuePromptShown = useRef(false);

  // Save/Unsave state
  const [isSaved, setIsSaved] = useState(false);

  // Calculate turn timing based on word count and speech rate
  const turnTimings = useMemo(() => {
    const timings: { start: number; end: number; speaker: "host" | "expert"; text: string; index: number }[] = [];
    const wordsPerSecond = 145 / 60; // ~2.42 words/sec
    let cumulativeTime = 0;

    podcast.script.forEach((turn, index) => {
      const wordCount = turn.text.trim().split(/\s+/).filter(Boolean).length;
      const turnDuration = wordCount / wordsPerSecond;
      timings.push({
        start: cumulativeTime,
        end: cumulativeTime + turnDuration,
        speaker: turn.speaker,
        text: turn.text,
        index,
      });
      cumulativeTime += turnDuration;
    });

    return timings;
  }, [podcast.script]);

  // Chapter timings (approximate based on outline)
  const chapterTimings = useMemo(() => {
    if (podcast.outline.length === 0) return [];
    const totalDuration = duration || podcast.estimatedDurationMinutes * 60;
    const segmentDuration = totalDuration / podcast.outline.length;

    return podcast.outline.map((chapter, index) => ({
      title: chapter.title,
      summary: chapter.summary,
      startTime: index * segmentDuration,
      endTime: (index + 1) * segmentDuration,
      index,
    }));
  }, [podcast.outline, duration, podcast.estimatedDurationMinutes]);

  // Load persisted playback state (check on mount)
  useEffect(() => {
    if (!analysisId || continuePromptShown.current) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PlaybackState = JSON.parse(saved);
        if (state.analysisId === analysisId && state.currentTime > 10) {
          continuePromptShown.current = true;
          requestAnimationFrame(() => {
            setShowContinuePrompt(true);
            setPlaybackSpeed(state.playbackSpeed);
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [analysisId]);

  // Check if podcast is saved (on mount)
  useEffect(() => {
    if (!analysisId) return;
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) {
        const savedPodcasts: SavedPodcast[] = JSON.parse(saved);
        const isCurrentlySaved = savedPodcasts.some(p => p.analysisId === analysisId);
        if (isCurrentlySaved !== isSaved) {
          requestAnimationFrame(() => setIsSaved(isCurrentlySaved));
        }
      }
    } catch {
      // Ignore
    }
  }, [analysisId, isSaved]);

  // Save playback state periodically
  useEffect(() => {
    if (!analysisId || !audioRef.current) return;

    const interval = setInterval(() => {
      try {
        const state: PlaybackState = {
          analysisId,
          currentTime: audioRef.current?.currentTime ?? 0,
          playbackSpeed,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [analysisId, playbackSpeed]);

  // Refs for callbacks to avoid dependency issues
  const togglePlayRef = useRef<() => void>(() => {});
  const skipRef = useRef<(seconds: number) => void>(() => {});
  const toggleMuteRef = useRef<() => void>(() => {});

  // Audio element event handlers
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    function handlePlay() {
      setIsPlaying(true);
      if (!playTracked.current) {
        playTracked.current = true;
        trackEvent("podcast_audio_played", {
          state: "eligible",
        });
      }
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleTimeUpdate() {
      if (!audioEl) return;
      setCurrentTime(audioEl.currentTime);
      setDuration(audioEl.duration || 0);

      // Update active speaker
      const currentTurn = turnTimings.find(
        (t) => audioEl.currentTime >= t.start && audioEl.currentTime < t.end
      );
      if (currentTurn) {
        setActiveSpeaker(currentTurn.speaker);
      }

      // Update active chapter
      const currentChapter = chapterTimings.find(
        (c) => audioEl.currentTime >= c.startTime && audioEl.currentTime < c.endTime
      );
      if (currentChapter) {
        setActiveChapterIndex(currentChapter.index);
      }
    }

    function handleEnded() {
      setIsPlaying(false);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }

    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, [turnTimings, chapterTimings, podcast.densityMode]);

  // Set playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTogglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSkip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  }, [duration]);

  const handleToggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Update refs
  useEffect(() => {
    togglePlayRef.current = handleTogglePlay;
    skipRef.current = handleSkip;
    toggleMuteRef.current = handleToggleMute;
  }, [handleTogglePlay, handleSkip, handleToggleMute]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayRef.current();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipRef.current(-15);
          break;
        case "ArrowRight":
          e.preventDefault();
          skipRef.current(15);
          break;
        case "j":
        case "J":
          skipRef.current(-15);
          break;
        case "l":
        case "L":
          skipRef.current(15);
          break;
        case "m":
        case "M":
          toggleMuteRef.current();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll handler for mini player
  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const viewportHeight = window.innerHeight;
          setShowMiniPlayer(scrollY > viewportHeight * 0.5);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, time));
    }
  }, [duration]);

  const seekToTurn = useCallback((turnIndex: number) => {
    const turn = turnTimings[turnIndex];
    if (turn) {
      seekTo(turn.start);
    }
  }, [turnTimings, seekTo]);

  const seekToChapter = useCallback((chapterIndex: number) => {
    const chapter = chapterTimings[chapterIndex];
    if (chapter) {
      seekTo(chapter.startTime);
    }
  }, [chapterTimings, seekTo]);

  const continueListening = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PlaybackState = JSON.parse(saved);
        if (state.analysisId === analysisId) {
          seekTo(state.currentTime);
          setTimeout(() => {
            audioRef.current?.play();
          }, 100);
        }
      }
    } catch {
      // Ignore
    }
    setShowContinuePrompt(false);
  }, [analysisId, seekTo]);

  const startFresh = useCallback(() => {
    setShowContinuePrompt(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Update history on playback
  useEffect(() => {
    if (!analysisId || !isPlaying) return;
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      let podcasts: SavedPodcast[] = saved ? JSON.parse(saved) : [];

      // Remove existing entry for this analysis
      podcasts = podcasts.filter(p => p.analysisId !== analysisId);

      // Calculate progress
      const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

      // Add updated entry
      podcasts.unshift({
        analysisId,
        title: podcast.title,
        mode: podcast.densityMode,
        duration: duration || podcast.estimatedDurationMinutes * 60,
        progress: currentProgress,
        currentTime,
        createdAt: Date.now(),
        lastListened: Date.now(),
      });

      // Keep only last 10
      podcasts = podcasts.slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(podcasts));
    } catch {
      // Ignore
    }
  }, [analysisId, isPlaying, podcast, duration, currentTime]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress early to avoid use-before-declare
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Active turn index for auto-scroll
  const activeTurnIndex = useMemo(() => {
    return turnTimings.findIndex(
      (t) => currentTime >= t.start && currentTime < t.end
    );
  }, [turnTimings, currentTime]);

  // Visible turns for transcript (performance optimization)
  const visibleTurns = useMemo(() => {
    const centerIndex = activeTurnIndex;
    if (centerIndex === -1) return turnTimings.slice(0, 20);

    const start = Math.max(0, centerIndex - 3);
    const end = Math.min(turnTimings.length, centerIndex + 8);
    return turnTimings.slice(start, end);
  }, [turnTimings, activeTurnIndex]);

  // Auto-scroll transcript to active turn
  useEffect(() => {
    if (activeTurnIndex === -1 || !transcriptRef.current) return;

    const activeElement = transcriptRef.current.querySelector(
      `[data-turn-index="${activeTurnIndex}"]`
    );
    if (!activeElement) return;

    const container = transcriptRef.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = activeElement.getBoundingClientRect();

    // Check if element is outside visible area
    const isVisible =
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      // Smooth scroll to center the active element
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeTurnIndex]);

  return (
    <>
      {/* Continue Listening Prompt */}
      {showContinuePrompt && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-violet-400/20 bg-violet-950/15 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Headphones className="h-4 w-4 text-violet-300" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">Continue listening?</p>
              <p className="text-[11px] text-zinc-500">
                You were at {formatTime(currentTime)} ({Math.round(progress)}%)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startFresh}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={continueListening}
              className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/30"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Cinematic Player */}
      <section
        className={`mt-4 rounded-xl border bg-gradient-to-b p-4 sm:p-5 transition-all duration-500 ${
          isPlaying
            ? "border-violet-400/40 from-violet-950/30 via-violet-950/10 to-zinc-950/70 shadow-lg shadow-violet-900/10"
            : "border-violet-400/25 from-violet-950/20 to-zinc-950/70"
        }`}
        data-podcast-cinematic-player
      >
        {/* Glow effect when playing */}
        {isPlaying && (
          <div
            className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 70%)",
            }}
          />
        )}

        {/* Header */}
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
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
              {cached && (
                <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  cached
                </span>
              )}
            </div>
            <h3 className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
              {podcast.title}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              ~{podcast.estimatedDurationMinutes} min · {podcast.totalWordCount} words
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

        {/* Active Speaker Indicators */}
        <div className="mt-4 flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${
              activeSpeaker === "host"
                ? "border-violet-400/40 bg-violet-500/15 shadow-sm shadow-violet-500/10"
                : "border-white/[0.06] bg-white/[0.02] opacity-60"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                activeSpeaker === "host"
                  ? "bg-violet-400 animate-pulse"
                  : "bg-zinc-600"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                activeSpeaker === "host" ? "text-violet-200" : "text-zinc-500"
              }`}
            >
              Host
            </span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${
              activeSpeaker === "expert"
                ? "border-indigo-400/40 bg-indigo-500/15 shadow-sm shadow-indigo-500/10"
                : "border-white/[0.06] bg-white/[0.02] opacity-60"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                activeSpeaker === "expert"
                  ? "bg-indigo-400 animate-pulse"
                  : "bg-zinc-600"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                activeSpeaker === "expert" ? "text-indigo-200" : "text-zinc-500"
              }`}
            >
              Expert
            </span>
          </div>
        </div>

        {/* Custom Audio Controls */}
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          {/* Waveform Visualization with Progress Integration */}
          <div className="relative mb-4">
            {/* Progress overlay for waveform */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none z-10"
              style={{
                background: `linear-gradient(to right, rgba(139, 92, 246, 0.08) ${progress}%, transparent ${progress}%)`,
              }}
            />
            {/* Waveform bars */}
            <div className="relative flex items-center justify-center gap-[3px] h-12 w-full max-w-3xl mx-auto">
              {Array.from({ length: 60 }).map((_, i) => {
                const center = 30;
                const distance = Math.abs(i - center);
                const maxBarHeight = Math.max(6, 24 - distance * 0.6);
                const animationDelay = `${i * 0.06}s`;
                const barProgress = (i / 60) * 100;
                const isPlayed = barProgress <= progress;
                return (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all duration-200 ${
                      isPlaying
                        ? isPlayed
                          ? "bg-gradient-to-t from-violet-600/60 to-violet-400 animate-waveform"
                          : "bg-gradient-to-t from-violet-600/20 to-violet-400/40 animate-waveform"
                        : isPlayed
                          ? "bg-violet-500/40"
                          : "bg-white/[0.06]"
                    }`}
                    style={{
                      height: `${maxBarHeight * (isPlaying ? 0.9 : 0.4)}px`,
                      animationDelay,
                      animationDuration: `${0.6 + (i % 4) * 0.12}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Progress Bar with Chapter Markers */}
          <div
            className="relative mb-4 h-1.5 cursor-pointer rounded-full bg-white/[0.06] group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * duration);
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100 shadow-sm shadow-violet-500/20"
              style={{ width: `${progress}%` }}
            />
            {/* Chapter markers */}
            {chapterTimings.length > 1 && chapterTimings.map((chapter, i) => {
              if (i === 0) return null; // Skip first chapter (at 0%)
              const chapterPercent = (chapter.startTime / duration) * 100;
              if (chapterPercent > 98) return null; // Skip if too close to end
              return (
                <div
                  key={chapter.index}
                  className="absolute top-1/2 -mt-1 w-0.5 rounded-full bg-white/30 transition-all duration-200 group-hover:bg-white/50"
                  style={{ left: `${chapterPercent}%`, height: "8px" }}
                  title={chapter.title}
                />
              );
            })}
            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -mt-2 h-4 w-4 rounded-full bg-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 transition-all duration-200 hover:bg-violet-500/30 hover:scale-105"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={() => handleSkip(-15)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-200"
                aria-label="Skip back 15 seconds"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSkip(15)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-200"
                aria-label="Skip forward 15 seconds"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              {/* Mute */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-200"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Time Display */}
            <div className="text-xs font-mono text-zinc-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                    playbackSpeed === speed
                      ? "bg-violet-500/20 text-violet-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden native audio element */}
        <audio
          ref={audioRef}
          className="hidden"
          controls
          preload="metadata"
          src={audio.audioUrl}
          data-podcast-audio
          muted={isMuted}
        >
          Your browser does not support podcast playback.
        </audio>

        {/* Voice Labels */}
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

        {/* Chapters */}
        {chapterTimings.length > 0 && (
          <div className="mt-4">
            <details className="group rounded-lg border border-white/[0.07] bg-zinc-950/55 transition-all duration-300">
              {/* Collapsed Preview */}
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
                    <svg className="h-3.5 w-3.5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    {chapterTimings[activeChapterIndex] && (
                      <>
                        <span className="text-violet-200">
                          {chapterTimings[activeChapterIndex].title}
                        </span>
                        <span className="text-zinc-500">·</span>
                        <span className="font-mono text-zinc-500">
                          {formatTime(chapterTimings[activeChapterIndex].startTime)}
                        </span>
                      </>
                    )}
                    {chapterTimings[activeChapterIndex + 1] && (
                      <>
                        <span className="text-zinc-600">→</span>
                        <span className="text-zinc-500">
                          {chapterTimings[activeChapterIndex + 1].title}
                        </span>
                        <span className="font-mono text-zinc-600">
                          {formatTime(chapterTimings[activeChapterIndex + 1].startTime)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">{chapterTimings.length} chapters</span>
                  <svg className="h-4 w-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              {/* Expanded Content - Cinematic Chapter Cards */}
              <div className="border-t border-white/[0.04] px-2 py-3">
                <ol className="space-y-1.5">
                {chapterTimings.map((chapter) => {
                  const isActive = activeChapterIndex === chapter.index;
                  const isPast = activeChapterIndex > chapter.index;
                  return (
                    <li key={chapter.index}>
                      <button
                        type="button"
                        onClick={() => seekToChapter(chapter.index)}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-violet-500/15 to-violet-500/5 text-violet-100 shadow-sm shadow-violet-500/5"
                            : isPast
                              ? "bg-white/[0.015] text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                              : "bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                        }`}
                      >
                        {/* Progress indicator dot */}
                        <div className={`flex shrink-0 items-center justify-center ${
                          isActive ? "h-5 w-5" : "h-4 w-4"
                        }`}>
                          {isActive ? (
                            <div className="relative">
                              <div className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
                              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-violet-400/30 animate-ping" />
                            </div>
                          ) : isPast ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-500/40" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20 group-hover:bg-white/40" />
                          )}
                        </div>
                        {/* Chapter content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs ${
                              isActive ? "font-semibold" : "font-medium"
                            }`}>
                              {chapter.title}
                            </p>
                          </div>
                          {isActive && chapter.summary && (
                            <p className="mt-1 text-[10px] text-zinc-500 line-clamp-1">
                              {chapter.summary}
                            </p>
                          )}
                        </div>
                        {/* Timestamp */}
                        <span className={`shrink-0 font-mono text-[10px] ${
                          isActive ? "text-violet-300" : "text-zinc-600"
                        }`}>
                          {formatTime(chapter.startTime)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              </div>
            </details>
          </div>
        )}

        {/* Transcript */}
        <div className="mt-4">
          <details className="group rounded-xl border border-white/[0.06] bg-gradient-to-br from-zinc-950/70 to-zinc-950/40 transition-all duration-300">
            {/* Collapsed Preview - Quote Card Style */}
            <summary className="flex cursor-pointer items-start justify-between px-4 py-3 text-xs font-medium text-zinc-200 hover:bg-white/[0.015]">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Icon with active glow */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
                  activeTurnIndex >= 0
                    ? "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 shadow-sm shadow-violet-500/10"
                    : "bg-white/[0.04]"
                }`}>
                  <svg className={`h-4 w-4 transition-colors duration-500 ${
                    activeTurnIndex >= 0 ? "text-violet-300" : "text-zinc-500"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                {/* Quote content */}
                <div className="min-w-0 flex-1">
                  {activeTurnIndex >= 0 && turnTimings[activeTurnIndex] ? (
                    <div className="space-y-1.5">
                      {/* Speaker label */}
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide ${
                        turnTimings[activeTurnIndex].speaker === "host" ? "text-violet-300" : "text-indigo-300"
                      }`}>
                        {turnTimings[activeTurnIndex].speaker}
                      </span>
                      {/* Quote text - max 2 lines, teaser only */}
                      <p className="text-[11px] leading-relaxed text-zinc-400 line-clamp-2">
                        &ldquo;{getTranscriptPreviewText(turnTimings[activeTurnIndex].text)}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
                      <span className="text-zinc-500 text-[11px]">Click play to start</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Right side - count + chevron */}
              <div className="flex shrink-0 items-center gap-2 pl-2">
                <span className="text-[10px] text-zinc-600">{podcast.script.length} turns</span>
                <svg className="h-4 w-4 text-zinc-500 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            {/* Expanded Content */}
            <div className="border-t border-white/[0.04] px-3 py-2">
              <div
                ref={transcriptRef}
                className="max-h-96 overflow-y-auto space-y-1.5 scroll-smooth"
            >
              {visibleTurns.map((turn) => {
                const isActive = turn.index === activeTurnIndex;
                return (
                  <button
                    key={turn.index}
                    type="button"
                    onClick={() => seekToTurn(turn.index)}
                    data-turn-index={turn.index}
                    className={`flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left transition-all duration-300 ${
                      isActive
                        ? turn.speaker === "host"
                          ? "bg-violet-500/15 text-violet-100 shadow-sm shadow-violet-500/10"
                          : "bg-indigo-500/15 text-indigo-100 shadow-sm shadow-indigo-500/10"
                        : "bg-white/[0.025] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className={`mt-0.5 text-[10px] font-semibold uppercase transition-colors ${
                        isActive
                          ? turn.speaker === "host"
                            ? "text-violet-300"
                            : "text-indigo-300"
                          : "text-zinc-600"
                      }`}
                    >
                      {turn.speaker}
                    </span>
                    <p className="flex-1 text-xs leading-relaxed">{turn.text}</p>
                  </button>
                );
              })}
              {turnTimings.length > 20 && (
                <p className="py-2 text-center text-[10px] text-zinc-600">
                  Showing {visibleTurns.length} of {turnTimings.length} turns
                </p>
              )}
              </div>
            </div>
          </details>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-zinc-600">
          <span><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-zinc-500">Space</kbd> Play/Pause</span>
          <span><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-zinc-500">←→</kbd> Skip 15s</span>
          <span><kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-zinc-500">M</kbd> Mute</span>
        </div>
      </section>

      {/* Mini Player (sticky bottom) */}
      {showMiniPlayer && isPlaying && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-violet-400/20 bg-zinc-950/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 transition-colors hover:bg-violet-500/30"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">{podcast.title}</p>
              <div className="mt-1 h-1 rounded-full bg-white/[0.1]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-sm shadow-violet-500/20"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}