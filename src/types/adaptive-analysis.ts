/**
 * Phase 11B — persona-aware analysis structure plan.
 * Distinct from server/intelligence `AdaptiveAnalysisPlan` (token/pipeline budget).
 */

import type { CognitiveDimension, CognitionDomain, CognitionSourceKind } from "@/types/cognition";

export type AdaptiveSectionRenderAs =
  | "summary"
  | "bullets"
  | "numbered"
  | "insight_cards"
  | "table_like"
  | "study_notes"
  | "review_prompts"
  | "action_list"
  | "risk_list"
  | "glossary"
  | "timeline"
  | "concept_map_seed";

export type AdaptiveAnalysisSection = {
  id: string;
  title: string;
  purpose: string;
  dimension: CognitiveDimension | "mixed";
  priority: "primary" | "secondary";
  outputHint: string;
  maxItems: number;
  renderAs: AdaptiveSectionRenderAs;
};

export type LearnCardStrategy = {
  summary: string;
  preferredAdaptiveTypes: string[];
  avoidedAdaptiveTypes: string[];
  providerTypeEmphasis: string;
  titleStyle: string;
  suppressMisconceptionUnlessExplicit: boolean;
  suppressRiskActionSynthesis: boolean;
};

/** Matches server learn-layer candidate origins (`LearnCandidateSource`). Client-safe duplicate. */
export type LearnCandidateSourceSection =
  | "ai_card"
  | "insight"
  | "summary"
  | "risk"
  | "action"
  | "synthesized";

/** Optional adaptive headings for workspace sections (Phase 11C). */
export type PersonaUiSectionLabels = {
  summary?: string;
  keyInsights?: string;
  risks?: string;
  actions?: string;
};

/** Persona-aware structure plan (Phase 11B). */
export type PersonaAdaptivePlan = {
  planId: string;
  personaId: string;
  documentDomain: CognitionDomain;
  sourceKind: CognitionSourceKind;
  profileConfidence: "low" | "medium" | "high";
  structureFamily: string;
  primaryGoal: string;
  sections: AdaptiveAnalysisSection[];
  suppressedDefaultSections: ("risks" | "actions")[];
  learnCardStrategy: LearnCardStrategy;
  toneGuidance: string;
  safetyGuidance: string;
  rationale: string;
  /** Human-readable chip, e.g. "Student · Historical" */
  adaptationLabel: string;
  /** Phase 11C — post-process clears matching learn candidates before ranking. */
  allowedLearnSourceSections?: LearnCandidateSourceSection[];
  blockedLearnSourceSections?: LearnCandidateSourceSection[];
  /** Adaptive CollapsibleSection titles — UI reads from API; omit for generic defaults. */
  uiSectionLabels?: PersonaUiSectionLabels;
};
