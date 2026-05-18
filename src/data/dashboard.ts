export type RecentSummary = {
  id: string;
  title: string;
  template: string;
  date: string;
  pages: number;
};

export type SavedDocument = {
  id: string;
  name: string;
  uploadedAt: string;
  status: "summarized" | "pending";
};

export type TemplateUsage = {
  template: string;
  count: number;
  percentage: number;
};

export const recentSummaries: RecentSummary[] = [
  {
    id: "1",
    title: "Q3 Strategy Memo",
    template: "The Executive",
    date: "May 16, 2026",
    pages: 42,
  },
  {
    id: "2",
    title: "Neural Architecture Survey",
    template: "The Academic",
    date: "May 14, 2026",
    pages: 68,
  },
  {
    id: "3",
    title: "Vendor MSA — Acme Corp",
    template: "The Legal Reader",
    date: "May 11, 2026",
    pages: 31,
  },
];

export const savedDocuments: SavedDocument[] = [
  {
    id: "1",
    name: "Product_Roadmap_2026.pdf",
    uploadedAt: "May 17, 2026",
    status: "pending",
  },
  {
    id: "2",
    name: "Board_Deck_May.pdf",
    uploadedAt: "May 15, 2026",
    status: "summarized",
  },
];

export const templateUsage: TemplateUsage[] = [
  { template: "The Executive", count: 12, percentage: 40 },
  { template: "The Academic", count: 8, percentage: 27 },
  { template: "The Legal Reader", count: 6, percentage: 20 },
  { template: "The Creator", count: 4, percentage: 13 },
];
