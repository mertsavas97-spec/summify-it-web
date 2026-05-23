import type { LearnCardOutput } from "@/types/text-analysis";
import type { PodcastSuitabilityTier } from "./eligibility";

export type PodcastSpeakerId = "host" | "expert";

/**
 * Podcast density mode — controls pacing and depth of discussion.
 * - quick: concise, fast-paced (3-6 min)
 * - standard: balanced discussion (6-12 min)
 * - deep-dive: extended exploration (12-20 min)
 * - critical: analytical, challenge-focused
 * - debate: contrasting viewpoints, productive friction
 */
export type PodcastDensityMode =
  | "quick"
  | "standard"
  | "deep-dive"
  | "critical"
  | "debate";

export type PodcastToneProfile =
  | "academic"
  | "casual"
  | "storytelling"
  | "executive"
  | "debate";

export type PodcastDiscussionTurn = {
  speaker: PodcastSpeakerId;
  text: string;
};

export type PodcastDiscussionOutlineItem = {
  title: string;
  summary: string;
};

export type PodcastDiscussionScript = {
  title: string;
  estimatedDurationMinutes: number;
  speakers: [
    {
      id: "host";
      name: "Host";
    },
    {
      id: "expert";
      name: "Expert";
    },
  ];
  outline: PodcastDiscussionOutlineItem[];
  script: PodcastDiscussionTurn[];
  totalWordCount: number;
  /** Density mode used for generation */
  densityMode?: PodcastDensityMode;
  /** Suitability tier of the source */
  suitability?: PodcastSuitabilityTier;
  /** Tone profile used for speaker style */
  toneProfile?: PodcastToneProfile;
  /** The ID of the analysis this podcast was generated from, if any. */
  analysisId?: string | null;
};

export type PodcastDiscussionMetadata = PodcastDiscussionScript & {
  generatedAt: string;
};

export type PodcastDiscussionVoice = {
  speaker: PodcastSpeakerId;
  name: string;
  voiceId: string;
};

export type PodcastDiscussionAudio = {
  audioBase64: string;
  audioMime: string;
  audioUrl: string;
  voices: [PodcastDiscussionVoice, PodcastDiscussionVoice];
};

export type PodcastQuizQuestionInput = {
  question: string;
  theme?: string | null;
};

export type PodcastSourceMetadataInput = {
  documentType?: string | null;
  sourceLabel?: string | null;
  estimatedPages?: number | null;
  extractedCharacterCount?: number | null;
  youtubeDurationMinutes?: number | null;
  transcriptCharacterCount?: number | null;
};

export type PodcastDiscussionAnalysisInput = {
  title: string;
  summary: string;
  keyInsights: string[];
  learnCards?: LearnCardOutput[];
  quizQuestions?: PodcastQuizQuestionInput[];
  sourceMetadata?: PodcastSourceMetadataInput;
  sourceType?: string | null;
  intelligenceMode?: string | null;
  toneProfile?: PodcastToneProfile;
};
