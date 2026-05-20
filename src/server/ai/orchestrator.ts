/**
 * SERVER ONLY — orchestrates Groq (primary) and Gemini (fallback).
 * API keys must remain server-side; never import in client components.
 */

import { callGroqAnalysis } from "./providers/groq";
import { callGeminiAnalysis } from "./providers/gemini";
import { parseAndValidateAnalysisResult } from "./validate-response";
import type { AnalysisResult, TextAnalysisMode } from "./schemas";
import {
  prepareAnalysisIntelligence,
  type AnalysisIntelligenceContext,
  type AnalysisSourceHint,
  type AnalyzeSourceContext,
} from "@/server/intelligence";
import type { ModeRoutingResult } from "@/server/intelligence/mode-routing";
import { USER_MESSAGES } from "@/lib/user-messages";
import { devWarn } from "@/server/logging";
import { buildLearnIntelligence } from "@/server/learn";
import { resolveLearnCardTargets } from "@/server/learn/learnCardTargets";
import { generateLearnCardsForAnalysis } from "./generateLearnCards";
import { applyAdaptivePlanPostProcess } from "@/lib/cognition/postProcessAnalysis";
import {
  classifyProviderFailure,
  classifyValidationFailure,
  logAnalysisRunFailure,
  logAnalysisRunStart,
  logAnalysisRunSuccess,
  logProviderAttempt,
  looksLikeTruncatedResponse,
  pickPrimaryFailureReason,
  type AnalysisProviderName,
  type AnalyzeRunContext,
  type ProviderAttemptRecord,
} from "./analysis-failure";

export type OrchestratorSuccess = {
  result: AnalysisResult;
  providerUsed: "groq" | "gemini";
  fallbackUsed: boolean;
  intelligence: AnalysisIntelligenceContext;
};

export class AnalysisOrchestratorError extends Error {
  readonly failureReason: string;
  readonly attempts: readonly ProviderAttemptRecord[];
  readonly intelligence?: AnalysisIntelligenceContext;

  constructor(
    message: string,
    failureReason: string,
    attempts: ProviderAttemptRecord[],
    intelligence?: AnalysisIntelligenceContext,
  ) {
    super(message);
    this.name = "AnalysisOrchestratorError";
    this.failureReason = failureReason;
    this.attempts = attempts;
    this.intelligence = intelligence;
  }
}

function applyLearnIntelligence(
  result: AnalysisResult,
  intelligence: AnalysisIntelligenceContext,
  mode: TextAnalysisMode,
  sourceContext?: AnalyzeSourceContext,
  modeRouting?: ModeRoutingResult,
): AnalysisResult {
  const plan = intelligence.personaAdaptivePlan;
  let learnCards = result.learnCards ?? [];
  let learnMeta: import("@/server/learn/types").LearnIntelligenceMeta = {
    candidateCount: learnCards.length,
    selectedCount: learnCards.length,
    complexity: intelligence.profile.complexity,
    mode,
  };

  try {
    const built = buildLearnIntelligence(result, {
      mode,
      complexity: intelligence.profile.complexity,
      isYoutubeTranscript: sourceContext?.sourceKind === "youtube",
      isPresentation: sourceContext?.sourceKind === "presentation",
      learnWeighting: modeRouting?.learnWeighting,
      intelligenceModeId: modeRouting?.intelligenceModeId,
      suppressRiskActionLearnSynthesis:
        plan?.learnCardStrategy.suppressRiskActionSynthesis ?? false,
      suppressMisconceptionUnlessExplicit:
        plan?.learnCardStrategy.suppressMisconceptionUnlessExplicit ?? false,
      allowedLearnSourceSections: plan?.allowedLearnSourceSections,
      blockedLearnSourceSections: plan?.blockedLearnSourceSections,
      personaAdaptivePlan: plan,
      extractedText: intelligence.compactedUserPrompt?.slice(0, 24000),
    });
    learnCards = built.learnCards;
    learnMeta = built.meta;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV === "development") {
      console.error("[learn.applyLearnIntelligence]", error);
      learnMeta = {
        ...learnMeta,
        learnFailureStage: "applyLearnIntelligence",
        learnFailureMessage: message,
      };
    }
    learnCards = result.learnCards?.length ? result.learnCards : learnCards;
  }
  if (intelligence.cognition) {
    if (learnMeta.adaptiveLearn) {
      intelligence.cognition.adaptiveLearn = learnMeta.adaptiveLearn;
    } else if (
      learnMeta.learnStrategy ||
      learnMeta.learnCardQuality ||
      learnMeta.learnProgression ||
      learnMeta.sourceTrace ||
      learnMeta.knowledgeStructure ||
      learnMeta.knowledgeCompression ||
      learnMeta.memoryAnchors ||
      learnMeta.multiFormatLearn
    ) {
      intelligence.cognition.adaptiveLearn = {
        adaptiveLearnProfileId: "quality_only",
        learnGroups: [],
        relationshipCount: 0,
        difficultyStats: {
          low: 0,
          medium: 0,
          high: 0,
          avgMemoryWeight: 0,
          avgConceptualDensity: 0,
        },
        learnCardQuality: learnMeta.learnCardQuality,
        learnStrategy: learnMeta.learnStrategy,
        learnProgression: learnMeta.learnProgression,
        sourceTrace: learnMeta.sourceTrace,
        knowledgeStructure: learnMeta.knowledgeStructure,
        knowledgeCompression: learnMeta.knowledgeCompression,
        memoryAnchors: learnMeta.memoryAnchors,
        multiFormatLearn: learnMeta.multiFormatLearn,
      };
    }
  }
  return { ...result, learnCards };
}

