/** Production hosts that should be indexed by search engines. */
const INDEXABLE_HOSTS = new Set(["summify.app", "www.summify.app"]);

/** Patterns that indicate non-production/preview environments. */
const NON_PRODUCTION_PATTERNS = [
  ".vercel.app",
  "localhost",
  "127.0.0.1",
  ".netlify.app",
  ".herokuapp.com",
];

function normalizeHost(raw: string | null): string | null {
  if (!raw) return null;
  const host = raw.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!host) return null;
  return host.replace(/:\d+$/, "");
}

export function resolveRequestHost(input: {
  host: string | null;
  forwardedHost: string | null;
}): string | null {
  return normalizeHost(input.forwardedHost) ?? normalizeHost(input.host);
}

/** Check if hostname is a known non-production/preview environment. */
export function isNonProductionHost(hostname: string | null): boolean {
  if (!hostname) return true; // Treat unknown as non-production
  return NON_PRODUCTION_PATTERNS.some((pattern) => hostname.includes(pattern));
}

export function isIndexableHost(hostname: string | null): boolean {
  if (!hostname) return false;
  // Explicitly block non-production hosts (Vercel previews, localhost, etc.)
  if (isNonProductionHost(hostname)) return false;
  return INDEXABLE_HOSTS.has(hostname);
}

