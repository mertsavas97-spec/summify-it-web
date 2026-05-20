import type { TextAnalysisMode } from "@/server/ai/schemas";
import { AI_CONFIG } from "@/server/ai/config";
import {
  CHUNKED_ANALYSIS_SEGMENT_CHARS,
  type PlanLimits,
} from "@/lib/plans/planLimits";
import type { OutputDepthHint } from "@/types/modes";
import type {
  AdaptiveAnalysisPlan,
  DocumentProfile,
  PipelineType,
  TokenBudget,
} from "./types";

const SHORT_CHAR_THRESHOLD = 4_000;
const MEDIUM_CHAR_THRESHOLD = 12_000;

function pipelineInputCaps(planLimits?: PlanLimits): Record<PipelineType, number> {
  const segment = CHUNKED_ANALYSIS_SEGMENT_CHARS;
  const chunked = planLimits?.supportsChunkedAnalysis ?? false;
  return {
    short_direct: chunked ? segment : Math.min(segment, planLimits?.maxCharacters ?? segment),
    medium_compacted: chunked ? segment : 14_000,
    long_preview: chunked ? segment : 9_000,
  };
}

function resolvePipelineType(chars: number, profile: DocumentProfile): PipelineType {
  if (chars <= SHORT_CHAR_THRESHOLD && profile.complexity !== "high") {
    return "short_direct";
  }
  if (chars <= MEDIUM_CHAR_THRESHOLD || !profile.needsChunking) {
    return "medium_compacted";
  }
  return "long_preview";
}

function resolveLearnDepth(
  profile: DocumentProfile,
  pipelineType: PipelineType,
): AdaptiveAnalysisPlan["learnDepth"] {
  if (pipelineType === "long_preview") return "quick";
  if (profile.complexity === "high") return "standard";
  return profile.complexity === "low" ? "deep" : "standard";
}

function resolveOutputDepth(
  pipelineType: PipelineType,
  mode: TextAnalysisMode,
  depthHint?: OutputDepthHint,
): AdaptiveAnalysisPlan["outputDepth"] {
  if (pipelineType === "long_preview") return "brief";
  if (depthHint) return depthHint;
  if (mode === "executive") return "standard";
  if (mode === "academic" || mode === "legal") return "detailed";
  return "standard";
}

/**
 * Chooses compaction strategy and output shape before provider calls.
 */
export function createAdaptiveAnalysisPlan(
  characterCount: number,
  profile: DocumentProfile,
  selectedMode: TextAnalysisMode,
  tokenBudget: TokenBudget,
  outputDepthHint?: OutputDepthHint,
  planLimits?: PlanLimits,
): AdaptiveAnalysisPlan {
  let pipelineType = resolvePipelineType(characterCount, profile);

  if (planLimits?.supportsChunkedAnalysis && characterCount > CHUNKED_ANALYSIS_SEGMENT_CHARS) {
    pipelineType = "long_preview";
  } else if (tokenBudget.riskLevel === "high" && pipelineType === "short_direct") {
    pipelineType = "medium_compacted";
  }

  const caps = pipelineInputCaps(planLimits);
  const maxInputCharacters = Math.min(
    caps[pipelineType],
    planLimits?.maxCharacters ?? AI_CONFIG.input.maxChars,
    CHUNKED_ANALYSIS_SEGMENT_CHARS,
  );

  return {
    pipelineType,
    learnDepth: resolveLearnDepth(profile, pipelineType),
    maxInputCharacters,
    outputDepth: resolveOutputDepth(pipelineType, selectedMode, outputDepthHint),
  };
}
