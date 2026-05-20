/**
 * Phase 11D — adaptive learn intelligence (client-safe types).
 * Optional fields on learn cards preserve backward compatibility with saved analyses.
 */

import type { CognitionDomain } from "@/types/cognition";
import type { LearnCardOutputType } from "@/types/text-analysis";

export type LearnCognitiveStyle =
  | "chronological"
  | "causal"
  | "mechanistic"
  | "interpretive"
  | "systems"
  | "strategic"
  | "balanced";

export type LearnMemoryStrategy =
  | "timeline_anchors"
  | "cause_effect_chains"
  | "term_definition"
  | "process_steps"
  | "symbol_motif"
  | "architecture_map"
  | "metric_tradeoff"
  | "mixed_recall";

export type LearnSequencingStrategy =
  | "chronological"
  | "foundational_first"
  | "theme_then_detail"
  | "architecture_top_down"
  | "signal_priority";

export type LearnGroupingStrategy = "adaptive_groups" | "flat" | "kind_only";

export type LearnReviewStrategy =
  | "spaced_recall"
  | "quiz_heavy"
  | "connection_drill"
  | "mixed";

export type LearnDifficultyModel = "heuristic_v1" | "flat";

/** Preferred cognitive patterns for card synthesis and ranking. */
export type LearnCardPattern =
  | "timeline_chain"
  | "cause_effect_chain"
  | "event_linkage"
  | "figure_significance"
  | "historical_anchor"
  | "process_sequence"
  | "mechanism_breakdown"
  | "terminology"
  | "system_interaction"
  | "misconception_trap"
  | "symbol_interpretation"
  | "motif_recurrence"
  | "character_psychology"
  | "narrative_tension"
  | "thematic_link"
  | "dependency_chain"
  | "architecture_decomposition"
  | "workflow_sequence"
  | "debugging_path"
  | "tradeoff"
  | "metric_significance"
  | "risk_opportunity"
  | "decision_consequence"
  | "fact_recall"
  | "quiz_application";

export type LearnCardRelationshipType =
  | "chronology_before"
  | "chronology_after"
  | "caused_by"
  | "leads_to"
  | "contrasts_with"
  | "supports"
  | "depends_on"
  | "symbolizes"
  | "related_to";

export type LearnCardRelationship = {
  type: LearnCardRelationshipType;
  /** References another card's stable id in the same deck. */
  targetCardId: string;
};

export type LearnDifficultyLevel = "low" | "medium" | "high";

export type LearnAbstractionLevel = "low" | "medium" | "high";

export type AdaptiveLearnGroup = {
  id: string;
  title: string;
  purpose: string;
  cardTypes: LearnCardOutputType[];
  sequencing: LearnSequencingStrategy;
  maxCards: number;
  priority: "primary" | "secondary";
};

export type AdaptiveLearnProfile = {
  profileId: string;
  personaId: string;
  documentDomain: CognitionDomain;
  learningGoal: string;
  cognitiveStyle: LearnCognitiveStyle;
  preferredCardPatterns: LearnCardPattern[];
  memoryStrategy: LearnMemoryStrategy;
  sequencingStrategy: LearnSequencingStrategy;
  groupingStrategy: LearnGroupingStrategy;
  reviewStrategy: LearnReviewStrategy;
  difficultyModel: LearnDifficultyModel;
  groups: AdaptiveLearnGroup[];
  rationale: string;
};

/** Optional enrichment on API learn cards (Phase 11D). */
export type LearnCardEnrichment = {
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

export type LearnDifficultyStats = {
  low: number;
  medium: number;
  high: number;
  avgMemoryWeight: number;
  avgConceptualDensity: number;
};

/** Dev-only learn intelligence slice. */
export type AdaptiveLearnDebugMeta = {
  adaptiveLearnProfileId: string;
  learnGroups: Array<{ id: string; title: string; cardCount: number }>;
  relationshipCount: number;
  difficultyStats: LearnDifficultyStats;
};
