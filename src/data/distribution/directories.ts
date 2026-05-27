/**
 * Directory submission registry — reusable positioning per platform.
 * Content only; no automated submissions.
 */

export type DirectoryId =
  | "product_hunt"
  | "futurepedia"
  | "toolify"
  | "theres_an_ai_for_that"
  | "saashub"
  | "alternativeto"
  | "ai_scout"
  | "uneed";

export type DirectoryListing = {
  id: DirectoryId;
  name: string;
  url: string;
  category: string;
  positioningAngle: string;
  shortDescription: string;
  /** Suggested CTA label for that directory's form. */
  ctaLabel: string;
  ctaUrl: string;
  targetKeywords: string[];
  /** Optional notes for whoever submits (tone, limits, quirks). */
  submissionNotes?: string;
};

const BASE_URL = "https://www.summify.app";
const BASE_CTA = `${BASE_URL}/upload`;

export const DIRECTORY_LISTINGS: DirectoryListing[] = [
  {
    id: "product_hunt",
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    category: "Productivity · Education · Artificial Intelligence",
    positioningAngle:
      "Premium AI knowledge workspace — structured intelligence, Learn cards, and memory review beyond generic summarizers.",
    shortDescription:
      "Turn PDFs, decks, and videos into structured summaries, mind maps, and review cards with 29+ intelligence modes.",
    ctaLabel: "Try free during public beta",
    ctaUrl: BASE_CTA,
    targetKeywords: [
      "AI PDF summarizer",
      "document intelligence",
      "study tool",
      "mind map",
      "knowledge workspace",
    ],
    submissionNotes: "Lead with maker story + demo GIF. Schedule for Tue–Thu AM PT.",
  },
  {
    id: "futurepedia",
    name: "Futurepedia",
    url: "https://www.futurepedia.io",
    category: "Education / Productivity / Research",
    positioningAngle: "All-in-one document intelligence with modes, export, and spaced review.",
    shortDescription:
      "Summify analyzes PDFs, YouTube, PowerPoint, and articles into structured insights, Learn cards, and shareable mind maps.",
    ctaLabel: "Visit website",
    ctaUrl: BASE_URL,
    targetKeywords: ["AI summarizer", "PDF AI", "learning tool", "research assistant"],
  },
  {
    id: "toolify",
    name: "Toolify",
    url: "https://www.toolify.ai",
    category: "AI Tools · Education",
    positioningAngle: "Multi-format AI workspace with intelligence modes and memory system.",
    shortDescription:
      "Upload PDFs, videos, or decks — pick a mode, get structured analysis, mind maps, and review cards.",
    ctaLabel: "Get started",
    ctaUrl: BASE_CTA,
    targetKeywords: ["summarize PDF", "YouTube summary", "AI study", "mind map generator"],
  },
  {
    id: "theres_an_ai_for_that",
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com",
    category: "Productivity / Education / Document processing",
    positioningAngle: "Document-to-knowledge pipeline with export and privacy-safe sharing.",
    shortDescription:
      "Summify structures documents into summaries, action items, Learn cards, and optional public share links.",
    ctaLabel: "Open Summify",
    ctaUrl: BASE_CTA,
    targetKeywords: ["document summarizer", "PDF", "PowerPoint", "flashcards", "spaced repetition"],
  },
  {
    id: "saashub",
    name: "SaaSHub",
    url: "https://www.saashub.com",
    category: "Productivity Software",
    positioningAngle: "Alternative to single-purpose summarizers — full workspace with modes and review.",
    shortDescription:
      "AI knowledge workspace for PDFs, video, and slides with intelligence modes, exports, and beta pricing preview.",
    ctaLabel: "Website",
    ctaUrl: BASE_URL,
    targetKeywords: ["Summify", "AI summarizer alternative", "document AI", "SaaS productivity"],
    submissionNotes: "Compare fairly vs ChatPDF / Notion AI; link to /compare pages.",
  },
  {
    id: "alternativeto",
    name: "AlternativeTo",
    url: "https://alternativeto.net",
    category: "Education · Office · AI",
    positioningAngle: "Structured alternative to chat-over-PDF tools — modes, mind map, memory review.",
    shortDescription:
      "Summify: multi-format analysis, Learn cards, mind maps, and spaced review. Public beta at summify.app.",
    ctaLabel: "Official website",
    ctaUrl: BASE_URL,
    targetKeywords: ["ChatPDF alternative", "PDF summarizer", "study app", "knowledge management"],
    submissionNotes: "List alternatives: ChatPDF, Notion AI, NotebookLM. Highlight modes + review.",
  },
  {
    id: "ai_scout",
    name: "AI Scout",
    url: "https://aiscout.net",
    category: "AI Productivity",
    positioningAngle: "Premium document intelligence for students and professionals.",
    shortDescription:
      "Analyze PDFs, YouTube, and decks with AI modes — summaries, insights, mind maps, and review cards.",
    ctaLabel: "Try Summify",
    ctaUrl: BASE_CTA,
    targetKeywords: ["AI document tool", "summarizer", "learning", "research"],
  },
  {
    id: "uneed",
    name: "Uneed",
    url: "https://uneed.best",
    category: "Productivity / AI",
    positioningAngle: "Launch-friendly: public beta, free core analysis, premium UX.",
    shortDescription:
      "Summify turns your sources into structured intelligence — summaries, Learn cards, mind maps, and share links.",
    ctaLabel: "Launch offer — try free",
    ctaUrl: BASE_CTA,
    targetKeywords: ["beta", "AI workspace", "PDF", "productivity"],
    submissionNotes: "Reuse Product Hunt taglines; emphasize beta access.",
  },
];

export function getDirectoryListing(id: DirectoryId): DirectoryListing | undefined {
  return DIRECTORY_LISTINGS.find((d) => d.id === id);
}

export function formatDirectoryKeywords(listing: DirectoryListing): string {
  return listing.targetKeywords.join(", ");
}
