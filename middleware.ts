import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const APEX_HOST = "summify.app";
const WWW_HOST = "www.summify.app";
/** Stable production Vercel alias — not preview URLs like `*-git-*.vercel.app`. */
const PRODUCTION_VERCEL_HOST = "summify-it-web.vercel.app";

function resolveHostname(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = raw.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!host) return null;
  return host.replace(/:\d+$/, "");
}

function redirectToWww(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = WWW_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

/** Belt-and-suspenders: apex → www (also configured in next.config redirects). */
function redirectApexToWww(request: NextRequest): NextResponse | null {
  const hostname = resolveHostname(request);
  if (hostname !== APEX_HOST) return null;
  return redirectToWww(request);
}

/**
 * Canonicalize the production Vercel deployment host to www.
 * Preview / branch aliases keep serving so PR checks still work.
 */
function redirectProductionVercelApp(request: NextRequest): NextResponse | null {
  const hostname = resolveHostname(request);
  if (hostname !== PRODUCTION_VERCEL_HOST) return null;
  return redirectToWww(request);
}

export async function middleware(request: NextRequest) {
  const apexRedirect = redirectApexToWww(request);
  if (apexRedirect) return apexRedirect;

  const vercelAppRedirect = redirectProductionVercelApp(request);
  if (vercelAppRedirect) return vercelAppRedirect;

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip API routes — admin/billing handlers must not pass through auth session middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
