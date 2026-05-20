import type { AnalysisResult, TextAnalysisMode } from "@/server/ai/schemas";
import type { ComplexityLevel } from "@/server/intelligence/types";
import type { IntelligenceModeId, LearnWeightingProfile } from "@/types/modes";

/** Final learn card kinds (UI + API output). */
export type LearnCardKind =
  | "concept"
  | "why_it_matters"
  | "memory_hook"
  | "quiz"
  | "connection"
  | "misconception";

/** Provider JSON may still emit `why`. */
export type LearnProviderCardType = "concept" | "why" | "memory_hook" | "quiz";

export type LearnCandidateSource =
  | "ai_card"
  | "insight"
  | "summary"
  | "risk"
  | "action"
  | "synthesized";

export type LearnCandidate = {
  kind: LearnCardKind;
  title: string;
  content: string;
  source: LearnCandidateSource;
  importance: number;
  entities: string[];
};

export type LearnCardCountRange = {
  min: number;
  max: number;
};

export type BuildLearnIntelligenceOptions = {
  mode: TextAnalysisMode;
  complexity: ComplexityLevel;
  isYoutubeTranscript?: boolean;
  isPresentation?: boolean;
  intelligenceModeId?: IntelligenceModeId;
  learnWeighting?: LearnWeightingProfile;
  /** Phase 11B — suppress risk/action → learn card synthesis when plan says so. */
  suppressRiskActionLearnSynthesis?: boolean;
  suppressMisconceptionUnlessExplicit?: boolean;
};

export type LearnIntelligenceMeta = {
  candidateCount: number;
  selectedCount: number;
  complexity: ComplexityLevel;
  mode: TextAnalysisMode;
};

export type BuildLearnIntelligenceResult = {
  learnCards: import("@/server/ai/schemas").LearnCardOutput[];
  meta: LearnIntelligenceMeta;
};

export type AnalysisInputForLearn = Pick<
  AnalysisResult,
  "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems" | "learnCards"
>;
