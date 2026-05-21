/**
 * @deprecated Use `trackProductEvent` from `./trackProductEvent`.
 * Kept for existing import paths.
 */
import { trackProductEvent, trackProductEventNonBlocking } from "./trackProductEvent";

export type TrackUsageEventInput = {
  userId?: string | null;
  eventType: string;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  providerUsed?: string | null;
  plan?: string | null;
  failureStage?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  sessionId?: string | null;
  trustedServer?: boolean;
  insertViaServiceRole?: boolean;
};

export async function trackUsageEvent(input: TrackUsageEventInput): Promise<void> {
  await trackProductEvent({
    eventType: input.eventType as import("@/lib/analytics/productEventTypes").ProductEventType,
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType: input.sourceKind,
    intelligenceMode: input.intelligenceMode,
    plan: input.plan,
    failureStage: input.failureStage,
    metadata: input.metadata,
    trustedServer: input.trustedServer,
    insertViaServiceRole: input.insertViaServiceRole,
  });
}

export function trackUsageEventNonBlocking(input: TrackUsageEventInput): void {
  trackProductEventNonBlocking({
    eventType: input.eventType as import("@/lib/analytics/productEventTypes").ProductEventType,
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType: input.sourceKind,
    intelligenceMode: input.intelligenceMode,
    plan: input.plan,
    failureStage: input.failureStage,
    metadata: input.metadata,
    trustedServer: input.trustedServer,
    insertViaServiceRole: input.insertViaServiceRole,
  });
}

export function trackAnalysisCompleted(input: {
  userId?: string | null;
  sessionId?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  plan?: string | null;
  trustedServer?: boolean;
}): void {
  trackProductEventNonBlocking({
    eventType: "analysis_completed",
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType: input.sourceKind,
    intelligenceMode: input.intelligenceMode,
    plan: input.plan,
    success: true,
    trustedServer: input.trustedServer,
  });
}

export function trackAnalysisFailed(input: {
  userId?: string | null;
  sessionId?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  plan?: string | null;
  failureStage?: string | null;
  trustedServer?: boolean;
}): void {
  trackProductEventNonBlocking({
    eventType: "analysis_failed",
    userId: input.userId,
    sessionId: input.sessionId,
    sourceType: input.sourceKind,
    intelligenceMode: input.intelligenceMode,
    plan: input.plan,
    success: false,
    failureStage: input.failureStage,
    trustedServer: input.trustedServer,
  });
}
