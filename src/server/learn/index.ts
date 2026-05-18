/**
 * SERVER ONLY — adaptive learn intelligence layer.
 */

export { buildLearnIntelligence } from "./buildLearnIntelligence";
export { refineSemanticTitle, isSyntheticTitle } from "./refineLearnTitle";
export type {
  BuildLearnIntelligenceOptions,
  BuildLearnIntelligenceResult,
  LearnCardKind,
} from "./types";
