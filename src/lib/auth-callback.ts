import { getAppOrigin } from "@/lib/app-origin";

/**
 * Build the Supabase email/OAuth redirect URL (safe for client and server).
 * In the browser, pass `window.location.origin` so local dev never sends users to production.
 */
export function getAuthCallbackUrl(nextPath = "/account", browserOrigin?: string): string {
  const siteUrl = getAppOrigin(browserOrigin);
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
