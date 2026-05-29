"use client";

import Link from "next/link";
import {
  Briefcase,
  BrainCircuit,
  Coffee,
  GraduationCap,
  Headphones,
  Layers,
  Loader2,
  Lock,
  MessagesSquare,
  Mic,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";
import { saveAuthReturnTo } from "@/lib/auth/return-to";
import { isGoogleAuthEnabled } from "@/lib/supabase/env";
import {
  AUDIO_STUDY_UPGRADE_HREF,
  canUseAudioStudyMode,
} from "@/lib/audio-study/access";
import {
  DEFAULT_POLLY_VOICE_ID,
  POLLY_VOICE_PRESETS,
  normalizePollyVoiceId,
  type PollyVoiceId,
} from "@/lib/audio-study/pollyVoices";
import { buildAudioStudyInputFromResult } from "@/lib/audio-study/buildAnalysisInput";
import { trackEvent } from "@/lib/analytics/events";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";
import { generateAnalysisQuiz } from "@/lib/learn/generateAnalysisQuiz";
import { canUsePodcastDiscussionMode } from "@/lib/podcast/access";
import {
  resolvePodcastEligibility,
  type PodcastSourceProfile,
} from "@/lib/podcast/eligibility";
import type {
  PodcastDensityMode,
  PodcastDiscussionAudio,
  PodcastDiscussionScript,
  PodcastToneProfile,
} from "@/lib/podcast/podcast-types";
import { resolvePodcastTone } from "@/lib/podcast/resolvePodcastTone";
import type { PlanId } from "@/types/plan";
import type { AnalysisResult } from "@/types/text-analysis";
import { CinematicPodcastPlayer } from "./CinematicPodcastPlayer";
import { PodcastDiscussionPreview } from "./PodcastDiscussionPreview";
import { AudioStudyPlayer } from "@/components/audio-study/AudioStudyPlayer";

/** Density mode option with label and duration estimate. */
type DensityOption = {
  mode: PodcastDensityMode;
  label: string;
  duration: string;
};

type ToneOption = {
  tone: PodcastToneProfile;
  label: string;
  subtitle: string;
  accentClass: string;
  selectedClass: string;
  icon: ComponentType<{ className?: string }>;
};

const DENSITY_OPTIONS: DensityOption[] = [
  { mode: "quick", label: "Quick", duration: "~5-8 min" },
  { mode: "standard", label: "Standard", duration: "~10-15 min" },
  { mode: "deep-dive", label: "Deep Dive", duration: "~15-20 min" },
];

const TONE_OPTIONS: ToneOption[] = [
  {
    tone: "academic",
    label: "Academic",
    subtitle: "Research-driven",
    accentClass: "text-blue-300",
    selectedClass: "border-blue-400/60 bg-blue-500/15 shadow-blue-500/25",
    icon: GraduationCap,
  },
  {
    tone: "casual",
    label: "Casual",
    subtitle: "Relaxed & clear",
    accentClass: "text-emerald-300",
    selectedClass: "border-emerald-400/60 bg-emerald-500/15 shadow-emerald-500/25",
    icon: Coffee,
  },
  {
    tone: "storytelling",
    label: "Storytelling",
    subtitle: "Narrative flow",
    accentClass: "text-fuchsia-300",
    selectedClass: "border-fuchsia-400/60 bg-fuchsia-500/15 shadow-fuchsia-500/25",
    icon: Sparkles,
  },
  {
    tone: "executive",
    label: "Executive",
    subtitle: "Strategic takeaways",
    accentClass: "text-amber-300",
    selectedClass: "border-amber-400/60 bg-amber-500/15 shadow-amber-500/25",
    icon: Briefcase,
  },
  {
    tone: "debate",
    label: "Debate",
    subtitle: "Contrasting views",
    accentClass: "text-cyan-300",
    selectedClass: "border-cyan-400/60 bg-cyan-500/15 shadow-cyan-500/25",
    icon: MessagesSquare,
  },
];

/** Icon component for each density mode. */
function getDensityModeIcon(mode: PodcastDensityMode, isSelected: boolean) {
  const iconClass = `h-3.5 w-3.5 ${isSelected ? "text-white" : "text-zinc-500"}`;
  switch (mode) {
    case "quick":
      return <Zap className={iconClass} aria-hidden />;
    case "standard":
      return <Layers className={iconClass} aria-hidden />;
    case "deep-dive":
      return <BrainCircuit className={iconClass} aria-hidden />;
    default:
      return null;
  }
}

/** Rotating progress subtitles shown while podcast generation is running. */
const GENERATION_PROGRESS_MESSAGES = [
  "Writing the discussion script...",
  "Structuring the conversation...",
  "Preparing speaker voices...",
  "Rendering Host voice...",
  "Rendering Expert voice...",
  "Mixing audio segments...",
  "Almost ready...",
];

const GUEST_AUDIO_LIMIT = 3;
const GUEST_PODCAST_LIMIT = 1;
const GUEST_AUDIO_STORAGE_KEY = "summify_guest_audio_lessons_used";
const GUEST_PODCAST_STORAGE_KEY = "summify_guest_podcasts_used";

function readGuestUsage(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function writeGuestUsage(key: string, used: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(Math.max(0, used)));
}

/**
 * Auto-select density mode based on source profile suitability.
 */
function getAutoDensityMode(eligibility: ReturnType<typeof resolvePodcastEligibility>): PodcastDensityMode {
  if (!eligibility.eligible) return "quick";
  switch (eligibility.suitability) {
    case "short":
      return "quick";
    case "deep-dive":
    case "chaptered":
      return "deep-dive";
    case "standard":
    default:
      return "standard";
  }
}

type PodcastWorkspaceCtasProps = {
  isPaidActive: boolean;
  entitlementPlanId: PlanId;
  hasSource: boolean;
  hasAnalysis: boolean;
  sourceProfile: PodcastSourceProfile;
  analysisId?: string | null;
  analysisResult?: AnalysisResult | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  intelligenceMode?: string | null;
  documentType?: string | null;
  view?: "all" | "audio" | "podcast";
  onAuthRequired?: (feature: "audio" | "podcast", returnTo: string) => void;
};

function meaningfulCount(items: Array<string | null | undefined>): number {
  return items.filter((item) => (item?.trim().length ?? 0) >= 12).length;
}

export function countPodcastAnalysisCandidates(input: {
  keyInsights?: string[];
  learnCards?: Array<{ title?: string; content?: string; isLockedPreview?: boolean }>;
}): number {
  const insightCount = meaningfulCount(input.keyInsights ?? []);
  const learnCandidateCount = (input.learnCards ?? []).filter(
    (card) =>
      !card.isLockedPreview &&
      meaningfulCount([card.title, card.content]) > 0,
  ).length;

  return insightCount + learnCandidateCount;
}

export function PodcastWorkspaceCtas({
  isPaidActive,
  entitlementPlanId,
  hasSource,
  hasAnalysis,
  sourceProfile,
  analysisId,
  analysisResult,
  sourceType,
  sourceLabel,
  intelligenceMode,
  documentType,
  view = "all",
  onAuthRequired,
}: PodcastWorkspaceCtasProps) {
  const [generatedDiscussion, setGeneratedDiscussion] = useState<{
    podcast: PodcastDiscussionScript;
    audio: PodcastDiscussionAudio;
    cached: boolean;
    analysis: AnalysisResult;
  } | null>(null);
  const [loading, setLoading] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [generationError, setGenerationError] = useState<{
    message: string;
    analysis: AnalysisResult;
  } | null>(null);
  const [selectedDensityMode, setSelectedDensityMode] = useState<PodcastDensityMode | null>(null);
  const [selectedToneProfile, setSelectedToneProfile] = useState<PodcastToneProfile | null>(null);
  const viewed = useRef(false);
  const ineligibleShown = useRef(false);

  // Audio Study state
  const [audioStudyState, setAudioStudyState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [audioStudyVoice, setAudioStudyVoice] = useState<PollyVoiceId>(DEFAULT_POLLY_VOICE_ID);
  const [audioStudyResult, setAudioStudyResult] = useState<{
    title: string;
    durationEstimate: string;
    script: string;
    audioUrl?: string;
    audioBase64?: string;
    audioMime?: string;
  } | null>(null);
  const [generationMessageIndex, setGenerationMessageIndex] = useState(0);
  const loadingRef = useRef(loading);

  // Keep ref in sync with loading state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (loading <= 0) return;

    const interval = window.setInterval(() => {
      // Only update if still loading
      if (loadingRef.current > 0) {
        setGenerationMessageIndex((prev) =>
          Math.min(prev + 1, GENERATION_PROGRESS_MESSAGES.length - 1),
        );
      }
    }, 2500);

    return () => {
      window.clearInterval(interval);
      // Reset index when cleanup happens (loading stopped)
      setGenerationMessageIndex(0);
    };
  }, [loading]);
  const [audioStudyError, setAudioStudyError] = useState<string | null>(null);
  const [audioUsage, setAudioUsage] = useState<{ used: number; limit: number } | null>(null);
  const [podcastUsage, setPodcastUsage] = useState<{ used: number; limit: number } | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [guestAudioUsed, setGuestAudioUsed] = useState(() => readGuestUsage(GUEST_AUDIO_STORAGE_KEY));
  const [guestPodcastUsed, setGuestPodcastUsed] = useState(() => readGuestUsage(GUEST_PODCAST_STORAGE_KEY));
  const audioStudyPaidAccess = canUseAudioStudyMode(entitlementPlanId, isPaidActive);
  const podcastPaidAccess = canUsePodcastDiscussionMode(entitlementPlanId, isPaidActive);
  const isGuest = authReady && !isSignedIn;
  const guestAudioRemaining = Math.max(0, GUEST_AUDIO_LIMIT - guestAudioUsed);
  const guestPodcastRemaining = Math.max(0, GUEST_PODCAST_LIMIT - guestPodcastUsed);
  const audioStudyAccess = audioStudyPaidAccess || (isGuest && guestAudioRemaining > 0);
  const podcastAccess = podcastPaidAccess || (isGuest && guestPodcastRemaining > 0);
  const showUsageIndicators = entitlementPlanId === "free" || entitlementPlanId === "scholar";
  const dailyAudioLimit = entitlementPlanId === "free" ? 3 : entitlementPlanId === "scholar" ? 10 : 999;
  const dailyPodcastLimit = entitlementPlanId === "free" ? 1 : entitlementPlanId === "scholar" ? 5 : 999;
  const audioLimitReached = showUsageIndicators && (audioUsage?.used ?? 0) >= dailyAudioLimit;
  const podcastLimitReached = showUsageIndicators && (podcastUsage?.used ?? 0) >= dailyPodcastLimit;

  async function startGoogleSignInBackToCurrentPage(feature: "audio" | "podcast") {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const safeReturnTo = saveAuthReturnTo(currentPath);
    const viewport = window.innerWidth < 768 ? "mobile" : "desktop";
    trackEvent("auth_gated_feature_signin_clicked", {
      feature,
      returnTo: safeReturnTo,
      viewport,
      source: "analysis_workspace_cta",
    });
    trackEvent("auth_return_to_saved", {
      returnTo: safeReturnTo,
      source: "gated_cta",
    });
    if (!isGoogleAuthEnabled()) {
      window.location.href = `/login?returnTo=${encodeURIComponent(safeReturnTo)}`;
      return;
    }

    onAuthRequired?.(feature, safeReturnTo);
    const supabase = createClient();
    trackEvent("auth_google_signin_started", {
      returnTo: safeReturnTo,
      hasReturnTo: true,
    });
    const redirectTo = getAuthCallbackUrl(safeReturnTo, window.location.origin);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      window.location.href = `/login?returnTo=${encodeURIComponent(safeReturnTo)}`;
    }
  }
  const eligibility = useMemo(
    () => resolvePodcastEligibility(sourceProfile),
    [sourceProfile],
  );

  // Compute auto-selected density mode based on source size
  const autoDensityMode = useMemo(
    () => (eligibility.eligible ? getAutoDensityMode(eligibility) : "quick"),
    [eligibility.eligible, eligibility.suitability],
  );

  // Use selected mode if user picked one, otherwise use auto-selected
  const effectiveDensityMode = selectedDensityMode ?? autoDensityMode;
  const autoToneProfile = useMemo(
    () => resolvePodcastTone(documentType ?? null),
    [documentType],
  );
  const effectiveToneProfile = selectedToneProfile ?? autoToneProfile;

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackEvent("podcast_cta_viewed", {
      state: hasAnalysis ? (eligibility.eligible ? "eligible" : "ineligible") : hasSource ? "pending" : "no_source",
      plan: entitlementPlanId,
    });
  }, [eligibility.eligible, entitlementPlanId, hasAnalysis, hasSource]);

  useEffect(() => {
    if (!hasAnalysis || eligibility.eligible || ineligibleShown.current) return;
    ineligibleShown.current = true;
    trackEvent("podcast_ineligible_shown", {
      plan: entitlementPlanId,
      recommended_mode: eligibility.recommendedMode,
    });
  }, [eligibility.eligible, eligibility.recommendedMode, entitlementPlanId, hasAnalysis]);

  useEffect(() => {
    if (!showUsageIndicators || !hasAnalysis) return;

    const supabase = createClient();
    async function loadUsage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsSignedIn(Boolean(user));
      setAuthReady(true);
      if (!user) return;

      const { data: limits } = await supabase
        .from("user_limits")
        .select("daily_audio_lesson_count, daily_podcast_count, last_reset_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const today = new Date().toISOString().slice(0, 10);
      const last = typeof limits?.last_reset_date === "string" ? limits.last_reset_date.slice(0, 10) : today;
      const reset = last !== today;
      setAudioUsage({
        used: reset ? 0 : (limits?.daily_audio_lesson_count ?? 0),
        limit: dailyAudioLimit,
      });
      setPodcastUsage({
        used: reset ? 0 : (limits?.daily_podcast_count ?? 0),
        limit: dailyPodcastLimit,
      });
    }

    void loadUsage();
  }, [showUsageIndicators, hasAnalysis, dailyAudioLimit, dailyPodcastLimit]);

  useEffect(() => {
    if (showUsageIndicators) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(Boolean(data.user));
      setAuthReady(true);
    });
  }, [showUsageIndicators]);

  const podcastState = !hasSource
    ? "no-source"
    : !hasAnalysis
      ? "pending"
      : eligibility.eligible
        ? "eligible"
        : "ineligible";

  const podcastStatus =
    podcastState === "pending"
      ? "Run analysis to check podcast readiness"
      : podcastState === "eligible"
        ? "Podcast-ready"
        : "Better as quick audio lesson";

  function trackPodcastClick() {
    trackProductEventV2Client("podcast_clicked", { metadata: { state: podcastState } });
    trackEvent("podcast_cta_clicked", {
      state: podcastState,
      plan: entitlementPlanId,
      locked: !podcastAccess,
    });
  }

  const quizQuestions = useMemo(() => {
    if (!analysisResult) return [];
    return generateAnalysisQuiz({
      ...analysisResult,
      learnCards: analysisResult.learnCards,
      maxQuestions: 6,
    }).map((question) => ({
      question: question.question,
      theme: question.theme,
    }));
  }, [analysisResult]);

  async function generatePodcast(regenerate = false) {
    if (!analysisResult || loading || regenerating) return;
    if (regenerate) {
      setRegenerating(true);
    } else {
      setLoading(1);
    }
    setGenerationError(null);

    // Use effective density mode (user selection or auto)
    const densityMode = effectiveDensityMode;

    try {
      const res = await fetch("/api/podcast/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysisId ?? "live-analysis",
          regenerate,
          densityMode,
          sourceProfile,
          analysisPayload: {
            ...analysisResult,
            sourceType,
            sourceLabel,
            intelligenceMode,
            documentType,
            quizQuestions,
          },
          toneProfile: effectiveToneProfile,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        cached?: boolean;
        podcast?: PodcastDiscussionScript;
        audio?: PodcastDiscussionAudio;
        usage?: { used: number; limit: number };
        error?: string;
        used?: number;
        limit?: number;
      };

      if (!res.ok || !data.success || !data.podcast || !data.audio) {
        if (res.status === 429 && data.error === "daily_limit_reached") {
          if (typeof data.used === "number" && typeof data.limit === "number") {
            setPodcastUsage({ used: data.used, limit: data.limit });
          }
          throw new Error("Daily limit reached — resets tomorrow");
        }
        throw new Error(data.error ?? "Podcast discussion could not be generated right now.");
      }

      if (data.usage) {
        setPodcastUsage(data.usage);
      }
      if (isGuest && !regenerate) {
        const nextUsed = guestPodcastUsed + 1;
        setGuestPodcastUsed(nextUsed);
        writeGuestUsage(GUEST_PODCAST_STORAGE_KEY, nextUsed);
      }

      setGeneratedDiscussion({
        podcast: data.podcast,
        audio: data.audio,
        cached: Boolean(data.cached),
        analysis: analysisResult,
      });
    } catch (generationError) {
      setGenerationError({
        message:
          generationError instanceof Error
            ? generationError.message
            : "Podcast script could not be generated right now.",
        analysis: analysisResult,
      });
    } finally {
      setLoading(0);
      setRegenerating(false);
    }
  }

  const showAudioCta = view === "all" || view === "audio";
  const showPodcastCta = view === "all" || view === "podcast";

  return (
    <>
      <div
        className={view === "all" ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}
        data-podcast-workspace-ctas
      >
      {showAudioCta ? (
      <section
        className="listening-banner-card group relative flex h-full min-h-44 overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/25 via-violet-950/10 to-zinc-950/60 p-5 transition-[border-color,box-shadow] duration-300 hover:border-violet-400/35"
        aria-label="Audio Study Mode"
      >
        <div className="listening-banner-sweep pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex min-h-full w-full flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/15">
              <span className="listening-banner-icon-glow absolute -inset-2 rounded-full bg-violet-500/25 blur-md" aria-hidden />
              <Headphones className="listening-banner-icon-pulse relative h-4 w-4 text-violet-300" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-100">Audio Study Mode</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Turn this analysis into a short teacher-style explanation you can listen to.
              </p>
              {hasAnalysis && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  Expect about 3–6 min · 500–900 words
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {audioStudyState === "idle" || audioStudyState === "generating" ? (
              <>
                {audioStudyAccess ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={audioStudyVoice}
                      onChange={(e) => setAudioStudyVoice(normalizePollyVoiceId(e.target.value))}
                      className="flex-1 rounded-lg border border-white/[0.1] bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300 focus:border-violet-400/40 focus:outline-none"
                      aria-label="Voice selection"
                      disabled={!hasAnalysis || audioStudyState === "generating"}
                    >
                      {POLLY_VOICE_PRESETS.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.label} — {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {audioStudyAccess ? (
                  <>
                    <button
                      type="button"
                      disabled={!hasAnalysis || audioStudyState === "generating" || (!isGuest && audioLimitReached)}
                      onClick={async () => {
                        trackProductEventV2Client("audio_mode_clicked", {
                          metadata: { state: audioStudyState },
                        });
                      if (!analysisResult || !hasAnalysis) return;
                      setAudioStudyState("generating");
                      setAudioStudyError(null);

                      try {
                        const input = buildAudioStudyInputFromResult(
                          analysisResult,
                          {
                            sourceType,
                            intelligenceMode,
                            sourceLabel,
                          },
                        );

                        const res = await fetch("/api/audio-study/generate", {
                          method: "POST",
                          credentials: "same-origin",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            analysisId: analysisId ?? "live-analysis",
                            voiceId: audioStudyVoice,
                            input,
                          }),
                        });

                        const data = (await res.json()) as {
                          title?: string;
                          durationEstimate?: string;
                          script?: string;
                          audioUrl?: string;
                          audioBase64?: string;
                          audioMime?: string;
                          usage?: { used: number; limit: number };
                          error?: string;
                          used?: number;
                          limit?: number;
                        };

                        // API returns 200 on success without a 'success' field
                        // Check for error field or missing audio data
                        if (!res.ok) {
                          if (res.status === 429 && data.error === "daily_limit_reached") {
                            if (typeof data.used === "number" && typeof data.limit === "number") {
                              setAudioUsage({ used: data.used, limit: data.limit });
                            }
                            throw new Error("Daily limit reached — resets tomorrow");
                          }
                          throw new Error(data.error ?? "Audio lesson could not be generated.");
                        }

                        // Check if we have audio data (either URL or base64)
                        if (!data.audioUrl && !data.audioBase64) {
                          console.warn("[audio-study] no_audio_in_response", {
                            hasAudioUrl: !!data.audioUrl,
                            hasAudioBase64: !!data.audioBase64,
                            responseKeys: Object.keys(data),
                          });
                          throw new Error("Audio lesson was generated but no audio data was returned.");
                        }

                        setAudioStudyResult({
                          title: data.title ?? "Audio Lesson",
                          durationEstimate: data.durationEstimate ?? "3-6 min",
                          script: data.script ?? "",
                          audioUrl: data.audioUrl,
                          audioBase64: data.audioBase64,
                          audioMime: data.audioMime,
                        });
                        if (data.usage) {
                          setAudioUsage(data.usage);
                        }
                        if (isGuest) {
                          const nextUsed = guestAudioUsed + 1;
                          setGuestAudioUsed(nextUsed);
                          writeGuestUsage(GUEST_AUDIO_STORAGE_KEY, nextUsed);
                        }
                        setAudioStudyState("ready");
                      } catch (err) {
                        setAudioStudyError(err instanceof Error ? err.message : "Audio lesson could not be generated right now.");
                        setAudioStudyState("error");
                      }
                    }}
                      className="w-full rounded-lg bg-gradient-to-r from-violet-500/20 to-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-200 transition-all hover:from-violet-500/30 hover:to-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {!isGuest && audioLimitReached
                        ? "Daily limit reached — resets tomorrow"
                        : audioStudyState === "generating"
                          ? "Generating audio lesson..."
                          : hasAnalysis
                            ? "Generate audio lesson"
                            : "Analyze source first"}
                    </button>
                    {isGuest ? (
                      <p className="text-[11px] text-violet-200/80">
                        {guestAudioRemaining} free audio lesson{guestAudioRemaining === 1 ? "" : "s"} left
                      </p>
                    ) : showUsageIndicators ? (
                      <p className="text-[11px] text-zinc-500">
                        {(audioUsage?.used ?? 0)} of {dailyAudioLimit} audio lessons used today
                      </p>
                    ) : null}
                  </>
                ) : (
                  isSignedIn && audioLimitReached ? (
                    <Link
                      href={AUDIO_STUDY_UPGRADE_HREF}
                      className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
                    >
                      <Lock className="h-3 w-3" aria-hidden />
                      Upgrade for more <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void startGoogleSignInBackToCurrentPage("audio");
                      }}
                      className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
                    >
                      <Lock className="h-3 w-3" aria-hidden />
                      Sign in to create audio lessons <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                    </button>
                  )
                )}
              </>
            ) : audioStudyState === "ready" && audioStudyResult ? (
              <AudioStudyPlayer
                audioUrl={audioStudyResult.audioUrl}
                audioBase64={audioStudyResult.audioBase64}
                audioMime={audioStudyResult.audioMime}
                title={audioStudyResult.title}
                durationEstimate={audioStudyResult.durationEstimate}
                voiceId={audioStudyVoice}
                onShowScript={() => setAudioStudyState("idle")}
                onRegenerate={() => {
                  setAudioStudyState("idle");
                  setAudioStudyResult(null);
                }}
              />
            ) : audioStudyState === "error" ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-200/90">{audioStudyError || "Audio lesson could not be generated right now. Please try again."}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAudioStudyState("idle");
                    setAudioStudyError(null);
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-500/20 to-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-200 transition-all hover:from-violet-500/30 hover:to-violet-500/15"
                >
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}

      {showPodcastCta ? (
      <section
        className={`listening-banner-card group relative flex h-full min-h-44 overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-[border-color,box-shadow] duration-300 ${
          podcastState === "eligible"
            ? "border-violet-400/30 from-violet-950/30 via-indigo-950/15 to-zinc-950/60 hover:border-violet-300/45"
            : "border-violet-500/15 from-violet-950/20 via-zinc-950/20 to-zinc-950/60"
        }`}
        aria-label="Podcast discussion"
        data-podcast-state={podcastState}
      >
        <div className="listening-banner-sweep pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex min-h-full w-full flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/15">
              <span className="listening-banner-icon-glow absolute -inset-2 rounded-full bg-violet-500/25 blur-md" aria-hidden />
              {podcastAccess ? (
                <Users className="relative h-4 w-4 text-violet-300" aria-hidden />
              ) : (
                <Lock className="relative h-3.5 w-3.5 text-violet-300" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-100">Turn this into a podcast</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Two speakers discuss your source material in a natural conversation.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className={`text-[11px] font-medium ${podcastState === "eligible" ? "text-violet-200" : "text-zinc-400"}`}>
              {podcastStatus}
            </p>
            {hasAnalysis ? (
              <p className="text-[11px] leading-relaxed text-zinc-500">
                {eligibility.reason}
              </p>
            ) : null}
            {podcastState === "eligible" && podcastAccess ? (
              <>
                {/* Density Mode Selector */}
                <div className="flex gap-2" role="radiogroup" aria-label="Podcast discussion style">
                  {DENSITY_OPTIONS.map((option) => {
                    const isSelected = effectiveDensityMode === option.mode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedDensityMode(option.mode)}
                        className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                            : "border border-white/20 text-white/60 hover:border-violet-400/40 hover:text-white/80"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {getDensityModeIcon(option.mode, isSelected)}
                          <span>{option.label}</span>
                          <span className={`text-[10px] font-medium ${isSelected ? "text-violet-200" : "text-white/40"}`}>
                            {option.duration}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-zinc-400">Conversation tone</p>
                  <div role="radiogroup" aria-label="Conversation tone" className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {TONE_OPTIONS.slice(0, 3).map((option) => {
                        const isSelected = effectiveToneProfile === option.tone;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.tone}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedToneProfile(option.tone)}
                            className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                              isSelected
                                ? `${option.selectedClass} shadow-md`
                                : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`rounded-md p-1 ${isSelected ? "bg-white/10" : "bg-white/5"}`}>
                                <Icon className={`h-3.5 w-3.5 ${option.accentClass}`} aria-hidden />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[11px] font-semibold text-zinc-100">{option.label}</span>
                                <span className="block text-[10px] text-zinc-400">{option.subtitle}</span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:px-8">
                      {TONE_OPTIONS.slice(3).map((option) => {
                        const isSelected = effectiveToneProfile === option.tone;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.tone}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedToneProfile(option.tone)}
                            className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                              isSelected
                                ? `${option.selectedClass} shadow-md`
                                : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`rounded-md p-1 ${isSelected ? "bg-white/10" : "bg-white/5"}`}>
                                <Icon className={`h-3.5 w-3.5 ${option.accentClass}`} aria-hidden />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[11px] font-semibold text-zinc-100">{option.label}</span>
                                <span className="block text-[10px] text-zinc-400">{option.subtitle}</span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={loading > 0 || !analysisResult || (!isGuest && podcastLimitReached)}
                  onClick={() => {
                    trackPodcastClick();
                    void generatePodcast();
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-violet-600 disabled:hover:to-indigo-600"
                >
                  {loading > 0 ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      <span className="flex flex-col gap-1 text-left">
                        <span>Generating your podcast lesson...</span>
                        <span className="text-xs text-violet-200">
                          {GENERATION_PROGRESS_MESSAGES[generationMessageIndex]}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mic className="h-5 w-5" aria-hidden />
                      <span>
                        {!isGuest && podcastLimitReached
                          ? "Daily limit reached — resets tomorrow"
                          : "Generate podcast lesson"}
                      </span>
                    </span>
                  )}
                </button>
                {isGuest ? (
                  <p className="text-[11px] text-violet-200/80">
                    {guestPodcastRemaining > 0
                      ? "1 free podcast lesson included"
                      : "Free podcast used. Sign in to create more."}
                  </p>
                ) : showUsageIndicators ? (
                  <p className="text-[11px] text-zinc-500">
                    {(podcastUsage?.used ?? 0)} of {dailyPodcastLimit} podcasts used today
                  </p>
                ) : null}
              </>
            ) :
             podcastState === "eligible" ? (
              isSignedIn && podcastLimitReached ? (
                <Link
                  href={AUDIO_STUDY_UPGRADE_HREF}
                  onClick={trackPodcastClick}
                  className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
                >
                  <Lock className="h-3 w-3" aria-hidden />
                  Upgrade for more <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    trackPodcastClick();
                    void startGoogleSignInBackToCurrentPage("podcast");
                  }}
                  className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
                >
                  <Lock className="h-3 w-3" aria-hidden />
                  {isSignedIn ? "Unlock podcast discussion" : "Sign in to create podcast"} <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                className="text-left text-xs font-semibold text-zinc-500 disabled:cursor-not-allowed"
              >
                {podcastState === "pending"
                  ? "Create after analysis"
                  : podcastState === "ineligible"
                    ? "Try Audio Study instead"
                    : "Analyze a longer source first"}
              </button>
            )}
            {generationError && generationError.analysis === analysisResult ? (
              <p className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-100">
                {generationError.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}
      </div>
      {showPodcastCta && generatedDiscussion && generatedDiscussion.analysis === analysisResult ? (
        <>
          <CinematicPodcastPlayer
            podcast={generatedDiscussion.podcast}
            audio={generatedDiscussion.audio}
            cached={generatedDiscussion.cached}
            regenerating={regenerating}
            onRegenerate={() => void generatePodcast(true)}
            analysisId={analysisId}
          />

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                trackEvent("podcast_saved_to_workspace", {
                  analysisId: analysisId ?? "live-analysis",
                });

                // Save functionality - call API to persist analysis
                if (!analysisId) {
                  alert("Sign in to save to your workspace");
                  return;
                }

                try {
                  const res = await fetch(`/api/analyses/${analysisId}/save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });

                  const data = await res.json();

                  if (res.ok && data.success) {
                    alert("Podcast saved to your workspace!");
                  } else {
                    alert(data.error ?? "Failed to save. Please try again.");
                  }
                } catch (err) {
                  console.error("[podcast-save] error", err);
                  alert("Failed to save. Please try again.");
                }
              }}
              className="flex-1 min-w-[140px] rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 hover:shadow-violet-500/40"
            >
              Save to workspace
            </button>
            <button
              type="button"
              onClick={async () => {
                trackEvent("podcast_download_mp3", {
                  analysisId: analysisId ?? "live-analysis",
                });
                // Download functionality - fetch audio and create blob download
                try {
                  const audio = generatedDiscussion.audio;
                  let blob: Blob | null = null;

                  // Try fetching from audioUrl first (if it's a real URL)
                  if (audio.audioUrl && audio.audioUrl.startsWith("http")) {
                    const response = await fetch(audio.audioUrl);
                    if (response.ok) {
                      blob = await response.blob();
                    }
                  }

                  // Fallback: decode base64 audio
                  if (!blob && audio.audioBase64) {
                    const base64Data = audio.audioBase64.split(",").pop() ?? audio.audioBase64;
                    const binaryStr = atob(base64Data);
                    const bytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                      bytes[i] = binaryStr.charCodeAt(i);
                    }
                    blob = new Blob([bytes], { type: audio.audioMime || "audio/mpeg" });
                  }

                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${generatedDiscussion.podcast.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.mp3`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                } catch (err) {
                  console.error("[podcast-download] error", err);
                  alert("Could not download MP3. Please try again.");
                }
              }}
              className="flex-1 min-w-[140px] rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/80 transition-all hover:border-violet-400/40 hover:text-white"
            >
              Download MP3
            </button>
            <button
              type="button"
              onClick={async () => {
                trackEvent("podcast_share", {
                  analysisId: analysisId ?? "live-analysis",
                });
                // Share functionality - Web Share API with AbortError handling
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: generatedDiscussion.podcast.title,
                      text: `Check out this AI-generated podcast lesson from Summify`,
                      url: window.location.href,
                    });
                  } catch (err) {
                    // Silently ignore user abort
                    if (err instanceof Error && err.name === "AbortError") {
                      return;
                    }
                    // Fallback to clipboard for other errors
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                    } catch {
                      // Final fallback - do nothing
                    }
                  }
                } else {
                  // Fallback for browsers without Web Share API
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                  } catch {
                    // If clipboard fails, select the URL in address bar
                    window.location.hash = "";
                  }
                }
              }}
              className="flex-1 min-w-[140px] rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/80 transition-all hover:border-violet-400/40 hover:text-white"
            >
              Share
            </button>
          </div>

          <PodcastDiscussionPreview
            podcast={generatedDiscussion.podcast}
            cached={generatedDiscussion.cached}
            sourceType={sourceType}
            intelligenceMode={intelligenceMode}
            analysisId={analysisId}
          />
        </>
      ) : null}
    </>
  );
}
