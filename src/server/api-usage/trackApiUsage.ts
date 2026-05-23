/**
 * API Usage Tracking — Server-side logging for external API calls.
 *
 * Important: Tracking failures must never break user-facing requests.
 * All logging is fire-and-forget with safe error handling.
 */

import { createServiceClient } from "@/lib/supabase/serviceClient";
import { estimateCost } from "@/types/api-usage";
import type { ApiProvider, ApiUsageEvent } from "@/types/api-usage";

/** Input for tracking an API usage event. */
export type TrackApiUsageInput = Omit<
  ApiUsageEvent,
  "id" | "createdAt" | "estimatedCostUsd"
> & {
  /** Auto-estimate cost if not provided. */
  autoEstimateCost?: boolean;
};

/**
 * Track an API usage event.
 * Fire-and-forget — never throws or blocks user requests.
 */
export async function trackApiUsage(input: TrackApiUsageInput): Promise<void> {
  try {
    const supabase = createServiceClient();

    const estimatedCost =
      input.autoEstimateCost !== false
        ? estimateCost(input)
        : null;

    const event: Omit<ApiUsageEvent, "id" | "createdAt"> = {
      provider: input.provider,
      operation: input.operation,
      model: input.model ?? null,
      userId: input.userId ?? null,
      analysisId: input.analysisId ?? null,
      requestUnits: input.requestUnits ?? null,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      characters: input.characters ?? null,
      estimatedCostUsd: estimatedCost,
      success: input.success,
      errorMessage: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    };

    // Fire-and-forget insert — don't await, don't block
    supabase.from("api_usage_events").insert(event).then(({ error }: { error: { message: string } | null }) => {
      if (error) {
        // Log but never throw
        console.warn("[api-usage] failed to log event", {
          provider: input.provider,
          operation: input.operation,
          error: error.message,
        });
      }
    });
  } catch {
    // Silently fail — tracking must never break user flow
  }
}

/**
 * Track a successful API call with optional token/character counts.
 */
export async function trackApiSuccess(
  provider: ApiProvider,
  operation: string,
  options: Partial<{
    model: string;
    userId: string;
    analysisId: string;
    inputTokens: number;
    outputTokens: number;
    characters: number;
    requestUnits: number;
    metadata: Record<string, unknown>;
    autoEstimateCost: boolean;
  }> = {},
): Promise<void> {
  await trackApiUsage({
    provider,
    operation,
    success: true,
    model: options.model ?? null,
    userId: options.userId ?? null,
    analysisId: options.analysisId ?? null,
    inputTokens: options.inputTokens ?? null,
    outputTokens: options.outputTokens ?? null,
    characters: options.characters ?? null,
    requestUnits: options.requestUnits ?? null,
    metadata: options.metadata ?? {},
    autoEstimateCost: options.autoEstimateCost ?? true,
  });
}

/**
 * Track a failed API call with error message.
 */
export async function trackApiError(
  provider: ApiProvider,
  operation: string,
  options: Partial<{
    model: string;
    userId: string;
    analysisId: string;
    errorMessage: string;
    metadata: Record<string, unknown>;
  }> = {},
): Promise<void> {
  await trackApiUsage({
    provider,
    operation,
    success: false,
    model: options.model ?? null,
    userId: options.userId ?? null,
    analysisId: options.analysisId ?? null,
    errorMessage: options.errorMessage ?? null,
    metadata: options.metadata ?? {},
    autoEstimateCost: false,
  });
}