function buildRunContext(
  mode: TextAnalysisMode,
  intelligence: AnalysisIntelligenceContext,
  fallbackAttempted: boolean,
): AnalyzeRunContext {
  return {
    selectedMode: mode,
    pipelineType: intelligence.adaptivePlan.pipelineType,
    estimatedPromptChars: intelligence.compactedUserPrompt.length,
    estimatedInputTokens: intelligence.tokenBudget.estimatedInputTokens,
    tokenRisk: intelligence.tokenBudget.riskLevel,
    documentTypeGuess: intelligence.profile.documentTypeGuess,
    fallbackAttempted,
  };
}

async function attemptProvider(
  provider: AnalysisProviderName,
  intelligence: AnalysisIntelligenceContext,
  mode: TextAnalysisMode,
  runContext: AnalyzeRunContext,
  attempts: ProviderAttemptRecord[],
  modeRouting?: ModeRoutingResult,
): Promise<AnalysisResult | null> {
  let raw: string | undefined;

  const isYoutubeTranscript =
    intelligence.analyzeSource?.sourceKind === "youtube";
  const isPresentation =
    intelligence.analyzeSource?.sourceKind === "presentation";

  try {
    raw =
      provider === "groq"
        ? await callGroqAnalysis(
            intelligence.compactedUserPrompt,
            mode,
            intelligence.adaptivePlan,
            {
              isYoutubeTranscript,
              isPresentation,
              intelligenceModeLabel: modeRouting?.label,
              modePromptAdjunct: modeRouting?.promptAdjunct,
              cognitionPromptBlock: intelligence.cognitionPromptBlock,
            },
          )
        : await callGeminiAnalysis(
            intelligence.compactedUserPrompt,
            mode,
            intelligence.adaptivePlan,
            {
              isYoutubeTranscript,
              isPresentation,
              intelligenceModeLabel: modeRouting?.label,
              modePromptAdjunct: modeRouting?.promptAdjunct,
              cognitionPromptBlock: intelligence.cognitionPromptBlock,
            },
          );
  } catch (error) {
    const record = classifyProviderFailure(provider, error);
    attempts.push(record);
    logProviderAttempt(runContext, record);
    return null;
  }

  if (looksLikeTruncatedResponse(raw)) {
    devWarn(`[summify.analyze] ${provider} response may be truncated`, {
      responseChars: raw.length,
      mode: runContext.selectedMode,
      pipelineType: runContext.pipelineType,
    });
  }

  try {
    const parsed = parseAndValidateAnalysisResult(raw, { mode });
    const postProcessed = applyAdaptivePlanPostProcess(parsed, intelligence.personaAdaptivePlan);

    const range = resolveLearnCardTargets({
      complexity: intelligence.profile.complexity,
      summary: postProcessed.summary,
      keyInsightCount: postProcessed.keyInsights.length,
      isPresentation,
      isYoutube: isYoutubeTranscript,
    });

    const generatedLearnCards = await generateLearnCardsForAnalysis({
      provider,
      compactedContent: intelligence.cleanedText,
      cardCount: range.target,
      documentTitle: postProcessed.title,
      isYoutube: isYoutubeTranscript,
      isPresentation,
      isWebArticle: /web|article|url/i.test(intelligence.profile.documentTypeGuess ?? ""),
      documentTypeGuess: intelligence.profile.documentTypeGuess,
    });

    const withLearnCards =
      generatedLearnCards.length > 0
        ? { ...postProcessed, learnCards: generatedLearnCards }
        : postProcessed;

    return applyLearnIntelligence(
      withLearnCards,
      intelligence,
      mode,
      intelligence.analyzeSource,
      modeRouting,
    );
  } catch (error) {
    const record = classifyValidationFailure(provider, error, raw);
    attempts.push(record);
    logProviderAttempt(runContext, record);
    return null;
  }
}

