import { PRODUCT_EVENTS, type ProductEventName } from "@/lib/analytics/productEvents";
import { shouldTrackAnalytics } from "@/lib/analytics/shouldTrackAnalytics";

const SESSION_STORAGE_KEY = "summify_sid";

/** Reads or lazily creates a client-side session id (mirrors the server cookie name). */
function getOrCreateClientSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget product analytics event (v2) from the client.
 * Inserts into `product_events` via the `/api/analytics/track` ingest endpoint.
 * Never throws and never blocks UX.
 * Skips tracking for admin/internal users.
 *
 * NOTE: This is the v2 funnel tracker. The legacy `trackProductEventClient`
 * (api_usage_events via `/api/events/product`) remains separate and unchanged.
 */
export function trackProductEventV2Client(
  eventName: ProductEventName,
  options?: { eventValue?: string | null; metadata?: Record<string, unknown> | null },
): void {
  if (typeof window === "undefined") return;
  if (!PRODUCT_EVENTS[eventName as keyof typeof PRODUCT_EVENTS]) return;

  // Check if we should skip analytics for this user/route
  if (
    !shouldTrackAnalytics({
      pathname: window.location.pathname,
      userEmail: window.__summify_user_email,
      isAdmin: window.__summify_is_admin,
    })
  ) {
    return;
  }

  try {
    const sessionId = getOrCreateClientSessionId();
    if (!sessionId) return;

    const body = JSON.stringify({
      eventName,
      sessionId,
      eventValue: options?.eventValue ?? null,
      metadata: options?.metadata ?? null,
    });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/analytics/track", blob);
      if (ok) return;
    }

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Never break UX for analytics failures.
  }
}
