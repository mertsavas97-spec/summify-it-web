/**
 * Client-safe labels for dev-only analyze failure reasons.
 */

export function formatFailureReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    no_providers_configured: "No AI providers configured",
    both_providers_exhausted: "Groq and Gemini both failed",
    response_truncated: "Response truncated (incomplete JSON)",
    provider_timeout: "Provider timeout",
    groq_timeout: "Groq: timeout",
    gemini_timeout: "Gemini: timeout",
    groq_rate_limit: "Groq: rate limited",
    groq_empty_response: "Groq: empty response",
    gemini_empty_response: "Gemini: empty response",
    groq_provider_failed: "Groq: request failed",
    gemini_provider_failed: "Gemini: request failed",
    groq_json_parse_failed: "Groq: JSON parse failed",
    gemini_json_parse_failed: "Gemini: JSON parse failed",
    groq_schema_validation_failed: "Groq: schema validation failed",
    gemini_schema_validation_failed: "Gemini: schema validation failed",
    groq_normalization_failed: "Groq: normalization failed",
    gemini_normalization_failed: "Gemini: normalization failed",
  };

  return labels[reason] ?? reason.replace(/_/g, " ");
}

export function formatAttemptSummary(
  attempts: { provider: string; reason: string }[],
): string {
  if (attempts.length === 0) return "No provider attempts recorded";
  return attempts
    .map((a) => `${a.provider}: ${formatFailureReasonLabel(a.reason)}`)
    .join(" · ");
}
