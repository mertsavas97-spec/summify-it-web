"use client";

import { useEffect } from "react";
import { trackProductEventV2Client } from "@/lib/analytics/trackProductEventV2Client";
import type { ProductEventName } from "@/lib/analytics/productEvents";

type ProductEventTrackerProps = {
  event: ProductEventName;
  eventValue?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Fires a single product analytics event on mount. Use for page-view style
 * acquisition events (e.g. landing_view, upload_page_view, pricing_view, login_view).
 */
export function ProductEventTracker({ event, eventValue, metadata }: ProductEventTrackerProps) {
  useEffect(() => {
    trackProductEventV2Client(event, { eventValue: eventValue ?? null, metadata: metadata ?? null });
    // Fire once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
