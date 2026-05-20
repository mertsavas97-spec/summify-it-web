import type { AnalysisResult, TextAnalysisMode } from "@/server/ai/schemas";
import type { ComplexityLevel } from "@/server/intelligence/types";
import type { IntelligenceModeId, LearnWeightingProfile } from "@/types/modes";
import type {
  AdaptiveLearnProfile,
  LearnAbstractionLevel,
  LearnCardPattern,
  LearnCardRelationship,
  LearnDifficultyLevel,
  AdaptiveLearnDebugMeta,
  LearnCardQualityStats,
  LearnStrategyDebugMeta,
} from "@/types/adaptive-learn";

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
  /** Phase 11D — optional enrichment (internal + API output). */
  cardId?: string;
  groupId?: string;
  groupTitle?: string;
  learnPattern?: LearnCardPattern;
  difficulty?: LearnDifficultyLevel;
  abstractionLevel?: LearnAbstractionLevel;
  memoryWeight?: number;
  conceptualDensity?: number;
  cardRelationships?: LearnCardRelationship[];
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
  /** Phase 11C — keep only these candidate origins when non-empty. */
  allowedLearnSourceSections?: LearnCandidateSource[];
  /** Phase 11C — drop candidates from these origins before ranking. */
  blockedLearnSourceSections?: LearnCandidateSource[];
  /** Phase 11D — persona structure plan (resolves learn profile when profile omitted). */
  personaAdaptivePlan?: import("@/types/adaptive-analysis").PersonaAdaptivePlan;
  /** Phase 11D — persona/domain learn profile (from adaptive plan). */
  adaptiveLearnProfile?: AdaptiveLearnProfile;
  /** Phase 11D — skip summary-sentence candidate mining for domain-heavy profiles. */
  deprioritizeSummaryLearnSynthesis?: boolean;
};

export type LearnIntelligenceMeta = {
  candidateCount: number;
  selectedCount: number;
  complexity: ComplexityLevel;
  mode: TextAnalysisMode;
  /** Dev-only Phase 11D diagnostics. */
  adaptiveLearn?: AdaptiveLearnDebugMeta;
  /** Dev-only Phase Learn 1 quality pass. */
  learnCardQuality?: LearnCardQualityStats;
  /** Dev-only Phase Learn 2 strategy pass. */
  learnStrategy?: LearnStrategyDebugMeta;
};

export type BuildLearnIntelligenceResult = {
  learnCards: import("@/server/ai/schemas").LearnCardOutput[];
  meta: LearnIntelligenceMeta;
};

export type AnalysisInputForLearn = Pick<
  AnalysisResult,
  "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems" | "learnCards"
>;
