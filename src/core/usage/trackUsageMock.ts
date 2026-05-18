import type { UsageEvent, UsageEventType } from "@/core/types";

function generateEventId(): string {
  return `usage_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type TrackUsageParams = {
  userId: string;
  type: UsageEventType;
  units?: number;
  metadata?: UsageEvent["metadata"];
};

/** In-memory usage log — replace with Postgres / analytics warehouse. */
const mockUsageLog: UsageEvent[] = [];

/**
 * Mock usage tracking for billing gates and analytics.
 */
export function trackUsageMock(params: TrackUsageParams): UsageEvent {
  const event: UsageEvent = {
    id: generateEventId(),
    userId: params.userId,
    type: params.type,
    units: params.units ?? 1,
    timestamp: new Date().toISOString(),
    metadata: params.metadata,
  };

  mockUsageLog.push(event);
  return event;
}

/** Returns recent mock events (dashboard preview). */
export function getRecentUsageMock(limit = 10): UsageEvent[] {
  return mockUsageLog.slice(-limit).reverse();
}
