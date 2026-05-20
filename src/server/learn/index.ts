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
export { refineSemanticTitle, isSyntheticTitle } from "./refineLearnTitle";
export type {
  BuildLearnIntelligenceOptions,
  BuildLearnIntelligenceResult,
  LearnCardKind,
} from "./types";
