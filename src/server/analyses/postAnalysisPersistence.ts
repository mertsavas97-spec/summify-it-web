import type { AnalysisResult } from "@/server/ai/schemas";
import type { AnalysisIntelligenceContext } from "@/server/intelligence";
import type {
  AnalysisSourceHint,
  AnalyzeSourceContext,
} from "@/server/intelligence/types";
import { devLog } from "@/server/logging";
import { trackUsageEvent } from "@/server/usage/trackUsageEvent";
import { buildSavePayload } from "./buildSavePayload";
import { saveAnalysis } from "./saveAnalysis";

export type PostAnalysisPersistenceInput = {
  userId: string | null;
  intelligenceModeId: string;
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
  providerUsed: string;
  fallbackUsed: boolean;
  result: AnalysisResult;
  intelligence: AnalysisIntelligenceContext;
};

export type PostAnalysisPersistenceResult = {
  savedToWorkspace: boolean;
  savedAnalysisId: string | null;
};

/**
 * Records usage + saved analysis after a successful analyze.
 * Never throws — failures are logged only.
 */
export async function runPostAnalysisPersistence(
  input: PostAnalysisPersistenceInput,
): Promise<PostAnalysisPersistenceResult> {
  if (!input.userId) {
    devLog("[summify.analyze] usage_tracking_skipped_no_user", {
      reason: "anonymous",
    });
    devLog("[summify.analyze] saved_analysis_skipped_no_user", {
      reason: "anonymous",
    });
    return { savedToWorkspace: false, savedAnalysisId: null };
  }

  devLog("[summify.analyze] usage_tracking_start", {
    userId: input.userId,
    sourceKind: input.sourceHint ?? null,
    intelligenceMode: input.intelligenceModeId,
    providerUsed: input.providerUsed,
  });

  await trackUsageEvent({
    userId: input.userId,
    eventType: "analysis_completed",
    sourceKind: input.sourceHint ?? null,
    intelligenceMode: input.intelligenceModeId,
    providerUsed: input.providerUsed,
  });

  devLog("[summify.analyze] saved_analysis_start", {
    userId: input.userId,
    intelligenceMode: input.intelligenceModeId,
  });

  const payload = buildSavePayload({
    userId: input.userId,
    result: input.result,
    intelligenceModeId: input.intelligenceModeId,
    sourceHint: input.sourceHint,
    sourceContext: input.sourceContext,
    providerUsed: input.providerUsed,
    fallbackUsed: input.fallbackUsed,
    intelligence: input.intelligence,
  });

  const savedAnalysisId = await saveAnalysis(payload);

  return {
    savedToWorkspace: Boolean(savedAnalysisId),
    savedAnalysisId,
  };
}
