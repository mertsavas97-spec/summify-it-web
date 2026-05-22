"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Headphones,
  Lock,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AUDIO_STUDY_UPGRADE_HREF,
  canUseAudioStudyMode,
  getAudioStudyScriptLimits,
} from "@/lib/audio-study/access";
import {
  clearAllAudioStudyCaches,
  loadAudioStudyCache,
  saveAudioStudyCache,
  type AudioStudyPlaybackMode,
  type ClientAudioStudyCache,
} from "@/lib/audio-study/clientCache";
import {
  DEFAULT_POLLY_VOICE_ID,
  POLLY_VOICE_PRESETS,
  normalizePollyVoiceId,
  type PollyVoiceId,
} from "@/lib/audio-study/pollyVoices";
import {
  cancelSpeech,
  createLessonUtterance,
  isSpeechPaused,
  isSpeechSynthesisSupported,
  loadSpeechVoices,
  pauseSpeech,
  pickPreferredEnglishVoice,
  resumeSpeech,
} from "@/lib/audio-study/speechSynthesisPlayer";
import {
  isAwsPollyProvider,
  type AudioStudyProvider,
} from "@/lib/audio-study/provider";
import { trackProductEventClient } from "@/lib/analytics/trackProductEventClient";
import type { AudioStudyAnalysisInput, AudioStudyMetadata } from "@/types/audio-study";
import type { PlanId } from "@/types/plan";

const SEEK_SECONDS = 15;

type CardState =
  | "locked"
  | "idle"
  | "generating"
  | "ready"
  | "playing"
  | "paused"
  | "speaking"
  | "completed"
  | "error";

type GenerateResponse = {
  title: string;
  durationEstimate: string;
  script: string;
  sections: AudioStudyMetadata["sections"];
  cached?: boolean;
  voiceId?: string;
  playback?: AudioStudyPlaybackMode;
  provider?: AudioStudyProvider;
  fallback?: boolean;
  audioUrl?: string;
  audioBase64?: string;
  audioMime?: string;
  error?: string;
};

type AudioStudyCardProps = {
  analysisId: string;
  entitlementPlanId: PlanId;
  isPaidActive: boolean;
  analysisInput: AudioStudyAnalysisInput;
  cachedScript?: AudioStudyMetadata | null;
  variant?: "full" | "compact";
  className?: string;
};

function toMetadata(
  data: GenerateResponse,
  voiceId: PollyVoiceId,
  generatedAt: string,
): AudioStudyMetadata {
  return {
    title: data.title,
    durationEstimate: data.durationEstimate,
    script: data.script,
    sections: data.sections,
    voice: voiceId,
    generatedAt,
  };
}

function resolveAudioSrcFromEntry(entry: {
  audioUrl?: string;
  audioBase64?: string;
  audioMime?: string;
}): string | null {
  if (entry.audioUrl) return entry.audioUrl;
  if (!entry.audioBase64) return null;
  const mime = entry.audioMime ?? "audio/mpeg";
  return `data:${mime};base64,${entry.audioBase64}`;
}

