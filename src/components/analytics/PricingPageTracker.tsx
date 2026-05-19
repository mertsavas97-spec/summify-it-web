"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function PricingPageTracker() {
  useEffect(() => {
    trackEvent("pricing_opened", { surface: "pricing_page" });
  }, []);

  return null;
}
