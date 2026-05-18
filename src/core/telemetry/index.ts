import type { PipelineStage } from "@/core/types";

type TelemetryEvent = {
  name: string;
  stage?: PipelineStage;
  documentId?: string;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
};

const mockTelemetryBuffer: TelemetryEvent[] = [];

/**
 * Mock telemetry — replace with PostHog, Datadog, or custom event bus.
 */
export function trackTelemetryMock(
  name: string,
  properties?: TelemetryEvent["properties"] & {
    stage?: PipelineStage;
    documentId?: string;
  },
): void {
  const { stage, documentId, ...rest } = properties ?? {};
  mockTelemetryBuffer.push({
    name,
    stage,
    documentId,
    timestamp: new Date().toISOString(),
    properties: rest,
  });
}

export function getTelemetryBufferMock(): TelemetryEvent[] {
  return [...mockTelemetryBuffer];
}
