export type DemoWorkflow = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Optional badge (e.g. "Example", "Video"). */
  badge?: string;
};

export const DEMO_WORKFLOWS: DemoWorkflow[] = [
  {
    id: "pdf-executive",
    title: "Example: Executive brief from a PDF",
    description:
      "See how Summify structures a dense report into insights, risks, and action items.",
    ctaLabel: "See example analysis",
    ctaHref: "/upload",
    badge: "Example",
  },
  {
    id: "youtube-student",
    title: "Example: YouTube lecture → Learn cards",
    description:
      "Paste a video link, pick The Student mode, and get review-ready cards.",
    ctaLabel: "Watch workflow",
    ctaHref: "/guides/how-to-summarize-youtube-videos-with-ai",
    badge: "Guide",
  },
  {
    id: "deck-creator",
    title: "Example: Pitch deck for creators",
    description:
      "Upload a deck and use The Creator mode for hooks, angles, and next steps.",
    ctaLabel: "Try on your deck",
    ctaHref: "/upload",
    badge: "Workflow",
  },
];

export function getFeaturedDemoWorkflows(limit = 2): DemoWorkflow[] {
  return DEMO_WORKFLOWS.slice(0, limit);
}
