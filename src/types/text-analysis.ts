/**
 * Client-safe types for text analysis API (no server imports).
 */

import type { AnalysisIntelligenceMetadata } from "./intelligence";

export const TEXT_ANALYSIS_MODES = [
  "executive",
  "academic",
  "creator",
  "legal",
] as const;

export type TextAnalysisMode = (typeof TEXT_ANALYSIS_MODES)[number];

export type LearnCardOutputType =
  | "concept"
  | "why_it_matters"
  | "memory_hook"
  | "quiz"
  | "connection"
  | "misconception"
  | "why";

export type LearnCardOutput = {
  type: LearnCardOutputType;
  title: string;
  content: string;
};

export type AnalysisResult = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
  learnCards: LearnCardOutput[];
};

export type AnalyzeApiDebugAttempt = {
  provider: "groq" | "gemini";
  stage: string;
  reason: string;
  message: string;
};

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
  savedToWorkspace?: boolean;
  debug?: AnalyzeApiDebugMetadata;
} & AnalysisIntelligenceMetadata;

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

export const QUIZ_ANSWER_DELIMITER = "\n---\n";

export function parseQuizContent(content: string): {
  question: string;
  answer: string | null;
} {
  const idx = content.indexOf(QUIZ_ANSWER_DELIMITER);
  if (idx === -1) {
    return { question: content.trim(), answer: null };
  }
  return {
    question: content.slice(0, idx).trim(),
    answer: content.slice(idx + QUIZ_ANSWER_DELIMITER.length).trim() || null,
  };
}
