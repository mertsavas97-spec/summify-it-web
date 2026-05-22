/**
 * Content cluster IDs for long-tail SEO and future editorial planning.
 * Maps to product positioning: PDF, YouTube, PPTX, Learn, Quiz, study, research.
 */
export type BlogContentCluster =
  | "ai-pdf-summarizer"
  | "ai-youtube-summarizer"
  | "pptx-summarizer"
  | "learn-cards"
  | "ai-quiz-generation"
  | "study-workflows"
  | "research-workflows";

export type BlogClusterMeta = {
  id: BlogContentCluster;
  label: string;
  description: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
};

export const BLOG_CONTENT_CLUSTERS: Record<BlogContentCluster, BlogClusterMeta> = {
  "ai-pdf-summarizer": {
    id: "ai-pdf-summarizer",
    label: "AI PDF summarizer",
    description: "Structured PDF intelligence with modes, Learn cards, and quizzes.",
    primaryCtaHref: "/summarize-pdf",
    primaryCtaLabel: "Summarize a PDF",
  },
  "ai-youtube-summarizer": {
    id: "ai-youtube-summarizer",
    label: "AI YouTube summarizer",
    description: "Transcript-based video notes with timestamps and study outputs.",
    primaryCtaHref: "/summarize-youtube-video",
    primaryCtaLabel: "Summarize a video",
  },
  "pptx-summarizer": {
    id: "pptx-summarizer",
    label: "PPTX summarizer",
    description: "Deck themes, executive insights, and slide-level structure.",
    primaryCtaHref: "/summarize-powerpoint",
    primaryCtaLabel: "Summarize a deck",
  },
  "learn-cards": {
    id: "learn-cards",
    label: "Learn cards",
    description: "Source-backed recall cards from your analysis — concepts, facts, and connections.",
    primaryCtaHref: "/for-students",
    primaryCtaLabel: "Explore Learn cards",
  },
  "ai-quiz-generation": {
    id: "ai-quiz-generation",
    label: "AI quiz generation",
    description: "Post-learn quizzes from summaries, insights, and accessible Learn cards.",
    primaryCtaHref: "/upload",
    primaryCtaLabel: "Start learning path",
  },
  "study-workflows": {
    id: "study-workflows",
    label: "Study workflows",
    description: "Exam prep loops: summarize → Learn → quiz → spaced review.",
    primaryCtaHref: "/for-students",
    primaryCtaLabel: "Study with Summify",
  },
  "research-workflows": {
    id: "research-workflows",
    label: "Research workflows",
    description: "Literature skimming with verifiable structured outputs.",
    primaryCtaHref: "/for-researchers",
    primaryCtaLabel: "Research with Summify",
  },
};
