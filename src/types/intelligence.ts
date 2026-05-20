/**
 * Client-safe intelligence metadata from /api/analyze (no server imports).
 */

export type DocumentTypeGuess =
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

export type ComplexityLevel = "low" | "medium" | "high";

export type StructureQualityLevel = "weak" | "medium" | "strong";

export type PipelineType = "short_direct" | "medium_compacted" | "long_preview";

export type TokenRiskLevel = "low" | "medium" | "high";

export type DocumentProfileMetadata = {
  documentTypeGuess: DocumentTypeGuess;
  complexity: ComplexityLevel;
  structureQuality: StructureQualityLevel;
  estimatedReadingTimeMinutes: number;
  detectedSignals: string[];
  suggestedMode: string;
  needsChunking: boolean;
  sourceQuality: "ok" | "thin" | "fragmented";
  sourceQualityNote?: string;
};

export type KnowledgeLayerSummaryMetadata = {
  titleGuess: string;
  sectionCount: number;
  topicCount: number;
  overviewPreview: string;
  warningCount: number;
};

export type TokenBudgetMetadata = {
  estimatedInputTokens: number;
  estimatedSourceCharacters: number;
  inputBudgetTokens: number;
  outputBudgetTokens: number;
  riskLevel: TokenRiskLevel;
};

export type AdaptiveAnalysisPlanMetadata = {
  pipelineType: PipelineType;
  learnDepth: "quick" | "standard" | "deep";
  maxInputCharacters: number;
  outputDepth: "brief" | "standard" | "detailed";
};

export type AnalysisIntelligenceMetadata = {
  profile: DocumentProfileMetadata;
  knowledgeLayerSummary: KnowledgeLayerSummaryMetadata;
  tokenBudget: TokenBudgetMetadata;
  adaptivePlan: AdaptiveAnalysisPlanMetadata;
  /** Present in development when cognition planner ran. */
  adaptationLabel?: string;
};
