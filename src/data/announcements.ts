export type AnnouncementLink = {
  href: string;
  label: string;
};

export type Announcement = {
  /** Stable id for localStorage dismiss key. */
  id: string;
  message: string;
  link?: AnnouncementLink;
  /** When false, banner is hidden site-wide. */
  active: boolean;
  /** Optional priority — higher wins when multiple active (first match used). */
  priority?: number;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "public-beta-2026",
    active: true,
    priority: 10,
    message: "Public beta is live — analyze PDFs, decks, videos, and articles for free.",
    link: { href: "/upload", label: "Open workspace" },
  },
  {
    id: "memory-review",
    active: false,
    priority: 5,
    message: "New: Memory review — practice Learn cards with spaced repetition.",
    link: { href: "/upload", label: "Try it" },
  },
  {
    id: "mp3-summaries",
    active: false,
    priority: 4,
    message: "Now supports MP3 and audio summaries.",
    link: { href: "/summarize-mp3", label: "Learn more" },
  },
];

export function getActiveAnnouncement(): Announcement | null {
  const active = ANNOUNCEMENTS.filter((a) => a.active);
  if (active.length === 0) return null;
  return active.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? null;
}

export function announcementStorageKey(id: string): string {
  return `summify-announcement-dismissed-${id}`;
}
