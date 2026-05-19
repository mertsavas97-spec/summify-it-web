import type { AnalyzeSourceContext } from "@/types/analyze-source";
import type { AnalyzeApiResponse } from "@/types/text-analysis";
import type { IntelligenceModeId } from "@/types/modes";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import type { AnalysisResult } from "@/types/text-analysis";

export type RunTextAnalysisParams = {
  rawText: string;
  /** Intelligence mode id (e.g. `executive-brief`) or legacy family (`executive`). */
  mode: IntelligenceModeId | string;
  sourceHint?: "youtube" | "presentation" | "url";
  sourceContext?: AnalyzeSourceContext;
};

export type RunTextAnalysisSuccess = {
  success: true;
  result: AnalysisResult;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceMetadata;
  savedToWorkspace?: boolean;
};

export type RunTextAnalysisFailure = {
  success: false;
  error: string;
};

export type RunTextAnalysisResult = RunTextAnalysisSuccess | RunTextAnalysisFailure;

/**
 * Call POST /api/analyze with optional YouTube source context.
 */
export async function runTextAnalysis(
  params: RunTextAnalysisParams,
): Promise<RunTextAnalysisResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: params.rawText,
      mode: params.mode,
      ...(params.sourceHint ? { sourceHint: params.sourceHint } : {}),
      ...(params.sourceContext ? { sourceContext: params.sourceContext } : {}),
    }),
  });

  const data = (await res.json()) as AnalyzeApiResponse;

  if (!data.success) {
    return {
      success: false,
      error: data.error,
    };
  }

  return {
    success: true,
    result: data.result,
    providerUsed: data.providerUsed,
    fallbackUsed: data.fallbackUsed,
    savedToWorkspace: data.savedToWorkspace,
    intelligence: {
      profile: data.profile,
      knowledgeLayerSummary: data.knowledgeLayerSummary,
      tokenBudget: data.tokenBudget,
      adaptivePlan: data.adaptivePlan,
    },
  };
}
