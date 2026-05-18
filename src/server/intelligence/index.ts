/**
 * SERVER ONLY — adaptive intelligence & token optimization before AI analysis.
 * Never import in client components.
 */

import { cleanText } from "@/server/extraction/cleanText";
import type { TextAnalysisMode } from "@/server/ai/schemas";
import { profileDocument } from "./profileDocument";
import { buildKnowledgeLayer, summarizeKnowledgeLayer } from "./buildKnowledgeLayer";
import { estimateTokenBudget } from "./estimateTokenBudget";
import { createAdaptiveAnalysisPlan } from "./adaptiveAnalysisPlan";
import { compactPromptInput } from "./compactPromptInput";
import type { AnalysisIntelligenceContext, AnalysisSourceHint } from "./types";

export type { AnalysisSourceHint } from "./types";

export type { AnalysisIntelligenceContext } from "./types";
export type {
  DocumentProfile,
  KnowledgeLayer,
  KnowledgeLayerSummary,
  TokenBudget,
  AdaptiveAnalysisPlan,
  AnalyzeSourceContext,
  YoutubeSourceContext,
  PresentationSourceContext,
  TranscriptMomentHint,
} from "./types";

/**
 * Profile → knowledge layer → token budget → adaptive plan → compacted prompt.
 */
export type PrepareAnalysisIntelligenceOptions = {
  sourceHint?: AnalysisSourceHint;
  sourceContext?: import("./types").AnalyzeSourceContext;
  modeRouting?: import("./mode-routing").ModeRoutingResult;
};

export function prepareAnalysisIntelligence(
  rawText: string,
  selectedMode: TextAnalysisMode,
  options?: PrepareAnalysisIntelligenceOptions,
): AnalysisIntelligenceContext {
  const cleaned = cleanText(rawText);
  const isYoutubeTranscript =
    options?.sourceHint === "youtube" ||
    options?.sourceContext?.sourceKind === "youtube";
  const isPresentation =
    options?.sourceHint === "presentation" ||
    options?.sourceContext?.sourceKind === "presentation";
  const presentationContext =
    options?.sourceContext?.sourceKind === "presentation"
      ? options.sourceContext
      : undefined;

  const profile = profileDocument(cleaned, selectedMode, {
    isWebArticle: options?.sourceHint === "url",
    isYoutubeTranscript,
    isPresentation,
    slideTitles: presentationContext?.detectedSlideTitles,
  });
  const knowledgeLayer = buildKnowledgeLayer(cleaned, profile, {
    presentationContext,
  });
  const preliminaryBudget = estimateTokenBudget(cleaned.length, cleaned.length);
  const adaptivePlan = createAdaptiveAnalysisPlan(
    cleaned.length,
    profile,
    selectedMode,
    preliminaryBudget,
    options?.modeRouting?.outputDepthHint,
  );

  const { compactedCharacterCount, userPrompt } = compactPromptInput(
    cleaned,
    profile,
    knowledgeLayer,
    adaptivePlan,
    {
      isYoutubeTranscript,
      isPresentation,
      sourceContext: options?.sourceContext,
      analysisMode: selectedMode,
    },
  );

  const tokenBudget = estimateTokenBudget(cleaned.length, compactedCharacterCount);

  return {
    profile,
    knowledgeLayer,
    knowledgeLayerSummary: summarizeKnowledgeLayer(knowledgeLayer),
    tokenBudget,
    adaptivePlan,
    compactedUserPrompt: userPrompt,
    analyzeSource: options?.sourceContext,
  };
}
