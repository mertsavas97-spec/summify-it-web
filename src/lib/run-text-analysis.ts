import type { AnalyzeSourceContext } from "@/types/analyze-source";
import type { AnalyzeApiResponse } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import type { AnalysisResult } from "@/types/text-analysis";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";

export type RunTextAnalysisParams = {
  rawText: string;
  /** Intelligence mode id (e.g. `executive-brief`) or legacy family (`executive`). */
  mode: IntelligenceModeId | string;
  sourceHint?: "youtube" | "presentation" | "url" | "file" | "text";
  sourceContext?: AnalyzeSourceContext;
  /** Upload file type for analytics (`pdf`, `docx`, `txt`, `pptx`). */
  fileType?: string | null;
};

export type RunTextAnalysisSuccess = {
  success: true;
  result: AnalysisResult;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceMetadata;
  limitNotice?: string;
  savedToWorkspace?: boolean;
  savedAnalysisId?: string | null;
};

export type RunTextAnalysisFailure = {
  success: false;
  error: string;
  errorCode?: string;
};

export type RunTextAnalysisResult = RunTextAnalysisSuccess | RunTextAnalysisFailure;

/**
 * Call POST /api/analyze with optional YouTube source context.
 */
export async function runTextAnalysis(
  params: RunTextAnalysisParams,
): Promise<RunTextAnalysisResult> {
  const sourceType = params.sourceHint ?? (params.fileType ? "file" : "text");
  const baseMeta = { intelligence_mode: params.mode, source_type: sourceType };
  trackProductEventV2Client("upload_started", { metadata: baseMeta });
  trackProductEventV2Client("analysis_started", { metadata: baseMeta });

  const res = await fetch("/api/analyze", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: params.rawText,
      mode: params.mode,
      ...(params.sourceHint ? { sourceHint: params.sourceHint } : {}),
      ...(params.sourceContext ? { sourceContext: params.sourceContext } : {}),
      ...(params.fileType ? { fileType: params.fileType } : {}),
    }),
  });

  const data = (await res.json()) as AnalyzeApiResponse;

  if (!data.success) {
    return {
      success: false,
      error: data.error,
      ...(data.errorCode ? { errorCode: data.errorCode } : {}),
    };
  }

  trackProductEventV2Client("upload_completed", { metadata: baseMeta });
  trackProductEventV2Client("analysis_completed", {
    eventValue: typeof data.savedAnalysisId === "string" ? data.savedAnalysisId : null,
    metadata: { ...baseMeta, saved: Boolean(data.savedAnalysisId) },
  });

  return {
    success: true,
    result: data.result,
    providerUsed: data.providerUsed,
    fallbackUsed: data.fallbackUsed,
    savedToWorkspace: data.savedToWorkspace,
    savedAnalysisId: data.savedAnalysisId,
    intelligence: {
      profile: data.profile,
      knowledgeLayerSummary: data.knowledgeLayerSummary,
      tokenBudget: data.tokenBudget,
      adaptivePlan: data.adaptivePlan,
      ...(data.adaptationLabel ? { adaptationLabel: data.adaptationLabel } : {}),
      ...(data.personaUiSectionLabels
        ? { personaUiSectionLabels: data.personaUiSectionLabels }
        : {}),
    },
    ...(data.limitNotice ? { limitNotice: data.limitNotice } : {}),
  };
}