function buildCacheEntry(
  data: GenerateResponse,
  voiceId: PollyVoiceId,
  generatedAt: string,
): ClientAudioStudyCache {
  const usePolly =
    isAwsPollyProvider(data.provider, data.fallback) &&
    Boolean(data.audioUrl || data.audioBase64);
  return {
    lesson: toMetadata(data, voiceId, generatedAt),
    voiceId,
    playback: usePolly ? "polly" : "browser",
    provider: data.provider,
    fallback: data.fallback,
    audioUrl: data.audioUrl,
    audioBase64: data.audioBase64,
    audioMime: data.audioMime ?? "audio/mpeg",
  };
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioStudyCard({
  analysisId,
  entitlementPlanId,
  isPaidActive,
  analysisInput,
  cachedScript,
  variant = "full",
  className = "",
}: AudioStudyCardProps) {
  const paidAccess = canUseAudioStudyMode(entitlementPlanId, isPaidActive);
  const limits = getAudioStudyScriptLimits(
    paidAccess ? entitlementPlanId : "pro",
  );
  const speechSupported = isSpeechSynthesisSupported();

  const [selectedVoiceId, setSelectedVoiceId] =
    useState<PollyVoiceId>(DEFAULT_POLLY_VOICE_ID);

  const initialCache =
    loadAudioStudyCache(analysisId, selectedVoiceId) ??
    (cachedScript
      ? ({
          lesson: {
            ...cachedScript,
            voice: normalizePollyVoiceId(cachedScript.voice),
          },
          voiceId: normalizePollyVoiceId(cachedScript.voice),
          playback: "browser" as const,
        } satisfies ClientAudioStudyCache)
      : null);

  const [state, setState] = useState<CardState>(() => {
    if (!paidAccess) return "locked";
    if (initialCache?.lesson?.script) return "ready";
    return "idle";
  });
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<AudioStudyMetadata | null>(
    initialCache?.lesson ?? null,
  );
  const [playbackMode, setPlaybackMode] = useState<AudioStudyPlaybackMode>(
    initialCache?.playback ?? "polly",
  );
  const [audioProvider, setAudioProvider] = useState<AudioStudyProvider | null>(
    initialCache?.provider ?? null,
  );
  const [audioSrc, setAudioSrc] = useState<string | null>(() =>
    initialCache ? resolveAudioSrcFromEntry(initialCache) : null,
  );
  const [showScript, setShowScript] = useState(false);
  const [browserVoiceName, setBrowserVoiceName] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playedTracked = useRef(false);
  const completedTracked = useRef(false);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const applyAudioFromCache = useCallback(
    (entry: ClientAudioStudyCache) => {
      revokeObjectUrl();
      const usePolly =
        isAwsPollyProvider(entry.provider, entry.fallback) ||
        (entry.playback === "polly" &&
          Boolean(entry.audioUrl || entry.audioBase64) &&
          entry.fallback !== true);

      setAudioProvider(entry.provider ?? (usePolly ? "aws-polly" : "browser"));

      if (usePolly) {
        const src = resolveAudioSrcFromEntry(entry);
        if (src?.startsWith("blob:")) objectUrlRef.current = src;
        setAudioSrc(src);
        setPlaybackMode("polly");
      } else {
        setAudioSrc(null);
        setPlaybackMode("browser");
      }
    },
    [revokeObjectUrl],
  );

  useEffect(() => {
    if (!speechSupported) return;
    void loadSpeechVoices().then((voices) => {
      const picked = pickPreferredEnglishVoice(voices);
      preferredVoiceRef.current = picked;
      if (picked) setBrowserVoiceName(picked.name);
    });
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  const generateLesson = useCallback(
    async (options?: {
      regenerate?: boolean;
      synthesizeOnly?: boolean;
      voiceId?: PollyVoiceId;
    }) => {
      if (!paidAccess) return;
      const voice = options?.voiceId ?? selectedVoiceId;
      setState("generating");
      setError(null);
      cancelSpeech();
      audioRef.current?.pause();

      try {
        const res = await fetch("/api/audio-study/generate", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisId,
            analysisPayload: analysisInput,
            regenerate: options?.regenerate,
            synthesizeOnly: options?.synthesizeOnly,
            voiceId: voice,
            ...(options?.synthesizeOnly && lesson
              ? {
                  script: lesson.script,
                  title: lesson.title,
                  durationEstimate: lesson.durationEstimate,
                  sections: lesson.sections,
                }
              : {}),
          }),
        });

        const data = (await res.json()) as GenerateResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? "Lesson could not be generated right now.");
        }

        if (!data.script || !data.sections) {
          throw new Error("Lesson could not be generated right now.");
        }

        const resolvedVoice = normalizePollyVoiceId(data.voiceId ?? voice);
        const generatedAt = new Date().toISOString();
        const entry = buildCacheEntry(data, resolvedVoice, generatedAt);

        setLesson(entry.lesson);
        applyAudioFromCache(entry);
        if (options?.voiceId) setSelectedVoiceId(resolvedVoice);
        saveAudioStudyCache(analysisId, entry);
        setState("ready");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Lesson could not be generated right now. Please try again.",
        );
        setState("error");
      }
    },
    [paidAccess, analysisId, analysisInput, selectedVoiceId, lesson, applyAudioFromCache],
  );

  const trackPlayed = useCallback(
    (playback: string) => {
      if (playedTracked.current) return;
      playedTracked.current = true;
      trackProductEventClient({
        eventType: "audio_study_played",
        sourceType: analysisInput.sourceType ?? "audio_study",
        intelligenceMode: analysisInput.intelligenceMode ?? null,
        metadata: {
          analysis_id: analysisId,
          plan: entitlementPlanId,
          playback,
          voice_id: selectedVoiceId,
        },
      });
    },
    [analysisId, analysisInput, entitlementPlanId, selectedVoiceId],
  );

  const trackCompleted = useCallback(() => {
    if (completedTracked.current) return;
    completedTracked.current = true;
    trackProductEventClient({
      eventType: "audio_study_completed",
      sourceType: analysisInput.sourceType ?? "audio_study",
      intelligenceMode: analysisInput.intelligenceMode ?? null,
      metadata: {
        analysis_id: analysisId,
        plan: entitlementPlanId,
        voice_id: selectedVoiceId,
        playback: playbackMode,
      },
    });
  }, [analysisId, analysisInput, entitlementPlanId, selectedVoiceId, playbackMode]);

  const startPollyPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    try {
      await audio.play();
      setState("playing");
      trackPlayed("polly_mp3");
    } catch {
      setError("Playback could not start. Try again.");
      setState("error");
    }
  }, [audioSrc, trackPlayed]);

  const startBrowserSpeaking = useCallback(async () => {
    if (!lesson?.script || !speechSupported) return;

    cancelSpeech();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    const voices = await loadSpeechVoices();
    const voice = pickPreferredEnglishVoice(voices) ?? preferredVoiceRef.current;
    preferredVoiceRef.current = voice;
    if (voice) setBrowserVoiceName(voice.name);

    const utterance = createLessonUtterance(lesson.script, voice);
    utterance.onstart = () => {
      setState("speaking");
      trackPlayed("browser_speech_synthesis");
    };
    utterance.onend = () => {
      setState("completed");
      trackCompleted();
    };
    utterance.onerror = () => {
      setError("Playback stopped unexpectedly. Try again.");
      setState("error");
    };

    window.speechSynthesis.speak(utterance);
  }, [lesson, speechSupported, trackPlayed, trackCompleted]);

  const handlePlay = useCallback(() => {
    if (playbackMode === "polly" && audioSrc) {
      void startPollyPlayback();
      return;
    }
    void startBrowserSpeaking();
  }, [playbackMode, audioSrc, startPollyPlayback, startBrowserSpeaking]);

  const handlePause = useCallback(() => {
    if (playbackMode === "polly") {
      audioRef.current?.pause();
      setState("paused");
      return;
    }
    if (!isSpeechSynthesisSupported()) return;
    pauseSpeech();
    if (isSpeechPaused()) setState("paused");
  }, [playbackMode]);

  const handleResume = useCallback(() => {
    if (playbackMode === "polly") {
      void startPollyPlayback();
      return;
    }
    if (!isSpeechSynthesisSupported()) return;
    resumeSpeech();
    setState("speaking");
  }, [playbackMode, startPollyPlayback]);

  const handleStop = useCallback(() => {
    if (playbackMode === "polly") {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setCurrentTime(0);
    } else {
      cancelSpeech();
    }
    setState(lesson ? "ready" : "idle");
  }, [lesson, playbackMode]);

  const handleSeek = useCallback(
    (deltaSeconds: number) => {
      if (playbackMode !== "polly") return;
      const audio = audioRef.current;
      if (!audio) return;
      const next = Math.min(
        Math.max(0, audio.currentTime + deltaSeconds),
        Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + deltaSeconds,
      );
      audio.currentTime = next;
      setCurrentTime(next);
    },
    [playbackMode],
  );

  const handleVoiceChange = useCallback(
    (voiceId: PollyVoiceId) => {
      if (voiceId === selectedVoiceId) return;
      cancelSpeech();
      audioRef.current?.pause();
      playedTracked.current = false;
      completedTracked.current = false;
      setSelectedVoiceId(voiceId);

      const cached = loadAudioStudyCache(analysisId, voiceId);
      if (cached?.lesson?.script) {
        setLesson(cached.lesson);
        applyAudioFromCache(cached);
        setPlaybackMode(cached.playback);
        setState("ready");
        return;
      }

      if (lesson?.script) {
        void generateLesson({ synthesizeOnly: true, voiceId });
      }
    },
    [selectedVoiceId, lesson, generateLesson, analysisId, applyAudioFromCache],
  );

  const handleRegenerate = useCallback(() => {
    clearAllAudioStudyCaches(analysisId);
    playedTracked.current = false;
    completedTracked.current = false;
    revokeObjectUrl();
    setAudioSrc(null);
    void generateLesson({ regenerate: true });
  }, [analysisId, generateLesson, revokeObjectUrl]);

  const voiceLabel = useMemo(() => {
    if (playbackMode === "polly") {
      return POLLY_VOICE_PRESETS.find((v) => v.id === selectedVoiceId)?.label ?? selectedVoiceId;
    }
    return browserVoiceName ?? "Browser voice";
  }, [playbackMode, selectedVoiceId, browserVoiceName]);

  const canPlay =
    playbackMode === "polly" ? Boolean(audioSrc) : speechSupported;

  const wrapperClass = useMemo(() => {
    const base =
      variant === "compact"
        ? "rounded-xl border border-white/[0.08] bg-zinc-950/50 p-4"
        : "rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/25 via-zinc-950/80 to-zinc-950/95 p-5 sm:p-6";
    return `${base} ${className}`.trim();
  }, [variant, className]);

  if (state === "locked") {
    return (
      <section className={wrapperClass} data-audio-study="locked">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-500/25 bg-violet-950/40 text-violet-200">
            <Lock className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
              Audio Study Mode
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">
              Explain this like a teacher
            </h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Listen to this analysis as a short teacher-style lesson.
            </p>
            <p className="mt-2 text-[11px] text-zinc-500">Available on Pro</p>
            <Button href={AUDIO_STUDY_UPGRADE_HREF} size="sm" className="mt-4">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={wrapperClass} data-audio-study={state}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-500/25 bg-violet-950/40 text-violet-200">
          <Headphones className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            Audio Study Mode
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white sm:text-base">
            {variant === "compact"
              ? "Prefer listening?"
              : "Explain this like a teacher"}
          </h3>
          <p className="mt-1.5 text-sm text-zinc-400">
            {variant === "compact"
              ? "Generate a teacher-style lesson with natural voice audio."
              : "Turn this analysis into a short teacher-style explanation you can listen to."}
          </p>
          {state === "idle" && (
            <p className="mt-1 text-[11px] text-zinc-500">
              Expect about {limits.durationLabel} · {limits.minWords}–{limits.maxWords} words
            </p>
          )}
          {playbackMode === "browser" && !speechSupported && (
            <p className="mt-2 text-[11px] text-amber-300/80">
              Audio playback is not supported on this device.
            </p>
          )}
          {playbackMode === "browser" &&
            audioProvider !== "aws-polly" &&
            speechSupported &&
            lesson && (
              <p className="mt-2 text-[11px] text-amber-300/70">
                Using browser voice (server audio unavailable).
              </p>
            )}
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor={`audio-study-voice-${analysisId}`}
          className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
        >
          Voice
        </label>
        <select
          id={`audio-study-voice-${analysisId}`}
          value={selectedVoiceId}
          disabled={state === "generating"}
          onChange={(e) => handleVoiceChange(normalizePollyVoiceId(e.target.value))}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
        >
          {POLLY_VOICE_PRESETS.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.label} — {voice.description}
            </option>
          ))}
        </select>
      </div>

      {state === "idle" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void generateLesson()}>
            Generate lesson
          </Button>
        </div>
      )}

      {state === "generating" && (
        <p className="mt-5 flex items-center gap-2 text-sm text-violet-200/90">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Creating your teacher-style lesson…
        </p>
      )}

      {state === "error" && (
        <div className="mt-5">
          <p className="text-sm text-rose-300/90">
            {error ?? "Lesson could not be generated right now. Please try again."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => void generateLesson()}
          >
            Try again
          </Button>
        </div>
      )}

      {(state === "ready" ||
        state === "playing" ||
        state === "paused" ||
        state === "speaking" ||
        state === "completed") &&
        lesson && (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-100">{lesson.title}</p>
              <p className="text-[11px] text-zinc-500">{lesson.durationEstimate}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">Voice: {voiceLabel}</p>
            </div>

            {playbackMode === "polly" && audioSrc ? (
              <div className="space-y-2 rounded-lg border border-white/[0.06] bg-zinc-950/60 p-3">
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  controls
                  preload="metadata"
                  className="w-full"
                  onPlay={() => {
                    setState("playing");
                    trackPlayed("polly_mp3");
                  }}
                  onPause={() => {
                    if (audioRef.current && !audioRef.current.ended) {
                      setState("paused");
                    }
                  }}
                  onEnded={() => {
                    setState("completed");
                    trackCompleted();
                  }}
                  onTimeUpdate={() => {
                    const audio = audioRef.current;
                    if (!audio) return;
                    setCurrentTime(audio.currentTime);
                    if (Number.isFinite(audio.duration)) setDuration(audio.duration);
                  }}
                  onLoadedMetadata={() => {
                    const audio = audioRef.current;
                    if (audio && Number.isFinite(audio.duration)) {
                      setDuration(audio.duration);
                    }
                  }}
                  onError={() => {
                    setError("Audio playback failed. Try regenerate or browser fallback.");
                    setState("error");
                  }}
                />
                <p className="text-center text-[10px] tabular-nums text-zinc-600">
                  {formatTime(currentTime)}
                  {duration > 0 ? ` / ${formatTime(duration)}` : ""}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {(state === "ready" || state === "completed") && (
                <Button type="button" size="sm" disabled={!canPlay} onClick={handlePlay}>
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Play
                </Button>
              )}
              {(state === "playing" || state === "speaking") && (
                <Button type="button" size="sm" variant="secondary" onClick={handlePause}>
                  <Pause className="h-3.5 w-3.5" aria-hidden />
                  Pause
                </Button>
              )}
              {state === "paused" && (
                <Button type="button" size="sm" onClick={handleResume}>
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Resume
                </Button>
              )}
              {(state === "playing" ||
                state === "paused" ||
                state === "speaking") && (
                <Button type="button" size="sm" variant="ghost" onClick={handleStop}>
                  <Square className="h-3.5 w-3.5" aria-hidden />
                  Stop
                </Button>
              )}
              {playbackMode === "polly" && audioSrc && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSeek(-SEEK_SECONDS)}
                    aria-label={`Rewind ${SEEK_SECONDS} seconds`}
                  >
                    <SkipBack className="h-3.5 w-3.5" aria-hidden />
                    −{SEEK_SECONDS}s
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSeek(SEEK_SECONDS)}
                    aria-label={`Forward ${SEEK_SECONDS} seconds`}
                  >
                    <SkipForward className="h-3.5 w-3.5" aria-hidden />
                    +{SEEK_SECONDS}s
                  </Button>
                </>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowScript((v) => !v)}
              >
                {showScript ? "Hide script" : "Show script"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleRegenerate}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Regenerate
              </Button>
            </div>

            {state === "completed" && (
              <p className="text-xs text-emerald-300/80">Lesson playback complete.</p>
            )}

            {showScript ? (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-white/[0.06] bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-400">
                {lesson.sections.map((section) => (
                  <div key={section.title} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
                      {section.title}
                    </p>
                    <p className="mt-1">{section.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
    </section>
  );
}

/** Compact workspace promo for upload dashboard. */
export function LearnByListeningBanner({
  isPaidActive,
  entitlementPlanId,
}: {
  isPaidActive: boolean;
  entitlementPlanId: PlanId;
}) {
  const paidAccess = canUseAudioStudyMode(entitlementPlanId, isPaidActive);

  return (
    <section
      className="listening-banner-card group relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/25 via-violet-950/10 to-zinc-950/60 px-4 py-3.5 transition-[border-color,box-shadow] duration-300 hover:border-violet-400/35"
      aria-label="Learn by listening"
    >
      <div
        className="listening-banner-sweep pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="listening-banner-waves pointer-events-none absolute inset-y-0 right-[28%] flex items-center gap-[3px] opacity-[0.14]"
        aria-hidden
      >
        <span className="listening-banner-wave-bar h-3 w-[2px] rounded-full bg-violet-400/80" />
        <span className="listening-banner-wave-bar listening-banner-wave-bar--2 h-4 w-[2px] rounded-full bg-violet-400/70" />
        <span className="listening-banner-wave-bar listening-banner-wave-bar--3 h-2.5 w-[2px] rounded-full bg-violet-400/80" />
        <span className="listening-banner-wave-bar listening-banner-wave-bar--4 h-3.5 w-[2px] rounded-full bg-violet-400/60" />
        <span className="listening-banner-wave-bar listening-banner-wave-bar--5 h-2 w-[2px] rounded-full bg-violet-400/75" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center self-center">
            <span
              className="listening-banner-icon-glow absolute -inset-2 rounded-full bg-violet-500/25 blur-md"
              aria-hidden
            />
            <Headphones
              className="listening-banner-icon-pulse relative z-[1] h-4 w-4 text-violet-300"
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100">Learn by listening</p>
            <p className="text-xs text-zinc-500">
              Teacher-style lessons with natural voice audio.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">
            New
          </span>
          {paidAccess ? (
            <Link
              href="/upload"
              className="listening-banner-cta text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
            >
              Generate from an analysis
              <span className="listening-banner-cta-arrow ml-0.5 inline-block" aria-hidden>
                →
              </span>
            </Link>
          ) : (
            <Link
              href={AUDIO_STUDY_UPGRADE_HREF}
              className="listening-banner-cta text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
            >
              Unlock voice learning
              <span className="listening-banner-cta-arrow ml-0.5 inline-block" aria-hidden>
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
