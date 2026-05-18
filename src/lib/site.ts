export const siteConfig = {
  name: "Summify.it",
  tagline: "Turn complex sources into structured intelligence.",
  description:
    "AI document intelligence workspace for PDFs, YouTube videos, PowerPoint decks, web articles, and study materials.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://summify.it",
  ogImage: "/og-default.png",
} as const;
