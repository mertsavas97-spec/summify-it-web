import { NextResponse } from "next/server";
import { getAuthNextFromRequestCookies } from "@/lib/auth/next-path";
import { resolveAuthReturnTo } from "@/lib/auth/return-to";
import { oauthCallbackErrorCode } from "@/lib/auth-errors";
import { ensureProfileForUser } from "@/lib/auth";
import { createClientIfConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const cookieHeader = request.headers.get("cookie");
  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = getAuthNextFromRequestCookies(cookieHeader);
  const { returnTo: safeNext } = resolveAuthReturnTo({
    query: nextFromQuery,
    cookie: nextFromCookie,
    fallback: "/account",
  });
  const nextQuery = `next=${encodeURIComponent(safeNext)}`;

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const errorCode = oauthCallbackErrorCode(
      oauthError,
      searchParams.get("error_description"),
    );
    return NextResponse.redirect(
      `${origin}/login?error=${errorCode}&${nextQuery}`,
    );
  }

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code&${nextQuery}`);
  }

  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=not_configured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorCode = oauthCallbackErrorCode(
      error.code ?? "auth",
      error.message,
    );
    if (process.env.NODE_ENV === "development") {
      console.error("[summify.auth] callback exchange failed", error.message);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${errorCode}&${nextQuery}`,
    );
  }

  await ensureProfileForUser();

  const response = NextResponse.redirect(`${origin}${safeNext}`);
  response.cookies.set("summify_auth_next", "", { path: "/", maxAge: 0 });
  return response;
}
