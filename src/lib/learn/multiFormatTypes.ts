/**
 * Phase Learn 6.5 — multi-format learning types (client + server safe).
 */

import type { LearnCardMemoryAnchor, LearnSourceTrace } from "@/types/adaptive-learn";

export type LearnFormatType =
  | "flashcards"
  | "timeline"
  | "concept_map"
  | "rapid_review"
  | "oral_quiz"
  | "narrative_chain"
  | "decision_map"
  | "mechanism_flow";

export type LearnFormatItemEntry = {
  id: string;
  label: string;
  detail?: string;
  relatedCardIds?: string[];
  sourceTrace?: LearnSourceTrace;
  memoryAnchor?: LearnCardMemoryAnchor;
};

export type LearnFormatItem = {
  id: string;
  type: LearnFormatType;
  title: string;
  description?: string;
  items: LearnFormatItemEntry[];
};

export type MultiFormatLearnOutput = {
  recommendedFormat: LearnFormatType;
  formats: LearnFormatItem[];
};

/** Dev-only multi-format pass (Phase Learn 6.5). */
export type LearnMultiFormatDebugMeta = {
  recommendedFormats: LearnFormatType[];
  generatedFormatCount: number;
  timelineItemCount: number;
  conceptMapNodeCount: number;
  rapidReviewItemCount: number;
};

export const LEARN_FORMAT_LABELS: Record<LearnFormatType, string> = {
  flashcards: "Flashcards",
  timeline: "Timeline",
  concept_map: "Concept map",
  rapid_review: "Rapid review",
  oral_quiz: "Oral quiz",
  narrative_chain: "Narrative chain",
  decision_map: "Decision map",
  mechanism_flow: "Mechanism flow",
};
