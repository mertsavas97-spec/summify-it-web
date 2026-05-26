const AUTH_NEXT_COOKIE = "summify_auth_next";
const RETURN_TO_STORAGE_KEY = "summify.auth.returnTo";
const PENDING_ANALYSIS_STORAGE_KEY = "summify.pendingAnalysis";
const MAX_AGE_SECONDS = 60 * 30;

export type AuthReturnToSource = "query" | "cookie" | "sessionStorage" | "fallback";

export type PendingAnalysisSnapshot = {
  analysisId: string | null;
  returnTo: string;
  inputMode: "file" | "text" | "url" | "youtube";
  fileName: string | null;
  sourceUrl: string | null;
  rawText: string;
  extractStatus: string;
  extractionMeta: unknown | null;
  analysisMode: string;
  analysisResult: unknown | null;
  injectedAnalysis: unknown | null;
  analysisIntelligence: unknown | null;
};

/** Safe internal redirect path (blocks open redirects). */
export function sanitizeReturnTo(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    const parsed = new URL(next, "http://summify.local");
    if (parsed.origin !== "http://summify.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function setAuthReturnToCookie(returnTo: string): void {
  if (typeof document === "undefined") return;
  const safe = sanitizeReturnTo(returnTo);
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthReturnToCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_NEXT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthReturnToFromRequestCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((row) => row.startsWith(`${AUTH_NEXT_COOKIE}=`));
  if (!match) return null;
  try {
    return sanitizeReturnTo(decodeURIComponent(match.slice(AUTH_NEXT_COOKIE.length + 1)));
  } catch {
    return null;
  }
}

export function saveAuthReturnTo(returnTo: string): string {
  const safe = sanitizeReturnTo(returnTo);
  setAuthReturnToCookie(safe);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(RETURN_TO_STORAGE_KEY, safe);
  }
  return safe;
}

export function readAuthReturnTo(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const value = sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
  if (!value) return null;
  return sanitizeReturnTo(value);
}

export function clearAuthReturnTo(): void {
  clearAuthReturnToCookie();
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  }
}

export function savePendingAnalysis(snapshot: PendingAnalysisSnapshot): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_ANALYSIS_STORAGE_KEY, JSON.stringify(snapshot));
}

export function readPendingAnalysis(): PendingAnalysisSnapshot | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_ANALYSIS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingAnalysisSnapshot;
  } catch {
    return null;
  }
}

export function clearPendingAnalysis(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_ANALYSIS_STORAGE_KEY);
}

export function resolveAuthReturnTo(options: {
  query?: string | null;
  cookie?: string | null;
  sessionStorageValue?: string | null;
  fallback?: string;
}): { returnTo: string; source: AuthReturnToSource } {
  const fallback = options.fallback ?? "/account";
  if (options.query) return { returnTo: sanitizeReturnTo(options.query, fallback), source: "query" };
  if (options.cookie) return { returnTo: sanitizeReturnTo(options.cookie, fallback), source: "cookie" };
  if (options.sessionStorageValue) {
    return { returnTo: sanitizeReturnTo(options.sessionStorageValue, fallback), source: "sessionStorage" };
  }
  return { returnTo: fallback, source: "fallback" };
}