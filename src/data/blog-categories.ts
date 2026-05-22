/** Scalable blog category architecture for topical authority and category landing pages. */
export type BlogCategoryId =
  | "pdf-workflows"
  | "youtube-summaries"
  | "study-learning"
  | "ai-research"
  | "pptx-documents"
  | "comparisons"
  | "productivity";

export type BlogCategory = {
  id: BlogCategoryId;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  /** Long-tail positioning line for category hubs. */
  positioning: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "pdf-workflows",
    slug: "pdf-workflows",
    name: "PDF Workflows",
    description:
      "Turn PDFs into structured summaries, Learn cards, and quizzes — chunking, modes, and review loops.",
    seoTitle: "PDF Workflows — AI Summaries, Learn Cards & Quizzes",
    seoDescription:
      "Practical PDF workflows: summarize reports and papers, generate AI study notes, Learn cards, and post-learn quizzes with Summify.",
    positioning: "AI PDF summarizer · Learn cards · quiz generation",
  },
  {
    id: "youtube-summaries",
    slug: "youtube-summaries",
    name: "YouTube Summaries",
    description:
      "Transcript-first workflows for lectures, explainers, and podcasts — timestamps, notes, and review.",
    seoTitle: "YouTube Summaries — Video to Study Notes & Learn Cards",
    seoDescription:
      "How to summarize YouTube videos with AI: transcripts, structured study notes, and Learn cards without losing context.",
    positioning: "AI YouTube summarizer · lecture notes · video intelligence",
  },
  {
    id: "study-learning",
    slug: "study-learning",
    name: "Study & Learning",
    description:
      "Exam prep, spaced review, AI study notes, flashcard-style Learn cards, and quizzes from your sources.",
    seoTitle: "Study & Learning — AI Study Notes, Learn Cards & Quizzes",
    seoDescription:
      "Student-focused guides on AI study notes, exam prep workflows, Learn cards, and quiz generation from PDFs and videos.",
    positioning: "AI study notes · Learn cards · AI quiz from PDF",
  },
  {
    id: "ai-research",
    slug: "ai-research",
    name: "AI Research",
    description:
      "Literature review, paper skimming, and research workflows with structured document intelligence.",
    seoTitle: "AI Research — Paper Summaries & Literature Workflows",
    seoDescription:
      "Research workflows for PDFs and articles: structured summaries, key insights, and verification habits for academics.",
    positioning: "research paper summarizer · literature review AI",
  },
  {
    id: "pptx-documents",
    slug: "pptx-documents",
    name: "PPTX & Documents",
    description:
      "Deck analysis, DOCX uploads, and multi-format document intelligence beyond PDF.",
    seoTitle: "PPTX & Documents — Deck & Office Summarization",
    seoDescription:
      "Summarize PowerPoint decks and office documents into executive insights, themes, and action items with AI modes.",
    positioning: "PowerPoint summarizer · PPTX AI · document intelligence",
  },
  {
    id: "comparisons",
    slug: "comparisons",
    name: "Comparisons",
    description:
      "Honest comparisons of AI summarizers, PDF tools, and study workflows — criteria, not hype rankings.",
    seoTitle: "Comparisons — AI PDF & Document Summarizer Guides",
    seoDescription:
      "Compare AI PDF summarizers and document tools on fidelity, structure, Learn cards, and study outputs.",
    positioning: "best AI PDF summarizer · document summary tool",
  },
  {
    id: "productivity",
    slug: "productivity",
    name: "Productivity",
    description:
      "Knowledge-worker habits: faster first reads, structured outputs, and review without re-skimming sources.",
    seoTitle: "Productivity — Document Intelligence for Knowledge Work",
    seoDescription:
      "Productivity guides for summarizing documents, retaining insights, and turning analysis into action.",
    positioning: "document intelligence · structured AI analysis",
  },
];

const CATEGORY_BY_ID = new Map(BLOG_CATEGORIES.map((c) => [c.id, c]));
const CATEGORY_BY_SLUG = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]));

export function getBlogCategory(id: BlogCategoryId): BlogCategory {
  return CATEGORY_BY_ID.get(id)!;
}

export function getBlogCategoryBySlug(slug: string): BlogCategory | undefined {
  return CATEGORY_BY_SLUG.get(slug);
}

export function getAllBlogCategorySlugs(): string[] {
  return BLOG_CATEGORIES.map((c) => c.slug);
}
