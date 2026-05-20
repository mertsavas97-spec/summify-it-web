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
import { buildMultiFormatLearn } from "@/server/learn/multiFormatLearning";
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

  const structureFamily = input.intelligence.personaAdaptivePlan?.structureFamily;
  const multiFormatLearn = buildMultiFormatLearn({
    modeId: input.intelligenceModeId,
    documentDomain: input.intelligence.profile.documentTypeGuess,
    structureFamily,
    pipelineMode: input.intelligence.adaptivePlan.pipelineType,
    personaId: input.intelligence.personaAdaptivePlan?.personaId,
    learnCards: input.result.learnCards,
    summary: {
      title: input.result.title,
      summary: input.result.summary,
      keyInsights: input.result.keyInsights,
      risksOrWarnings: input.result.risksOrWarnings,
      actionItems: input.result.actionItems,
    },
  });

  const metadata: SavedAnalysisMetadata = {
    fallbackUsed: input.fallbackUsed,
    pipelineType: input.intelligence.adaptivePlan.pipelineType,
    tokenRisk: input.intelligence.tokenBudget.riskLevel,
    documentTypeGuess: input.intelligence.profile.documentTypeGuess,
    knowledgeTitleGuess: input.intelligence.knowledgeLayerSummary.titleGuess,
    ...(structureFamily ? { structureFamily } : {}),
    multiFormatLearn,
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
