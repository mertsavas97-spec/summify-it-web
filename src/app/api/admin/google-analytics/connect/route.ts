import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getAppOrigin } from "@/lib/app-origin";
import { createGoogleOAuthClient, GA_OAUTH_SCOPE, generateOAuthState } from "@/server/googleAnalytics/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "summify_ga_oauth_state";

/**
 * GET /api/admin/google-analytics/connect
 * Starts Google OAuth flow for GA4 read-only access.
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

  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") ?? "/dashboard/admin/analytics";

  const oauth2 = createGoogleOAuthClient();
  const state = generateOAuthState();

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GA_OAUTH_SCOPE],
    state,
    include_granted_scopes: true,
  });

  // Always redirect back to our canonical origin to avoid mixed-host issues.
  const origin = getAppOrigin(requestOrigin);
  const response = NextResponse.redirect(authUrl);

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("summify_ga_oauth_return_to", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
