import { AI_CONFIG } from "@/server/ai/config";
import type { TokenBudget, TokenRiskLevel } from "./types";

const CHARS_PER_TOKEN = 4;

function riskFromEstimatedTokens(estimatedInputTokens: number): TokenRiskLevel {
  if (estimatedInputTokens <= 6_000) return "low";
  if (estimatedInputTokens <= 12_000) return "medium";
  return "high";
}

/**
 * Approximate token budget from character counts (chars / 4).
 */
export function estimateTokenBudget(
  sourceCharacterCount: number,
  compactedCharacterCount: number,
): TokenBudget {
  const estimatedInputTokens = Math.ceil(compactedCharacterCount / CHARS_PER_TOKEN);

  return {
    estimatedInputTokens,
    estimatedSourceCharacters: sourceCharacterCount,
    inputBudgetTokens: Math.ceil(AI_CONFIG.input.maxChars / CHARS_PER_TOKEN),
    outputBudgetTokens: AI_CONFIG.maxOutputTokens,
    riskLevel: riskFromEstimatedTokens(estimatedInputTokens),
  };
}
