import { getAppOrigin } from "@/lib/app-origin";

/**
 * Public site configuration. `NEXT_PUBLIC_SITE_URL` drives canonicals, sitemap, OG, and JSON-LD.
 * Local dev: set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`.
 */
export const siteConfig = {
  name: "Summify",
  tagline: "Learn anything with audio-first AI study workflows.",
  description:
    "AI learning platform for PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT — audio lessons, study cards, quizzes, and memory-friendly review.",
  url: getAppOrigin(),
  ogImage: "https://www.summify.app/og/summify-og-v1.png",
} as const;
