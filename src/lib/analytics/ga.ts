import { shouldTrackAnalytics } from "@/lib/analytics/shouldTrackAnalytics";

/** Public GA4 measurement ID (safe for client bundles). */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export function isGaEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
    __summify_user_email?: string | null;
    __summify_is_admin?: boolean;
  }
}

/**
 * Send a page_view for the current route (client-only).
 * Skips tracking for admin/internal users.
 */
export function trackGaPageView(url: string): void {
  if (!isGaEnabled() || typeof window === "undefined" || !window.gtag) return;

  // Skip tracking for admin routes and internal users
  if (
    !shouldTrackAnalytics({
      pathname: url,
      userEmail: window.__summify_user_email,
      isAdmin: window.__summify_is_admin,
    })
  ) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}
