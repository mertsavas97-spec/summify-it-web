/** Header navigation — formats & segments (SEO crawl paths). */

export type SeoNavItem = {
  href: string;
  label: string;
  description?: string;
};

export const FORMAT_NAV_ITEMS: SeoNavItem[] = [
  {
    href: "/summarize-pdf",
    label: "PDF",
    description: "AI PDF summarizer & study notes",
  },
  {
    href: "/summarize-youtube-video",
    label: "YouTube",
    description: "Transcript-based video intelligence",
  },
  {
    href: "/summarize-powerpoint",
    label: "PowerPoint",
    description: "PPTX deck analysis",
  },
  {
    href: "/summarize-web-articles",
    label: "Web articles",
    description: "URL & article summarizer",
  },
  {
    href: "/summarize-docx",
    label: "DOCX",
    description: "Word document summarizer",
  },
  {
    href: "/summarize-mp3",
    label: "MP3 / audio",
    description: "Audio & podcast workflows",
  },
];

export const SEGMENT_NAV_ITEMS: SeoNavItem[] = [
  { href: "/for-students", label: "Students", description: "AI study notes & exam prep" },
  { href: "/for-creators", label: "Creators", description: "Repurpose video & podcasts" },
  { href: "/for-teams", label: "Teams", description: "Shared intelligence workflows" },
  { href: "/for-freelancers", label: "Freelancers", description: "Client docs & contracts" },
  { href: "/for-researchers", label: "Researchers", description: "Papers & evidence synthesis" },
];
