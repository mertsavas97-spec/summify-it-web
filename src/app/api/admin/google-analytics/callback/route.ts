import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getAppOrigin } from "@/lib/app-origin";
import { createGoogleOAuthClient, GA_OAUTH_SCOPE } from "@/server/googleAnalytics/oauth";
import { upsertAdminOAuthToken } from "@/server/admin/oauthTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "summify_ga_oauth_state";
const RETURN_TO_COOKIE = "summify_ga_oauth_return_to";

type CallbackStage =
  | "callback_started"
  | "state_cookie_found"
  | "state_validated"
  | "code_received"
  | "token_exchange_started"
  | "token_exchange_success"
  | "refresh_token_present"
  | "supabase_insert_started"
  | "supabase_insert_success"
  | "redirect_started";

type CallbackErrorStage = CallbackStage | "oauth_error" | "missing_code" | "invalid_state";

/**
 * GET /api/admin/google-analytics/callback
 * Handles OAuth callback and stores refresh token server-side.
 */
export async function GET(request: Request) {
  const errorId = createErrorId();
  let stage: CallbackErrorStage = "callback_started";
  const startedAt = Date.now();

  const url = new URL(request.url);
  const origin = getAppOrigin(url.origin);

  // NOTE: avoid logging cookies, oauth codes, tokens, client secrets.
  logStage("callback_started", { errorId, origin, path: url.pathname });

  const stateFromQuery = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateFromCookie = readCookie(cookieHeader, STATE_COOKIE);
  const returnTo = readCookie(cookieHeader, RETURN_TO_COOKIE) ?? "/dashboard/admin/analytics";

  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Unexpected auth/session error. Show readable error page.
    return renderAdminErrorPage({
      errorId,
      stage,
      error: e,
    });
  }

  if (stateFromCookie) {
    stage = "state_cookie_found";
    logStage("state_cookie_found", { errorId });
  }

  if (oauthError) {
    // Do not log OAuth error description details; keep it high-level.
    return redirectAndClear(origin, returnTo, "oauth_error");
  }

  if (!code) {
    stage = "missing_code";
    return renderAdminErrorPage({
      errorId,
      stage,
      error: new Error("Missing OAuth code."),
      status: 400,
    });
  }

  stage = "code_received";
  logStage("code_received", { errorId });

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    stage = "invalid_state";
    return renderAdminErrorPage({
      errorId,
      stage,
      error: new Error("Invalid OAuth state."),
      status: 400,
    });
  }

  stage = "state_validated";
  logStage("state_validated", { errorId });

  try {
    stage = "token_exchange_started";
    logStage("token_exchange_started", { errorId });

    const oauth2 = createGoogleOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    stage = "token_exchange_success";
    logStage("token_exchange_success", {
      errorId,
      hasRefreshToken: Boolean(tokens.refresh_token),
      hasAccessToken: Boolean(tokens.access_token),
      hasScope: typeof tokens.scope === "string" && tokens.scope.length > 0,
      hasExpiryDate: typeof tokens.expiry_date === "number",
    });

    if (!tokens.refresh_token) {
      // This can happen if consent wasn't forced / already granted.
      return redirectAndClear(origin, returnTo, "missing_refresh_token");
    }

    stage = "refresh_token_present";
    logStage("refresh_token_present", { errorId });

    const scope = typeof tokens.scope === "string" ? tokens.scope : null;
    if (scope && !scope.includes(GA_OAUTH_SCOPE)) {
      return redirectAndClear(origin, returnTo, "insufficient_scope");
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    stage = "supabase_insert_started";
    logStage("supabase_insert_started", { errorId });

    await upsertAdminOAuthToken("google_analytics", {
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type ?? null,
      scope,
      expiresAt,
      connectedAt: new Date(),
    });

    stage = "supabase_insert_success";
    logStage("supabase_insert_success", { errorId });

    stage = "redirect_started";
    logStage("redirect_started", { errorId, ms: Date.now() - startedAt });
    return redirectAndClear(origin, returnTo);
  } catch (e) {
    logError({ errorId, stage, error: e });
    return renderAdminErrorPage({ errorId, stage, error: e });
  }
}

function logStage(stage: CallbackStage, meta: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      kind: "ga_oauth_callback",
      stage,
      ...meta,
    }),
  );
}

function logError(input: { errorId: string; stage: CallbackErrorStage; error: unknown }) {
  const err = normalizeError(input.error);
  console.error(
    JSON.stringify({
      kind: "ga_oauth_callback",
      stage: input.stage,
      errorId: input.errorId,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    }),
  );
}

function normalizeError(error: unknown): { name: string; message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "(no message)",
      stack: error.stack ?? null,
    };
  }
  return {
    name: "NonErrorThrow",
    message: typeof error === "string" ? error : JSON.stringify(error),
    stack: null,
  };
}

function createErrorId(): string {
  // Small, safe correlation id for log lookup.
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function renderAdminErrorPage(input: {
  errorId: string;
  stage: CallbackErrorStage;
  error: unknown;
  status?: number;
}) {
  const err = normalizeError(input.error);
  const status = input.status ?? 500;

  // Log structured error (but never secrets).
  logError({ errorId: input.errorId, stage: input.stage, error: input.error });

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google Analytics connection failed</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 32px; color: #111; }
      .card { max-width: 720px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 8px 0; line-height: 1.4; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
      details { margin-top: 12px; }
      pre { white-space: pre-wrap; word-break: break-word; background: #0b1020; color: #e5e7eb; padding: 12px; border-radius: 10px; overflow: auto; }
      a { color: #2563eb; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Google Analytics connection failed</h1>
      <p>Stage: <code>${escapeHtml(input.stage)}</code></p>
      <p>Error code: <code>${escapeHtml(input.errorId)}</code></p>
      <p>You can share the error code with support to locate server logs.</p>
      <p><a href="/dashboard/admin/analytics">Back to admin analytics</a></p>
      <details>
        <summary>Technical details (admins)</summary>
        <pre>${escapeHtml(`${err.name}: ${err.message}${err.stack ? "\n\n" + err.stack : ""}`)}</pre>
      </details>
    </div>
  </body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
