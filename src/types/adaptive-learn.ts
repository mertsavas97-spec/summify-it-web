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
  | "quiz_application"
  | "causal_reasoning"
  | "timeline_turning_point"
  | "institutional_conflict"
  | "transformation_arc"
  | "contrast_analysis"
  | "historical_significance";

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

/** Phase Learn 3 — recall / progression metadata (optional on cards). */
export type RecallDifficultyLevel = "easy" | "medium" | "hard";

export type LearnRetrievalType =
  | "recognition"
  | "recall"
  | "synthesis"
  | "comparison"
  | "application"
  | "chronology"
  | "mechanism";

export type LearnCognitiveLevel = "factual" | "conceptual" | "relational" | "abstract";

/** Phase Learn 4 — lightweight source grounding for a learn card. */
export type LearnSourceTraceType =
  | "summary"
  | "insight"
  | "learn_card"
  | "analysis_section"
  | "extracted_text"
  | "synthesized";

export type LearnSourceTraceConfidence = "low" | "medium" | "high";

export type LearnSourceTrace = {
  sectionTitle?: string;
  sourceType?: LearnSourceTraceType;
  excerpt?: string;
  pageNumber?: number;
  timestampStart?: string;
  timestampEnd?: string;
  confidence?: LearnSourceTraceConfidence;
};

/** Optional enrichment on API learn cards (Phase 11D + Learn 3 + Learn 4). */
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
  recallDifficulty?: RecallDifficultyLevel;
  retrievalType?: LearnRetrievalType;
  cognitiveLevel?: LearnCognitiveLevel;
  prerequisiteCardIds?: string[];
  reinforcesCardIds?: string[];
  sourceTrace?: LearnSourceTrace;
  /** Phase Learn 6.3 — optional recall aid (not evidence). */
  memoryAnchor?: LearnCardMemoryAnchor;
};

/** Phase Learn 6.3 — cognitive anchor on a card. */
export type LearnCardMemoryAnchor = {
  type:
    | "compression_phrase"
    | "contrast_anchor"
    | "timeline_anchor"
    | "emotional_anchor"
    | "symbolic_anchor"
    | "cause_effect_anchor"
    | "identity_anchor"
    | "mnemonic";
  text: string;
  strength: "low" | "medium" | "high";
};

/** Dev-only source trace pass (Phase Learn 4). */
export type LearnSourceTraceDebugMeta = {
  tracedCardCount: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  missingTraceCount: number;
};

/** Dev-only learning progression pass (Phase Learn 3). */
export type LearnProgressionDebugMeta = {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  retrievalDistribution: Record<string, number>;
  cognitiveDistribution: Record<string, number>;
  relationshipCount: number;
  hookCount: number;
};

export type LearnDifficultyStats = {
  low: number;
  medium: number;
  high: number;
  avgMemoryWeight: number;
  avgConceptualDensity: number;
};

/** Dev-only mode learn strategy pass (Phase Learn 2). */
export type LearnStrategyDebugMeta = {
  strategyId: string;
  preferredPatterns: string[];
  blockedPatterns: string[];
  targetDistribution: Record<string, number>;
  actualDistribution: Record<string, number>;
  strategyFilteredCount: number;
  strategyBoostedCount: number;
};

/** Dev-only knowledge compression pass (Phase Learn 6.2). */
export type LearnKnowledgeCompressionDebugMeta = {
  originalCardCount: number;
  compressedCardCount: number;
  removedSemanticDuplicates: number;
  mergedCardCount: number;
  semanticRegionCount: number;
  averageKnowledgeDensity: number;
  averageIdeaUniqueness: number;
};

/** Dev-only knowledge structure pass (Phase Learn 6.1). */
export type LearnKnowledgeStructureDebugMeta = {
  nodeCount: number;
  clusterCount: number;
  causalChainCount: number;
  transformationCount: number;
  conflictCount: number;
  timelineMomentCount: number;
  removedDuplicateClusters: number;
};

/** Dev-only learn card quality pass (Phase Learn 1). */
export type LearnCardQualityStats = {
  originalCardCount: number;
  filteredCardCount: number;
  removedGenericCount: number;
  removedDuplicateCount: number;
  normalizedTitleCount: number;
  finalPatternDistribution: Record<string, number>;
};

/** Dev-only learn intelligence slice. */
export type AdaptiveLearnDebugMeta = {
  adaptiveLearnProfileId: string;
  learnGroups: Array<{ id: string; title: string; cardCount: number }>;
  relationshipCount: number;
  difficultyStats: LearnDifficultyStats;
  learnCardQuality?: LearnCardQualityStats;
  learnStrategy?: LearnStrategyDebugMeta;
  learnProgression?: LearnProgressionDebugMeta;
  sourceTrace?: LearnSourceTraceDebugMeta;
  knowledgeStructure?: LearnKnowledgeStructureDebugMeta;
  knowledgeCompression?: LearnKnowledgeCompressionDebugMeta;
  /** Dev-only Phase Learn 6.3 memory anchors pass. */
  memoryAnchors?: LearnMemoryAnchorsDebugMeta;
  retention?: LearnRetentionDebugMeta;
  /** Dev-only Phase Learn 6.5 multi-format pass. */
  multiFormatLearn?: import("@/lib/learn/multiFormatTypes").LearnMultiFormatDebugMeta;
};

/** Dev-only practice retention pass (Phase Learn 6.4). */
export type LearnRetentionDebugMeta = {
  sessionReviewedCount: number;
  weakCount: number;
  developingCount: number;
  stableCount: number;
  strongCount: number;
  hardestRetrievalType?: string;
  suggestedReviewCount: number;
};

/** Dev-only memory anchors pass (Phase Learn 6.3). */
export type LearnMemoryAnchorsDebugMeta = {
  anchorCount: number;
  appliedCardCount: number;
  skippedCardCount: number;
  anchorTypes: Record<string, number>;
  highStrengthCount: number;
};
