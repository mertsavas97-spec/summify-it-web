const AUTH_NEXT_COOKIE = "summify_auth_next";
const MAX_AGE_SECONDS = 60 * 30; // 30 minutes

/** Safe internal redirect path (blocks open redirects). */
export function sanitizeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** Persist intended post-auth path (OAuth may drop query params on callback). */
export function setAuthNextCookie(nextPath: string): void {
  if (typeof document === "undefined") return;
  const safe = sanitizeNextPath(nextPath);
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readAuthNextCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_NEXT_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(AUTH_NEXT_COOKIE.length + 1);
  try {
    return sanitizeNextPath(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function clearAuthNextCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_NEXT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/** Server: read auth-next cookie from Request (callback route). */
export function getAuthNextFromRequestCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((row) => row.startsWith(`${AUTH_NEXT_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(AUTH_NEXT_COOKIE.length + 1);
  try {
    return sanitizeNextPath(decodeURIComponent(value));
  } catch {
    return null;
  }
}
