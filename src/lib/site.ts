/**
 * Public site configuration. `NEXT_PUBLIC_SITE_URL` drives canonicals, sitemap, OG, and JSON-LD.
 * Production: https://summify.app
 */
function normalizeSiteUrl(raw: string | undefined): string {
  const fallback = "https://summify.app";
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: "Summify",
  tagline: "Turn complex sources into structured intelligence.",
  description:
    "AI document intelligence for PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT. Upload sources and get structured analysis with Learn cards.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  ogImage: "/og-default.png",
} as const;
