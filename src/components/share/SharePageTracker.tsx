"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

type SharePageTrackerProps = {
  shareId: string;
  sourceKind?: string;
};

export function SharePageTracker({ shareId, sourceKind }: SharePageTrackerProps) {
  useEffect(() => {
    trackEvent("share_opened", { share_id: shareId, source_kind: sourceKind });
  }, [shareId, sourceKind]);

  return null;
}
