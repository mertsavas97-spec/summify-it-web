"use client";

import type { ProductEventType } from "@/lib/analytics/productEventTypes";
import type { ProductEventMetadata } from "@/server/usage/trackProductEvent";

type TrackProductEventClientInput = {
  eventType: ProductEventType;
  sourceType?: string | null;
  intelligenceMode?: string | null;
  metadata?: ProductEventMetadata;
};

/**
 * Fire-and-forget product event for allowlisted client-side high-value actions only.
 */
export function trackProductEventClient(input: TrackProductEventClientInput): void {
  void fetch("/api/events/product", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => {
    /* never block UX */
  });
}
