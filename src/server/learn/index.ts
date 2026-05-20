/**
 * SERVER ONLY — adaptive learn intelligence layer.
 */

export { buildLearnIntelligence } from "./buildLearnIntelligence";
export { applyLearnCardQuality, learnCardQualityDebugStats } from "./learnCardQuality";
export type { LearnCardQualityContext, LearnCardQualityResult, LearnCardQualityStats } from "./learnCardQuality";
export { getModeLearnStrategy, resolveCardStrategyPattern } from "./modeLearnStrategies";
export type { ModeLearnStrategy, ModeLearnStrategyInput } from "./modeLearnStrategies";
export {
  applyStrategyToLearnCards,
  filterCandidatesByStrategy,
  practicePromptForCard,
  resolveLearnStrategy,
} from "./applyModeLearnStrategy";
export {
  applyLearningProgression,
  learnProgressionDebugStats,
  retrievalPromptForCard,
  refineMemoryHookContent,
} from "./learningProgression";
export {
  attachSourceTraceToLearnCards,
  buildSourceTraceSections,
  encodePracticeReviewContext,
  sourceTraceDebugStats,
} from "./sourceTrace";
export {
  extractKnowledgeStructure,
  type KnowledgeStructure,
  type KnowledgeNode,
} from "./knowledgeStructure";
export { collapseCandidatesByConceptClusters } from "./conceptClustering";
export {
  synthesizeKnowledgeStructureCandidates,
  applyKnowledgePriorityScoring,
  learnKnowledgeStructureDebugStats,
} from "./knowledgeStructureLearn";
export {
  compressLearnCandidates,
  compressLearnCardOutputs,
  calculateKnowledgeDensity,
  calculateIdeaUniquenessScore,
  orderCardsForProgressiveUnderstanding,
  learnCompressionDebugStats,
  type KnowledgeCompressionResult,
  type LearnCard,
} from "./knowledgeCompression";
export {
  applyMemoryAnchorsToLearnCards,
  learnMemoryAnchorsDebugStats,
  type MemoryAnchor,
  type MemoryAnchorResult,
  type MemoryAnchorType,
} from "./memoryAnchors";
export {
  buildMultiFormatLearn,
  buildMultiFormatLearnForSavedAnalysis,
  getRecommendedLearnFormats,
  learnMultiFormatDebugStats,
} from "./multiFormatLearning";
export type {
  CardReviewOutcome,
  CardRetentionState,
  PracticeRetentionHint,
  PracticeRetentionSummary,
  RetentionStrength,
} from "./retentionTypes";
export {
  mergeRetentionDebug,
  retentionDebugFromStates,
  scoreCardRetention,
} from "./retentionScoring";
export { refineSemanticTitle, isSyntheticTitle } from "./refineLearnTitle";
export type {
  BuildLearnIntelligenceOptions,
  BuildLearnIntelligenceResult,
  LearnCardKind,
} from "./types";
