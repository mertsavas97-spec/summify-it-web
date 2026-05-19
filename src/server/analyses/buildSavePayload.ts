import type { AnalysisResult } from "@/server/ai/schemas";
import type { AnalysisIntelligenceContext } from "@/server/intelligence";
import type {
  AnalysisSourceHint,
  AnalyzeSourceContext,
} from "@/server/intelligence/types";
import type {
  SavedAnalysisMetadata,
  SavedAnalysisSummaryPayload,
} from "@/types/saved-analysis";
import { resolveSourceLabel } from "./resolveSourceLabel";

export type BuildSavePayloadInput = {
  userId: string;
  result: AnalysisResult;
  intelligenceModeId: string;
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
  providerUsed: string;
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceContext;
};

export type SaveAnalysisInsertPayload = {
  user_id: string;
  title: string;
  source_kind: string | null;
  intelligence_mode: string;
  provider_used: string;
  document_type: string | null;
  source_label: string | null;
  summary: SavedAnalysisSummaryPayload;
  learn_cards: AnalysisResult["learnCards"];
  metadata: SavedAnalysisMetadata;
};

export function buildSavePayload(input: BuildSavePayloadInput): SaveAnalysisInsertPayload {
  const summary: SavedAnalysisSummaryPayload = {
    title: input.result.title,
    summary: input.result.summary,
    keyInsights: input.result.keyInsights,
    risksOrWarnings: input.result.risksOrWarnings,
    actionItems: input.result.actionItems,
  };

  const metadata: SavedAnalysisMetadata = {
    fallbackUsed: input.fallbackUsed,
    pipelineType: input.intelligence.adaptivePlan.pipelineType,
    tokenRisk: input.intelligence.tokenBudget.riskLevel,
    documentTypeGuess: input.intelligence.profile.documentTypeGuess,
    knowledgeTitleGuess: input.intelligence.knowledgeLayerSummary.titleGuess,
  };

  return {
    user_id: input.userId,
    title: input.result.title,
    source_kind: input.sourceHint ?? null,
    intelligence_mode: input.intelligenceModeId,
    provider_used: input.providerUsed,
    document_type: input.intelligence.profile.documentTypeGuess,
    source_label: resolveSourceLabel(input.sourceHint, input.sourceContext),
    summary,
    learn_cards: input.result.learnCards,
    metadata,
  };
}
