export type WebAdvantage = {
  title: string;
  description: string;
  icon: "document" | "batch" | "export" | "split";
};

export const webAdvantages: WebAdvantage[] = [
  {
    title: "Long document analysis",
    description:
      "Process reports, books, and research packs that exceed mobile limits—built for depth, not snippets.",
    icon: "document",
  },
  {
    title: "Batch-ready workflow",
    description:
      "Queue multiple files in one session. Upload UI is ready for the batch pipeline coming soon.",
    icon: "batch",
  },
  {
    title: "Export-friendly summaries",
    description:
      "Structured output designed for Word, Notion, PDF, and stakeholder decks—not locked in an app.",
    icon: "export",
  },
  {
    title: "Side-by-side reading",
    description:
      "Keep the source document visible while you review, annotate, and refine the summary.",
    icon: "split",
  },
];