/**
 * Run text analysis: Groq first, Gemini on failure or invalid output.
 */
export async function runAnalysisOrchestrator(
  rawText: string,
  mode: TextAnalysisMode,
  sourceHint?: AnalysisSourceHint,
  sourceContext?: AnalyzeSourceContext,
  modeRouting?: ModeRoutingResult,
): Promise<OrchestratorSuccess> {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (!hasGroq && !hasGemini) {
    throw new AnalysisOrchestratorError(
      USER_MESSAGES.analyzeUnavailable,
      "no_providers_configured",
      [],
    );
  }

  const intelligence = prepareAnalysisIntelligence(rawText, mode, {
    sourceHint,
    sourceContext,
    modeRouting,
  });
  const attempts: ProviderAttemptRecord[] = [];

  if (intelligence.tokenBudget.riskLevel === "high") {
    devWarn("[summify.analyze] high_token_risk", {
      estimatedInputTokens: intelligence.tokenBudget.estimatedInputTokens,
    });
  }

  const baseContext = buildRunContext(mode, intelligence, false);
  logAnalysisRunStart(baseContext);

  let groqAttempted = false;

  if (hasGroq) {
    groqAttempted = true;
    const result = await attemptProvider(
      "groq",
      intelligence,
      mode,
      baseContext,
      attempts,
      modeRouting,
    );
    if (result) {
      logAnalysisRunSuccess({
        ...buildRunContext(mode, intelligence, false),
        providerUsed: "groq",
        fallbackUsed: false,
      });
      return { result, providerUsed: "groq", fallbackUsed: false, intelligence };
    }
  }

  if (hasGemini) {
    const geminiContext = buildRunContext(mode, intelligence, groqAttempted);
    const result = await attemptProvider(
      "gemini",
      intelligence,
      mode,
      geminiContext,
      attempts,
      modeRouting,
    );
    if (result) {
      logAnalysisRunSuccess({
        ...geminiContext,
        providerUsed: "gemini",
        fallbackUsed: groqAttempted,
      });
      return {
        result,
        providerUsed: "gemini",
        fallbackUsed: groqAttempted,
        intelligence,
      };
    }
  }

  const failureReason = pickPrimaryFailureReason(attempts);
  const failContext = buildRunContext(mode, intelligence, groqAttempted);
  logAnalysisRunFailure(failContext, failureReason, attempts);

  throw new AnalysisOrchestratorError(
    USER_MESSAGES.analyzeFailed,
    failureReason,
    attempts,
    intelligence,
  );
}
