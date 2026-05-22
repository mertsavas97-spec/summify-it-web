import { getAppOrigin } from "@/lib/app-origin";

/**
 * Public site configuration. `NEXT_PUBLIC_SITE_URL` drives canonicals, sitemap, OG, and JSON-LD.
 * Local dev: set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`.
 */
export const siteConfig = {
  name: "Summify",
  tagline: "Turn complex sources into structured intelligence.",
  description:
    "AI document intelligence and study companion for PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, and TXT — summaries, Learn cards, quizzes, and voice study lessons.",
  url: getAppOrigin(),
  ogImage: "/og-default.png",
} as const;
