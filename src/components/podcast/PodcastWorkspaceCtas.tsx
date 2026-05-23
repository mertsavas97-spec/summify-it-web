"use client";

import Link from "next/link";
import {
  BrainCircuit,
  Headphones,
  Layers,
  Loader2,
  Lock,
  Mic,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@/lib/podcast/podcast-types";
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

const DENSITY_OPTIONS: DensityOption[] = [
  { mode: "quick", label: "Quick", duration: "~5-8 min" },
  { mode: "standard", label: "Standard", duration: "~10-15 min" },
  { mode: "deep-dive", label: "Deep Dive", duration: "~15-20 min" },
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

/** Generation step labels for multi-step progress. */
const GENERATION_STEPS = [
  "Analyzing source structure",
  "Building podcast outline",
  "Generating host discussion",
  "Rendering audio conversation",
];

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
  const [audioStudyError, setAudioStudyError] = useState<string | null>(null);
  const audioStudyPaidAccess = canUseAudioStudyMode(entitlementPlanId, isPaidActive);
  const podcastPaidAccess = canUsePodcastDiscussionMode(entitlementPlanId, isPaidActive);
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

  const podcastState = !hasSource
    ? "no-source"
    : !hasAnalysis
      ? "pending"
      : eligibility.eligible
        ? "eligible"
        : "ineligible";

  const podcastStatus =
    podcastState === "no-source"
      ? "Analyze a longer source first"
      : podcastState === "pending"
        ? "Run analysis to check podcast readiness"
        : podcastState === "eligible"
          ? "Podcast-ready"
          : "Better as quick audio lesson";

  function trackPodcastClick() {
    trackEvent("podcast_cta_clicked", {
      state: podcastState,
      plan: entitlementPlanId,
      locked: !podcastPaidAccess,
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
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        cached?: boolean;
        podcast?: PodcastDiscussionScript;
        audio?: PodcastDiscussionAudio;
        error?: string;
      };

      if (!res.ok || !data.success || !data.podcast || !data.audio) {
        throw new Error(data.error ?? "Podcast discussion could not be generated right now.");
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2" data-podcast-workspace-ctas>
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
                {audioStudyPaidAccess ? (
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
                {audioStudyPaidAccess ? (
                  <button
                    type="button"
                    disabled={!hasAnalysis || audioStudyState === "generating"}
                    onClick={async () => {
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
                          error?: string;
                        };

                        // API returns 200 on success without a 'success' field
                        // Check for error field or missing audio data
                        if (!res.ok) {
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
                        setAudioStudyState("ready");
                      } catch (err) {
                        setAudioStudyError(err instanceof Error ? err.message : "Audio lesson could not be generated right now.");
                        setAudioStudyState("error");
                      }
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-violet-500/20 to-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-200 transition-all hover:from-violet-500/30 hover:to-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {audioStudyState === "generating" ? "Generating audio lesson..." : hasAnalysis ? "Generate audio lesson" : "Analyze source first"}
                  </button>
                ) : (
                  <Link
                    href={AUDIO_STUDY_UPGRADE_HREF}
                    className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
                  >
                    <Lock className="h-3 w-3" aria-hidden />
                    Unlock audio lessons <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                  </Link>
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
              {podcastPaidAccess ? (
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
            {podcastState === "eligible" && podcastPaidAccess ? (
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
                        className={`flex items-center gap-2 flex-1 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-violet-400/50 bg-violet-500/25 text-violet-50 shadow-sm shadow-violet-500/10"
                            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-violet-400/25 hover:text-zinc-200"
                        }`}
                      >
                        {getDensityModeIcon(option.mode, isSelected)}
                        <div className="text-left">
                          <span className="block text-[10px] font-semibold">{option.label}</span>
                          <span className="block text-[9px] opacity-70">{option.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={loading > 0 || !analysisResult}
                  onClick={() => {
                    trackPodcastClick();
                    void generatePodcast();
                  }}
                  className="listening-banner-cta inline-flex items-center gap-2 text-left text-xs font-semibold text-violet-200 transition-colors duration-200 hover:text-violet-50 disabled:opacity-60"
                >
                  {loading > 0 ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      <span className="flex flex-col gap-1">
                        <span className="text-sm">Generating your podcast...</span>
                        <span className="text-[10px] text-zinc-400">
                          {GENERATION_STEPS[Math.min(Math.floor(loading * 4), GENERATION_STEPS.length - 1)] || "Processing..."}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" aria-hidden />
                      <span>Generate podcast discussion</span>
                      <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
                    </>
                  )}
                </button>
              </>
            ) :
             podcastState === "eligible" ? (
              <Link
                href={AUDIO_STUDY_UPGRADE_HREF}
                onClick={trackPodcastClick}
                className="listening-banner-cta inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 transition-colors duration-200 hover:text-violet-100"
              >
                <Lock className="h-3 w-3" aria-hidden />
                Unlock podcast discussion <span className="listening-banner-cta-arrow inline-block" aria-hidden>→</span>
              </Link>
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
      </div>
      {generatedDiscussion && generatedDiscussion.analysis === analysisResult ? (
        <>
          <CinematicPodcastPlayer
            podcast={generatedDiscussion.podcast}
            audio={generatedDiscussion.audio}
            cached={generatedDiscussion.cached}
            regenerating={regenerating}
            onRegenerate={() => void generatePodcast(true)}
            analysisId={analysisId}
          />
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
