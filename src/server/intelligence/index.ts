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
import { buildCognitionContext } from "@/lib/cognition/buildContext";
import type { CognitionSourceKind } from "@/types/cognition";
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

  const modeId =
    options?.modeRouting?.intelligenceModeId ??
    (selectedMode === "executive"
      ? "executive-brief"
      : selectedMode === "academic"
        ? "the-student"
        : selectedMode === "creator"
          ? "the-creator"
          : "contract-analyzer");

  const cognitionSourceKind: CognitionSourceKind =
    options?.sourceHint === "youtube" || isYoutubeTranscript
      ? "youtube"
      : options?.sourceHint === "presentation" || isPresentation
        ? "presentation"
        : options?.sourceHint === "url"
          ? "url"
          : options?.sourceHint === "file"
            ? "file"
            : "text";

  const cognition = buildCognitionContext({
    modeId,
    sourceKind: cognitionSourceKind,
    title: knowledgeLayer.titleGuess,
    textSnippet: cleaned,
    heuristicTypeGuess: profile.documentTypeGuess,
    complexityHint: profile.complexity,
  });

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
      cognitionPromptBlock: cognition.promptBlock,
    },
  );

  const tokenBudget = estimateTokenBudget(cleaned.length, compactedCharacterCount);

  return {
    profile,
    knowledgeLayer,
    knowledgeLayerSummary: summarizeKnowledgeLayer(knowledgeLayer),
    tokenBudget,
    adaptivePlan,
    cleanedText: cleaned,
    compactedUserPrompt: userPrompt,
    analyzeSource: options?.sourceContext,
    cognitionPromptBlock: cognition.promptBlock,
    personaAdaptivePlan: cognition.personaAdaptivePlan,
    cognition: {
      domain: cognition.documentProfile.domain,
      personaId: cognition.personaBrain.id,
      personaFamily: cognition.personaBrain.family,
      primaryDimensions: cognition.dimensions.primaryDimensions,
      learnCardDensity: cognition.learnCardBias.maxDensity,
      learnCardProviderEmphasis: cognition.learnCardBias.providerTypeEmphasis,
      debugSummary: cognition.debugSummary,
      adaptationLabel: cognition.personaAdaptivePlan.adaptationLabel,
      adaptivePlanId: cognition.personaAdaptivePlan.planId,
      structureFamily: cognition.personaAdaptivePlan.structureFamily,
      sectionTitles: cognition.personaAdaptivePlan.sections.map((s) => s.title),
      suppressedDefaultSections: cognition.personaAdaptivePlan.suppressedDefaultSections,
      learnCardStrategySummary: cognition.personaAdaptivePlan.learnCardStrategy.summary,
    },
  };
}
