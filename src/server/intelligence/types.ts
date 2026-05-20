import type { TextAnalysisMode } from "@/server/ai/schemas";

export type DocumentTypeGuess =
  | "presentation_deck"
  | "pitch_deck"
  | "lecture_deck"
  | "report_deck"
  | "marketing_deck"
  | "strategy_deck"
  | "business_report"
  | "research_paper"
  | "legal_contract"
  | "policy_document"
  | "meeting_notes"
  | "educational_material"
  | "article"
  | "creator_brief"
  | "video_transcript"
  | "podcast_transcript"
  | "lecture_transcript"
  | "interview_transcript"
  | "tutorial_transcript"
  | "unknown";

export type AnalysisSourceHint =
  | "youtube"
  | "presentation"
  | "url"
  | "file"
  | "text";

export type TranscriptMomentHint = {
  time: string;
  snippet: string;
};

export type YoutubeSourceContext = {
  sourceKind: "youtube";
  videoId: string;
  title?: string;
  transcriptSegmentCount?: number;
  estimatedDurationMinutes?: number;
  importantMoments?: TranscriptMomentHint[];
  hasTimestamps?: boolean;
};

export type PresentationSlideOutlineHint = {
  slideNumber: number;
  title?: string;
};

export type PresentationSourceContext = {
  sourceKind: "presentation";
  fileName: string;
  slideCount: number;
  detectedSlideTitles: string[];
  repeatedThemes: string[];
  slideOutline: PresentationSlideOutlineHint[];
};

export type AnalyzeSourceContext = YoutubeSourceContext | PresentationSourceContext;

export type SourceQualityFlag = "ok" | "thin" | "fragmented";

export type ComplexityLevel = "low" | "medium" | "high";

export type StructureQualityLevel = "weak" | "medium" | "strong";

export type SectionImportance = "low" | "medium" | "high";

export type PipelineType = "short_direct" | "medium_compacted" | "long_preview";

export type LearnDepthHint = "quick" | "standard" | "deep";

export type OutputDepth = "brief" | "standard" | "detailed";

export type TokenRiskLevel = "low" | "medium" | "high";

export type DocumentProfile = {
  documentTypeGuess: DocumentTypeGuess;
  complexity: ComplexityLevel;
  structureQuality: StructureQualityLevel;
  estimatedReadingTimeMinutes: number;
  detectedSignals: string[];
  suggestedMode: TextAnalysisMode;
  needsChunking: boolean;
  sourceQuality: SourceQualityFlag;
  sourceQualityNote?: string;
};

export type KnowledgeSection = {
  heading: string;
  excerpt: string;
  importance: SectionImportance;
};

export type KnowledgeLayer = {
  titleGuess: string;
  compressedOverview: string;
  keySections: KnowledgeSection[];
  detectedTopics: string[];
  namedEntities: string[];
  distinctivePhrases: string[];
  potentialQuestions: string[];
  warnings: string[];
};

/** Compact API-safe view — no large text blobs */
export type KnowledgeLayerSummary = {
  titleGuess: string;
  sectionCount: number;
  topicCount: number;
  overviewPreview: string;
  warningCount: number;
};

export type TokenBudget = {
  estimatedInputTokens: number;
  estimatedSourceCharacters: number;
  inputBudgetTokens: number;
  outputBudgetTokens: number;
  riskLevel: TokenRiskLevel;
};

export type AdaptiveAnalysisPlan = {
  pipelineType: PipelineType;
  learnDepth: LearnDepthHint;
  maxInputCharacters: number;
  outputDepth: OutputDepth;
};

/** Server-only cognition debug slice (Phase 11A). */
export type CognitionDebugMetadata = {
  domain: string;
  personaId: string;
  personaFamily: string;
  primaryDimensions: string[];
  learnCardDensity: string;
  learnCardProviderEmphasis: string;
  debugSummary: string;
  adaptationLabel: string;
  adaptivePlanId: string;
  structureFamily: string;
  sectionTitles: string[];
  suppressedDefaultSections: ("risks" | "actions")[];
  learnCardStrategySummary: string;
  /** Phase 11D — dev-only learn intelligence slice. */
  adaptiveLearn?: import("@/types/adaptive-learn").AdaptiveLearnDebugMeta;
};

export type AnalysisIntelligenceContext = {
  profile: DocumentProfile;
  knowledgeLayer: KnowledgeLayer;
  knowledgeLayerSummary: KnowledgeLayerSummary;
  tokenBudget: TokenBudget;
  adaptivePlan: AdaptiveAnalysisPlan;
  compactedUserPrompt: string;
  /** Server-only — used for prompt/learn tuning; not returned in API metadata. */
  analyzeSource?: AnalyzeSourceContext;
  /** Server-only — adaptive persona/document cognition (Phase 11A). */
  cognition?: CognitionDebugMetadata;
  /** Full cognition prompt block injected into user message. */
  cognitionPromptBlock?: string;
  /** Phase 11B structure plan (server-only). */
  personaAdaptivePlan?: import("@/types/adaptive-analysis").PersonaAdaptivePlan;
};
