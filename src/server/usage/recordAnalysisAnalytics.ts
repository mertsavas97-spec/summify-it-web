import { resolveAnalyticsSourceType } from "@/lib/analytics/resolveAnalyticsSourceType";
import type { AnalysisSourceHint } from "@/server/intelligence/types";
import type { AnalyzeSourceContext } from "@/server/intelligence/types";
import type { PlanId } from "@/types/plan";
import { trackProductEvent } from "./trackProductEvent";

export type RecordAnalysisCompletedInput = {
  userId?: string | null;
  sessionId?: string | null;
  planId: PlanId | string;
  intelligenceMode: string;
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
  fileType?: string | null;
  analysisId?: string | null;
  charsProcessed?: number;
  pagesProcessed?: number;
};

export type RecordAnalysisFailedInput = {
  userId?: string | null;
  sessionId?: string | null;
  planId: PlanId | string;
  intelligenceMode: string;
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
  fileType?: string | null;
  reason: string;
};

export async function recordAnalysisCompleted(
  input: RecordAnalysisCompletedInput,
): Promise<void> {
  const sourceType = resolveAnalyticsSourceType({
    sourceHint: input.sourceHint,
    sourceContext: input.sourceContext,
    fileType: input.fileType,
  });

  await trackProductEvent({
    eventType: "analysis_completed",
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType,
    intelligenceMode: input.intelligenceMode,
    plan: input.planId,
    success: true,
    insertViaServiceRole: true,
    metadata: {
      analysis_id: input.analysisId ?? null,
      chars_processed: input.charsProcessed ?? 0,
      pages_processed: input.pagesProcessed ?? 0,
      saved: Boolean(input.analysisId),
    },
  });
}

export async function recordAnalysisFailed(
  input: RecordAnalysisFailedInput,
): Promise<void> {
  const sourceType = resolveAnalyticsSourceType({
    sourceHint: input.sourceHint,
    sourceContext: input.sourceContext,
    fileType: input.fileType,
  });

  await trackProductEvent({
    eventType: "analysis_failed",
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType,
    intelligenceMode: input.intelligenceMode,
    plan: input.planId,
    success: false,
    failureStage: input.reason.slice(0, 120),
    insertViaServiceRole: true,
    metadata: { reason: input.reason.slice(0, 120) },
  });
}
