/**
 * Dev diagnostics — where learn cards disappear in the pipeline.
 */

import type { LearnPipelineCountsMeta } from "@/types/adaptive-learn";

export type LearnPipelineCounts = LearnPipelineCountsMeta;

export function createPipelineCounts(): LearnPipelineCounts {
  return {
    rawAiCandidates: 0,
    profileCandidates: 0,
    knowledgeStructureCandidates: 0,
    mergedCandidates: 0,
    afterConceptClustering: 0,
    afterStrategyFiltering: 0,
    afterCompression: 0,
    afterSelection: 0,
    afterStrategyPass: 0,
    afterQuality: 0,
    afterOutputCompression: 0,
    afterProgression: 0,
    finalOutput: 0,
  };
}

export function pipelineCountsDebug(
  counts: LearnPipelineCounts,
): LearnPipelineCounts | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return counts;
}
