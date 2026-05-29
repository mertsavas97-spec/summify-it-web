import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getAppOrigin } from "@/lib/app-origin";
import { createGoogleOAuthClient, GA_OAUTH_SCOPE } from "@/server/googleAnalytics/oauth";
import { upsertAdminOAuthToken } from "@/server/admin/oauthTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "summify_ga_oauth_state";
const RETURN_TO_COOKIE = "summify_ga_oauth_return_to";

/**
 * GET /api/admin/google-analytics/callback
 * Handles OAuth callback and stores refresh token server-side.
 */
export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const origin = getAppOrigin(url.origin);

  const stateFromQuery = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateFromCookie = readCookie(cookieHeader, STATE_COOKIE);
  const returnTo = readCookie(cookieHeader, RETURN_TO_COOKIE) ?? "/dashboard/admin/analytics";

  if (oauthError) {
    return redirectAndClear(origin, returnTo, "oauth_error");
  }

  if (!code) {
    return redirectAndClear(origin, returnTo, "missing_code");
  }

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return redirectAndClear(origin, returnTo, "invalid_state");
  }

  const oauth2 = createGoogleOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    // This can happen if consent wasn't forced / already granted.
    return redirectAndClear(origin, returnTo, "missing_refresh_token");
  }

  const scope = typeof tokens.scope === "string" ? tokens.scope : null;
  if (scope && !scope.includes(GA_OAUTH_SCOPE)) {
    return redirectAndClear(origin, returnTo, "insufficient_scope");
  }

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  await upsertAdminOAuthToken("google_analytics", {
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type ?? null,
    scope,
    expiresAt,
    connectedAt: new Date(),
  });

  return redirectAndClear(origin, returnTo);
}

function readCookie(cookieHeader: string, key: string): string | null {
  const parts = cookieHeader.split(/;\s*/g);
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = decodeURIComponent(part.slice(0, idx));
    if (name !== key) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
}

function redirectAndClear(origin: string, returnTo: string, errorCode?: string) {
  const url = new URL(returnTo, origin);
  if (errorCode) url.searchParams.set("ga", errorCode);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(RETURN_TO_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
