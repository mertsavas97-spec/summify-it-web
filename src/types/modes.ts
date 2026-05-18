/**
 * Intelligence mode registry types (client + server safe).
 */

import type { TextAnalysisMode } from "@/types/text-analysis";

export const MODE_CATEGORIES = [
  "core",
  "academic_study",
  "business_strategy",
  "content_media",
  "productivity",
  "legal_technical",
  "creative_advanced",
] as const;

export type IntelligenceModeCategory = (typeof MODE_CATEGORIES)[number];

export const INTELLIGENCE_MODE_FAMILIES = [
  "executive",
  "academic",
  "creator",
  "legal",
] as const;

/** Backend prompt/learn family — maps to existing Groq/Gemini lenses. */
export type IntelligenceModeFamily = (typeof INTELLIGENCE_MODE_FAMILIES)[number];

export const MODE_AVAILABILITY = ["active", "locked", "coming_soon"] as const;

export type ModeAvailability = (typeof MODE_AVAILABILITY)[number];

export const OUTPUT_TONES = [
  "analytical",
  "strategic",
  "creative",
  "precise",
  "narrative",
] as const;

export type OutputTone = (typeof OUTPUT_TONES)[number];

export const OUTPUT_DEPTHS = ["brief", "standard", "detailed"] as const;

export type OutputDepthHint = (typeof OUTPUT_DEPTHS)[number];

export type RecommendedSourceKind =
  | "pdf"
  | "docx"
  | "txt"
  | "web"
  | "youtube"
  | "pptx"
  | "any";

export type LearnWeightingProfile = {
  concept?: number;
  why_it_matters?: number;
  memory_hook?: number;
  quiz?: number;
  connection?: number;
  misconception?: number;
};

export type IntelligenceModeId =
  | "general-summary"
  | "key-points"
  | "executive-brief"
  | "deep-dive"
  | "the-student"
  | "the-researcher"
  | "exam-prep"
  | "flashcard-builder"
  | "quiz-generator"
  | "concept-explainer"
  | "the-executive"
  | "swot-analyzer"
  | "market-analyst"
  | "startup-advisor"
  | "meeting-notes-ai"
  | "the-journalist"
  | "the-creator"
  | "script-breakdown"
  | "podcast-summary"
  | "youtube-intelligence"
  | "action-items"
  | "smart-notes"
  | "decision-mapper"
  | "timeline-builder"
  | "contract-analyzer"
  | "technical-decoder"
  | "policy-interpreter"
  | "narrative-explorer"
  | "critical-thinking-mode";

export type IntelligenceModeDefinition = {
  id: IntelligenceModeId;
  label: string;
  shortDescription: string;
  intelligenceLens: string;
  outputStylePreview: string;
  learnEmphasis: string;
  category: IntelligenceModeCategory;
  icon: string;
  availability: ModeAvailability;
  intelligenceFamily: IntelligenceModeFamily;
  learnWeighting: LearnWeightingProfile;
  outputTone: OutputTone;
  outputDepth: OutputDepthHint;
  recommendedSources: RecommendedSourceKind[];
  experimental?: boolean;
  comingSoon?: boolean;
  /** Short prompt adjunct — not a full separate prompt. */
  promptAdjunct?: string;
};

/** @deprecated Use IntelligenceModeFamily — alias for routing docs. */
export type BackendAnalysisMode = TextAnalysisMode;
