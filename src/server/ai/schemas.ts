/**
 * Server-side analysis schemas for Phase 4A text pipeline.
 * Safe to mirror in src/types/text-analysis.ts for client display — do not import server modules in client code.
 */

export const TEXT_ANALYSIS_MODES = [
  "executive",
  "academic",
  "creator",
  "legal",
] as const;

export type TextAnalysisMode = (typeof TEXT_ANALYSIS_MODES)[number];

/** Types providers may return in JSON. */
export const LEARN_CARD_PROVIDER_TYPES = [
  "concept",
  "why",
  "memory_hook",
  "quiz",
] as const;

export type LearnCardProviderType = (typeof LEARN_CARD_PROVIDER_TYPES)[number];

/** Full learn layer types after server intelligence pass. */
export const LEARN_CARD_OUTPUT_TYPES = [
  "concept",
  "why_it_matters",
  "memory_hook",
  "quiz",
  "connection",
  "misconception",
  "why",
] as const;

export type LearnCardOutputType = (typeof LEARN_CARD_OUTPUT_TYPES)[number];

export type LearnCardOutput = {
  type: LearnCardOutputType;
  title: string;
  content: string;
};

/** Structured analysis returned by providers and /api/analyze */
export type AnalysisResult = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
  learnCards: LearnCardOutput[];
};

export type AnalyzeApiIntelligenceMetadata = {
  profile: {
    documentTypeGuess: string;
    complexity: string;
    structureQuality: string;
    estimatedReadingTimeMinutes: number;
    detectedSignals: string[];
    suggestedMode: string;
    needsChunking: boolean;
    sourceQuality: string;
    sourceQualityNote?: string;
  };
  knowledgeLayerSummary: {
    titleGuess: string;
    sectionCount: number;
    topicCount: number;
    overviewPreview: string;
    warningCount: number;
  };
  tokenBudget: {
    estimatedInputTokens: number;
    estimatedSourceCharacters: number;
    inputBudgetTokens: number;
    outputBudgetTokens: number;
    riskLevel: string;
  };
  adaptivePlan: {
    pipelineType: string;
    learnDepth: string;
    maxInputCharacters: number;
    outputDepth: string;
  };
};

export type AnalyzeApiDebugAttempt = {
  provider: "groq" | "gemini";
  stage: string;
  reason: string;
  message: string;
};

/** Dev-only diagnostics — omitted in production responses. */
export type AnalyzeApiDebugMetadata = {
  selectedMode: TextAnalysisMode;
  pipelineType: string;
  tokenRisk: string;
  estimatedPromptChars?: number;
  providerUsed?: "groq" | "gemini";
  fallbackUsed?: boolean;
  failureReason?: string;
  attempts?: AnalyzeApiDebugAttempt[];
};

export type AnalyzeApiSuccessResponse = {
  success: true;
  providerUsed: "groq" | "gemini";
  fallbackUsed: boolean;
  result: AnalysisResult;
  profile: AnalyzeApiIntelligenceMetadata["profile"];
  knowledgeLayerSummary: AnalyzeApiIntelligenceMetadata["knowledgeLayerSummary"];
  tokenBudget: AnalyzeApiIntelligenceMetadata["tokenBudget"];
  adaptivePlan: AnalyzeApiIntelligenceMetadata["adaptivePlan"];
  debug?: AnalyzeApiDebugMetadata;
};

export type AnalyzeApiErrorResponse = {
  success: false;
  error: string;
  debug?: AnalyzeApiDebugMetadata;
};

export type AnalyzeApiResponse =
  | AnalyzeApiSuccessResponse
  | AnalyzeApiErrorResponse;

export function isTextAnalysisMode(value: string): value is TextAnalysisMode {
  return (TEXT_ANALYSIS_MODES as readonly string[]).includes(value);
}
