const FALLBACK_SITE_URL = "https://www.summify.app";

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
  tagline: "Learn anything with audio-first AI study workflows.",
  description:
    "AI learning platform for PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT — audio lessons, study cards, quizzes, and memory-friendly review.",
  url: getSiteUrl(),
  ogImage: "https://www.summify.app/og/summify-og-v1.png",
} as const;
