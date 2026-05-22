/**
 * @deprecated Use `trackProductEvent` or `recordAnalysisAnalytics` instead.
 */
import {
  recordAnalysisCompleted,
  recordAnalysisFailed,
} from "./recordAnalysisAnalytics";
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
    insertViaServiceRole: input.insertViaServiceRole ?? true,
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
    insertViaServiceRole: input.insertViaServiceRole ?? true,
  });
}

export function trackAnalysisCompleted(input: {
  userId?: string | null;
  sessionId?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  plan?: string | null;
  fileType?: string | null;
  analysisId?: string | null;
  charsProcessed?: number;
  pagesProcessed?: number;
}): void {
  void recordAnalysisCompleted({
    userId: input.userId,
    sessionId: input.sessionId,
    planId: input.plan ?? "free",
    intelligenceMode: input.intelligenceMode ?? "unknown",
    sourceHint: undefined,
    fileType: input.fileType ?? input.sourceKind,
    analysisId: input.analysisId,
    charsProcessed: input.charsProcessed,
    pagesProcessed: input.pagesProcessed,
  });
}

export function trackAnalysisFailed(input: {
  userId?: string | null;
  sessionId?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
  plan?: string | null;
  failureStage?: string | null;
  reason?: string;
}): void {
  void recordAnalysisFailed({
    userId: input.userId,
    sessionId: input.sessionId,
    planId: input.plan ?? "free",
    intelligenceMode: input.intelligenceMode ?? "unknown",
    reason: input.reason ?? input.failureStage ?? "unknown",
    fileType: input.sourceKind,
  });
}
