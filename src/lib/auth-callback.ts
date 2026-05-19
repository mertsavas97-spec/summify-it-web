/** Build the Supabase email/OAuth redirect URL (safe for client and server). */
export function getAuthCallbackUrl(nextPath = "/account"): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
