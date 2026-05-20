/**
 * SERVER ONLY — plan limits before intelligence prep.
 */

import { getPlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";
import {
  applyPlanDocumentLimits,
  type PlanDocumentLimitResult,
} from "@/server/extraction/applyPlanDocumentLimits";

export type AnalysisLimitsMeta = {
  plan: PlanId;
  uploadMb: number;
  extractedPages: number;
  extractedCharacters: number;
  wasChunked: boolean;
  wasTruncated: boolean;
  truncationStrategy: string | null;
};

export type PrepareDocumentForAnalysisResult = PlanDocumentLimitResult & {
  analysisLimits: AnalysisLimitsMeta;
};

export function prepareDocumentForAnalysis(
  rawText: string,
  planId: PlanId,
  options?: { estimatedPages?: number },
): PrepareDocumentForAnalysisResult {
  const limits = getPlanLimits(planId);
  const applied = applyPlanDocumentLimits(rawText, limits, options);

  return {
    ...applied,
    analysisLimits: {
      plan: planId,
      uploadMb: limits.maxUploadMb,
      extractedPages: applied.extractedPages,
      extractedCharacters: applied.fullExtractedCharacters,
      wasChunked: applied.wasChunked,
      wasTruncated: applied.wasTruncated,
      truncationStrategy: applied.truncationStrategy,
    },
  };
}
