/** Provider names for API usage tracking. */
export type ApiProvider =
  | "groq"
  | "gemini"
  | "aws_polly"
  | "rapidapi"
  | "supabase"
  | "formspree"
  | "polar"
  | "google_analytics"
  | "auth"
  | "vercel"
  | "other";

/** API usage event for tracking provider calls. */
export interface ApiUsageEvent {
  id?: string;
  provider: ApiProvider;
  operation: string;
  model?: string | null;
  userId?: string | null;
  analysisId?: string | null;
  requestUnits?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  characters?: number | null;
  estimatedCostUsd?: number | null;
  success: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

/** Provider configuration status. */
export interface ProviderConfigStatus {
  provider: ApiProvider;
  name: string;
  status: "configured" | "missing_env" | "warning" | "error" | "optional_missing";
  optional: boolean;
  requiredEnvVars: Array<{ name: string; present: boolean }>;
  lastSuccess?: string | null;
  lastError?: string | null;
  lastErrorTime?: string | null;
  lastChecked: string;
}

/** Usage rollup for a provider. */
export interface ProviderUsageRollup {
  provider: ApiProvider;
  callsToday: number;
  calls7d: number;
  failures7d: number;
  estimatedMonthlyCostUsd: number | null;
  lastSuccess?: string | null;
  lastError?: string | null;
}

/** Quota information for a provider. */
export interface ProviderQuotaInfo {
  provider: ApiProvider;
  tier?: string | null;
  quotaRemaining?: number | null;
  quotaTotal?: number | null;
  quotaReset?: string | null;
  note?: string;
}

/** Health check response for admin dashboard. */
export interface ApiHealthResponse {
  providers: Array<{
    config: ProviderConfigStatus;
    usage: ProviderUsageRollup | null;
    quota: ProviderQuotaInfo | null;
  }>;
  overview: {
    totalProviders: number;
    configuredProviders: number;
    callsToday: number;
    failuresToday: number;
    estimatedMonthlyCostUsd: number | null;
    highestUsageProvider: string | null;
  };
  recentEvents: ApiUsageEvent[];
  lastUpdated: string;
}

/** Pricing configuration for cost estimation. */
export interface ProviderPricing {
  perMillionInputTokens?: number;
  perMillionOutputTokens?: number;
  perMillionCharacters?: number;
  perRequest?: number;
  currency?: string;
  note?: string;
}

/** Known pricing for providers (approximate). */
export const PROVIDER_PRICING: Record<string, ProviderPricing> = {
  groq: {
    // Groq pricing varies by model; using approximate Llama 3 pricing
    perMillionInputTokens: 0.2,
    perMillionOutputTokens: 0.2,
    currency: "USD",
    note: "Approximate Llama 3 70B pricing",
  },
  aws_polly: {
    // AWS Polly Standard voices
    perMillionCharacters: 4.0,
    currency: "USD",
    note: "AWS Polly Standard voice pricing",
  },
  aws_polly_neural: {
    // AWS Polly Neural voices
    perMillionCharacters: 16.0,
    currency: "USD",
    note: "AWS Polly Neural voice pricing",
  },
  rapidapi_youtube: {
    perRequest: 0.01,
    currency: "USD",
    note: "Approximate RapidAPI YouTube extraction",
  },
  rapidapi_article: {
    perRequest: 0.01,
    currency: "USD",
    note: "Approximate RapidAPI article extraction",
  },
  rapidapi: {
    perRequest: 0.01,
    currency: "USD",
    note: "Approximate RapidAPI extraction request",
  },
};

/** Estimate cost for an API usage event. */
export function estimateCost(event: Omit<ApiUsageEvent, "id" | "createdAt">): number | null {
  const pricing = PROVIDER_PRICING[event.provider];
  if (!pricing) return null;

  let cost = 0;

  if (event.inputTokens && pricing.perMillionInputTokens) {
    cost += (event.inputTokens / 1_000_000) * pricing.perMillionInputTokens;
  }
  if (event.outputTokens && pricing.perMillionOutputTokens) {
    cost += (event.outputTokens / 1_000_000) * pricing.perMillionOutputTokens;
  }
  if (event.characters && pricing.perMillionCharacters) {
    cost += (event.characters / 1_000_000) * pricing.perMillionCharacters;
  }
  if (event.requestUnits && pricing.perRequest) {
    cost += event.requestUnits * pricing.perRequest;
  }

  return cost > 0 ? Math.round(cost * 10000) / 10000 : null;
}
