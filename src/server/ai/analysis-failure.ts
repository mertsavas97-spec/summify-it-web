/**
 * SERVER ONLY — classify and log analysis provider failures (no secrets in output).
 */

import { devError, devLog } from "@/server/logging";
import { AnalysisValidationError } from "./validate-response";
import { GroqProviderError } from "./providers/groq";
import { GeminiProviderError } from "./providers/gemini";

export type AnalysisProviderName = "groq" | "gemini";

export type FailureStage = "provider" | "parse" | "validate" | "normalize";

export type ProviderAttemptRecord = {
  provider: AnalysisProviderName;
  stage: FailureStage;
  reason: string;
  message: string;
};

export type AnalyzeRunContext = {
  selectedMode: string;
  pipelineType: string;
  estimatedPromptChars: number;
  estimatedInputTokens: number;
  tokenRisk: string;
  documentTypeGuess: string;
  fallbackAttempted: boolean;
};

const API_KEY_PATTERN = /\b(sk-[a-zA-Z0-9_-]{10,}|AIza[a-zA-Z0-9_-]{10,})\b/g;

export function sanitizeFailureMessage(message: string): string {
  return message.replace(API_KEY_PATTERN, "[redacted]").slice(0, 280);
}

/** Heuristic: model output cut off before closing JSON. */
export function looksLikeTruncatedResponse(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 80) return false;
  if (!trimmed.includes("{")) return false;

  const openBraces = (trimmed.match(/\{/g) ?? []).length;
  const closeBraces = (trimmed.match(/\}/g) ?? []).length;
  if (openBraces > closeBraces) return true;

  if (trimmed.length > 400 && !trimmed.endsWith("}")) return true;

  return false;
}

function prefixReason(provider: AnalysisProviderName, suffix: string): string {
  return `${provider}_${suffix}`;
}

export function classifyProviderFailure(
  provider: AnalysisProviderName,
  error: unknown,
): ProviderAttemptRecord {
  if (error instanceof GroqProviderError || error instanceof GeminiProviderError) {
    const msg = sanitizeFailureMessage(error.message);
    if (/timed out/i.test(msg)) {
      return {
        provider,
        stage: "provider",
        reason: prefixReason(provider, "timeout"),
        message: msg,
      };
    }
    if (error instanceof GroqProviderError && error.status === 429) {
      return {
        provider,
        stage: "provider",
        reason: prefixReason(provider, "rate_limit"),
        message: msg,
      };
    }
    if (/empty response/i.test(msg)) {
      return {
        provider,
        stage: "provider",
        reason: prefixReason(provider, "empty_response"),
        message: msg,
      };
    }
    return {
      provider,
      stage: "provider",
      reason: prefixReason(provider, "provider_failed"),
      message: msg,
    };
  }

  const msg = sanitizeFailureMessage(
    error instanceof Error ? error.message : String(error),
  );
  return {
    provider,
    stage: "provider",
    reason: prefixReason(provider, "provider_failed"),
    message: msg,
  };
}

export function classifyValidationFailure(
  provider: AnalysisProviderName,
  error: unknown,
  rawResponse?: string,
): ProviderAttemptRecord {
  if (error instanceof AnalysisValidationError) {
    const msg = sanitizeFailureMessage(error.message);
    const truncated = rawResponse ? looksLikeTruncatedResponse(rawResponse) : false;

    if (truncated) {
      return {
        provider,
        stage: "parse",
        reason: "response_truncated",
        message: "Model response appears truncated before valid JSON completed.",
      };
    }

    if (error.code === "json_parse_failed") {
      return {
        provider,
        stage: "parse",
        reason: prefixReason(provider, "json_parse_failed"),
        message: msg,
      };
    }

    if (error.code === "normalization_failed") {
      return {
        provider,
        stage: "normalize",
        reason: prefixReason(provider, "normalization_failed"),
        message: msg,
      };
    }

    return {
      provider,
      stage: "validate",
      reason: prefixReason(provider, "schema_validation_failed"),
      message: msg,
    };
  }

  const msg = sanitizeFailureMessage(
    error instanceof Error ? error.message : String(error),
  );
  return {
    provider,
    stage: "validate",
    reason: prefixReason(provider, "schema_validation_failed"),
    message: msg,
  };
}

export function pickPrimaryFailureReason(
  attempts: ProviderAttemptRecord[],
): string {
  if (attempts.length === 0) return "both_providers_exhausted";
  return attempts[attempts.length - 1].reason;
}

export function logAnalysisRunStart(context: AnalyzeRunContext): void {
  devLog("[summify.analyze] run_start", context);
}

export function logAnalysisRunSuccess(
  context: AnalyzeRunContext & {
    providerUsed: AnalysisProviderName;
    fallbackUsed: boolean;
  },
): void {
  devLog("[summify.analyze] run_success", context);
}

export function logProviderAttempt(
  context: AnalyzeRunContext,
  attempt: ProviderAttemptRecord,
): void {
  devError("[summify.analyze] provider_attempt_failed", {
    ...context,
    attempt,
  });
}

export function logAnalysisRunFailure(
  context: AnalyzeRunContext,
  failureReason: string,
  attempts: ProviderAttemptRecord[],
): void {
  devError("[summify.analyze] run_failed", {
    ...context,
    failureReason,
    attempts,
  });
}
