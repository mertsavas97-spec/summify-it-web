const FALLBACK_SITE_URL = "https://www.summify.app";
const APEX_HOST = "summify.app";
const CANONICAL_WWW_HOST = "www.summify.app";

function normalizeSiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (!unquoted) return null;

  try {
    const parsed = new URL(unquoted.includes("://") ? unquoted : `https://${unquoted}`);
    if (parsed.hostname === APEX_HOST) {
      parsed.hostname = CANONICAL_WWW_HOST;
    }
    return parsed.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Canonical public site URL used by sitemap/canonicals/OG absolute URLs.
 * Priority: NEXT_PUBLIC_SITE_URL -> SITE_URL -> https://www.summify.app
 */
export function getSiteUrl(): string {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "") ??
    normalizeSiteUrl(process.env.SITE_URL ?? "") ??
    FALLBACK_SITE_URL
  );
}

/**
 * Public site configuration. `NEXT_PUBLIC_SITE_URL` drives canonicals, sitemap, OG, and JSON-LD.
 * Local dev: set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`.
 */
export const siteConfig = {
  name: "Summify",
  tagline: "AI summarizer for PDFs, decks, videos & articles — then study what matters.",
  description:
    "Free AI summarizer for PDFs, PowerPoint, YouTube, and web articles. Get structured summaries, key insights, flashcards, quizzes, and optional audio lessons in one workspace.",
  url: getSiteUrl(),
  ogImage: "https://www.summify.app/og/summify-og-v1.png",
} as const;
