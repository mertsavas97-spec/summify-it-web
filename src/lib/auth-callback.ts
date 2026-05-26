import { getAppOrigin } from "@/lib/app-origin";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

/**
 * Build the Supabase email/OAuth redirect URL (safe for client and server).
 * In the browser, pass `window.location.origin` so local dev never sends users to production.
 */
export function getAuthCallbackUrl(nextPath = "/account", browserOrigin?: string): string {
  const siteUrl = getAppOrigin(browserOrigin);
  const next = sanitizeReturnTo(nextPath, "/account");
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
