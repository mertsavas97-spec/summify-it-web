/**
 * Resilient learn intelligence — stage failures must not break analysis.
 */

import type { AnalysisResult } from "@/server/ai/schemas";
import { devLog } from "@/server/logging";
import type { BuildLearnIntelligenceOptions, BuildLearnIntelligenceResult } from "./types";
import { resolveLearnCardTargets } from "./learnCardTargets";
import { finalValidateLearnCards } from "./learnTitleQuality";
import type { LearnCardOutput } from "@/types/text-analysis";

export type LearnPipelineFailure = {
  stage?: string;
  message?: string;
};

function fallbackLearnCards(result: AnalysisResult, min = 6): LearnCardOutput[] {
  const out: LearnCardOutput[] = [];

  for (const card of result.learnCards ?? []) {
    if (card.title?.trim() && card.content?.trim()) {
      out.push({ ...card });
    }
  }

  for (const insight of result.keyInsights ?? []) {
    if (out.length >= min) break;
    const trimmed = insight.trim();
    if (trimmed.length < 30) continue;
    const ents = trimmed.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/);
    const subject = ents?.[0] ?? "this topic";
    out.push({
      type: "concept",
      title: `Why does ${subject} matter?`.slice(0, 110),
      content: trimmed.slice(0, 380),
      learnPattern: "fact_recall",
    });
  }

  if (out.length < 3 && result.summary.length > 80) {
    const sentence = result.summary.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (sentence) {
      out.push({
        type: "why_it_matters",
        title: "What is the central argument of this document?",
        content: sentence.slice(0, 380),
      });
    }
  }

  return finalValidateLearnCards(out.slice(0, 12), {
    documentTitle: result.title,
  }).cards;
}

/**
 * Run core build with per-stage isolation; returns fallback cards on total failure.
 */
export function runSafeLearnBuild(
  runBuild: () => BuildLearnIntelligenceResult,
  fallbackInput: {
    result: AnalysisResult;
    options: BuildLearnIntelligenceOptions;
  },
  failure: LearnPipelineFailure,
): BuildLearnIntelligenceResult {
  try {
    return runBuild();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failure.stage = failure.stage ?? "buildLearnIntelligence";
    failure.message = message;

    if (process.env.NODE_ENV === "development") {
      devLog("[learn.pipeline.failure]", failure);
      console.error("[learn.pipeline.failure]", error);
    }

    const range = resolveLearnCardTargets({
      complexity: fallbackInput.options.complexity,
      summary: fallbackInput.result.summary,
      keyInsightCount: fallbackInput.result.keyInsights.length,
      isPresentation: fallbackInput.options.isPresentation,
      isYoutube: fallbackInput.options.isYoutubeTranscript,
    });

    const learnCards = fallbackLearnCards(fallbackInput.result, range.min);

    return {
      learnCards,
      meta: {
        candidateCount: 0,
        selectedCount: learnCards.length,
        complexity: fallbackInput.options.complexity,
        mode: fallbackInput.options.mode,
        ...(process.env.NODE_ENV === "development"
          ? {
              learnFailureStage: failure.stage,
              learnFailureMessage: failure.message,
            }
          : {}),
      },
    };
  }
}

export function runLearnStage<T>(
  stage: string,
  fn: () => T,
  fallback: T,
  failure: LearnPipelineFailure,
): T {
  try {
    return fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failure.stage = stage;
    failure.message = message;
    if (process.env.NODE_ENV === "development") {
      devLog(`[learn.stage.${stage}]`, { message });
      console.error(`[learn.stage.${stage}]`, error);
    }
    return fallback;
  }
}
