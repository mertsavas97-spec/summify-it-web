import { NextResponse } from "next/server";
import { oauthCallbackErrorCode } from "@/lib/auth-errors";
import { ensureProfileForUser } from "@/lib/auth";
import { createClientIfConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
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

  return NextResponse.redirect(`${origin}${safeNext}`);
}
