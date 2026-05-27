const PRODUCTION_ORIGIN = "https://www.summify.app";
const LOCAL_DEV_ORIGIN = "http://localhost:3000";
const APEX_PRODUCTION_HOST = "summify.app";
const WWW_PRODUCTION_HOST = "www.summify.app";

function parseOrigin(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (parsed.hostname === APEX_PRODUCTION_HOST) {
      parsed.hostname = WWW_PRODUCTION_HOST;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Canonical app origin for redirects, OAuth, Polar URLs, and JSON-LD.
 * Pass `explicitOrigin` from `window.location.origin` in the browser when available.
 */
export function getAppOrigin(explicitOrigin?: string): string {
  const fromExplicit = explicitOrigin ? parseOrigin(explicitOrigin) : null;
  if (fromExplicit) return fromExplicit;

  const fromEnv = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return LOCAL_DEV_ORIGIN;
  }

  return PRODUCTION_ORIGIN;
}

export function isLocalDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** True when env points at production but you are likely developing locally. */
export function isMisconfiguredLocalSiteUrl(browserOrigin?: string): boolean {
  if (!browserOrigin || !isLocalDevOrigin(browserOrigin)) return false;
  const envOrigin = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  return Boolean(envOrigin && !isLocalDevOrigin(envOrigin));
}
