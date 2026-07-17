/**
 * Optimized title + meta description per public route (brand suffix added by buildPageMetadata).
 * Positioning: summarizer as SEO entry; study workspace as differentiation.
 */
import { buildPageMetadata } from "@/lib/seo";

export const pageSeo = {
  home: buildPageMetadata({
    title: "Free AI Summarizer — PDF, PowerPoint, YouTube & Articles",
    description:
      "Summarize PDFs, PowerPoint decks, YouTube videos, and web articles with AI. Get structured summaries, key insights, flashcards, and quizzes — free to try. Start now →",
    path: "/",
    keywords: [
      "pdf summarizer",
      "ai summarizer",
      "summarize pdf",
      "ai pdf summarizer",
      "powerpoint summarizer",
      "youtube summarizer",
      "document summarizer",
      "free ai summarizer",
    ],
  }),

  upload: buildPageMetadata({
    title: "AI Summarizer Workspace — Upload PDF, Link or Text",
    description:
      "Upload a PDF, PowerPoint, YouTube link, or article. Get an AI summary plus flashcards, quiz, and optional audio — one workspace for summarize → learn.",
    path: "/upload",
    keywords: [
      "ai summarizer",
      "pdf summarizer online",
      "summarize document",
      "study workspace",
    ],
  }),

  summarizePdf: buildPageMetadata({
    title: "Free AI PDF Summarizer — Summarize PDF Online",
    description:
      "Summarize any PDF with AI in seconds. Structured summary, key insights, flashcards, and quiz — no install required. Free to try. Upload your PDF →",
    path: "/summarize-pdf",
    keywords: [
      "pdf summarizer",
      "summarize pdf",
      "ai pdf summarizer",
      "pdf summary generator",
      "summarize pdf online",
      "free pdf summarizer",
      "pdf summarizer ai",
    ],
  }),

  summarizeYoutube: buildPageMetadata({
    title: "YouTube Video Summarizer AI — Instant Transcript Summary",
    description:
      "Paste a YouTube link and get an AI summary from the transcript — key points, study notes, flashcards, and quiz. Free to try.",
    path: "/summarize-youtube-video",
    keywords: [
      "youtube summarizer",
      "youtube video summarizer",
      "summarize youtube video",
      "ai video summary",
    ],
  }),

  summarizePowerpoint: buildPageMetadata({
    title: "PowerPoint Summarizer AI — Summarize PPTX Decks Online",
    description:
      "Upload a PowerPoint (.pptx) and get an AI slide summary — narrative, themes, key insights, and study cards. Free PPTX summarizer. Try now →",
    path: "/summarize-powerpoint",
    keywords: [
      "powerpoint summarizer",
      "summarize powerpoint",
      "ppt summarizer",
      "pptx summarizer",
      "presentation summarizer",
      "powerpoint summary ai",
    ],
  }),

  summarizeWebArticles: buildPageMetadata({
    title: "Web Article Summarizer AI — Paste a URL, Get Insights",
    description:
      "Paste any article URL for an AI summary with key insights, flashcards, and quiz. Fast web article summarizer — free to try.",
    path: "/summarize-web-articles",
    keywords: [
      "article summarizer",
      "web article summarizer",
      "summarize url",
      "ai article summary",
    ],
  }),

  summarizeDocx: buildPageMetadata({
    title: "DOCX Summarizer AI — Summarize Word Documents Online",
    description:
      "Upload a Word (.docx) file for an AI summary, key insights, and study cards. Built for briefs, contracts, and long docs — free to try.",
    path: "/summarize-docx",
    keywords: ["docx summarizer", "word document summarizer", "summarize docx"],
  }),

  summarizeMp3: buildPageMetadata({
    title: "Podcast & Audio Summarizer — Transcripts to Notes",
    description:
      "Turn podcast and interview transcripts into AI summaries, flashcards, and quizzes. Paste captions or TXT exports — free to try.",
    path: "/summarize-mp3",
    keywords: ["podcast summarizer", "audio summarizer", "summarize mp3"],
  }),

  /** @deprecated Redirects to /summarize-pdf — kept for typed imports during transition. */
  pdfSummarizer: buildPageMetadata({
    title: "Free AI PDF Summarizer — Summarize PDF Online",
    description:
      "Summarize any PDF with AI in seconds. Structured summary, key insights, flashcards, and quiz — no install required. Free to try. Upload your PDF →",
    path: "/summarize-pdf",
    keywords: [
      "pdf summarizer",
      "summarize pdf",
      "ai pdf summarizer",
      "pdf summary generator",
      "free pdf summarizer",
    ],
  }),

  videoSummarizer: buildPageMetadata({
    title: "Free YouTube Video Summarizer AI — Instant Summaries",
    description:
      "Summarize YouTube videos with AI. Get transcript-based key points, study notes, and quizzes from any captioned video. Free to try.",
    path: "/video-summarizer",
    keywords: [
      "youtube summarizer",
      "video summarizer",
      "summarize youtube video",
      "ai video summary",
    ],
  }),

  bestAiForStudying: buildPageMetadata({
    title: "Best AI for Studying 2026 — Summarize, Flashcards & Quizzes",
    description:
      "Summify turns lecture PDFs, notes, and YouTube videos into summaries, flashcards, and quizzes — then optional audio lessons for revision on the go.",
    path: "/best-ai-for-studying",
    keywords: [
      "best ai for studying",
      "ai study notes",
      "ai summarizer for students",
    ],
  }),

  pdfToPodcast: buildPageMetadata({
    title: "PDF to Podcast — Turn Documents Into Audio Study Sessions",
    description:
      "Convert PDFs into podcast-style study audio so you can listen while commuting or walking — after a clear AI summary of the source.",
    path: "/pdf-to-podcast",
    keywords: ["pdf to podcast", "pdf to audio", "study while commuting"],
  }),

  youtubeVideoSummarizer: buildPageMetadata({
    title: "YouTube Lecture Summarizer — Notes From Educational Videos",
    description:
      "Summarize long YouTube lectures into clear notes, insights, flashcards, and quizzes — then continue with audio study tools if you want.",
    path: "/youtube-video-summarizer",
    keywords: [
      "youtube lecture summarizer",
      "educational video summarizer",
      "youtube study notes",
    ],
  }),

  aiNoteTool: buildPageMetadata({
    title: "AI Note Tool — Structured Notes From Any Source",
    description:
      "Turn PDFs, lectures, and articles into structured study notes, flashcards, and quizzes in one AI workspace.",
    path: "/ai-note-tool",
    keywords: ["ai note tool", "ai study notes", "structured notes"],
  }),

  forStudents: buildPageMetadata({
    title: "AI Summarizer for Students — Notes, Flashcards & Quizzes",
    description:
      "Summarize lectures, PDFs, and YouTube videos into study notes, flashcards, and quizzes. Built for exam prep — free to try.",
    path: "/for-students",
    keywords: [
      "ai summarizer for students",
      "ai study notes",
      "pdf to study guide",
      "exam prep ai",
    ],
  }),

  forCreators: buildPageMetadata({
    title: "AI Content & Video Summarizer for Creators",
    description:
      "Mine hooks, angles, and repurposable moments from long-form video and articles with creator-focused intelligence modes.",
    path: "/for-creators",
    keywords: ["content repurposing ai", "youtube summarizer for creators"],
  }),

  forTeams: buildPageMetadata({
    title: "AI Document Summarizer for Teams — Briefs & Decks",
    description:
      "Turn reports, decks, and meeting transcripts into shared summaries and study cards. Executive briefs for faster alignment.",
    path: "/for-teams",
    keywords: ["team document summarizer", "executive brief ai"],
  }),

  forFreelancers: buildPageMetadata({
    title: "AI Contract Summary Tool for Freelancers",
    description:
      "First-pass reads on client briefs, SOWs, and agreements with Contract Summary mode. Informational only — not legal advice.",
    path: "/for-freelancers",
    keywords: ["contract summary ai", "ai contract summary"],
  }),

  forResearchers: buildPageMetadata({
    title: "Research Paper Summarizer AI — Literature Review Notes",
    description:
      "Summarize research PDFs and preprints into structured notes, insights, and study cards for literature review.",
    path: "/for-researchers",
    keywords: [
      "research paper summarizer",
      "literature review ai",
      "academic pdf summarizer",
    ],
  }),

  modes: buildPageMetadata({
    title: "AI Summarizer Modes — Study, Executive, Contract & More",
    description:
      "Browse intelligence modes for PDFs, YouTube, decks, and articles — General Summary, Student, Executive Brief, Contract Summary, and more.",
    path: "/modes",
    keywords: ["ai summarizer modes", "document intelligence modes"],
  }),

  pricing: buildPageMetadata({
    title: "Pricing — AI Summarizer Plans",
    description:
      "Compare Free, Scholar, Pro, and Team plans for AI summaries, flashcards, quizzes, audio lessons, and memory review.",
    path: "/pricing",
  }),

  about: buildPageMetadata({
    title: "About Summify — AI Summarizer & Study Workspace",
    description:
      "Summify is an AI summarizer that turns PDFs, videos, decks, and articles into structured summaries — then flashcards, quizzes, and optional audio lessons.",
    path: "/about",
  }),

  faq: buildPageMetadata({
    title: "FAQ — AI Summarizer, Formats, Privacy & Study Tools",
    description:
      "Answers on PDF/YouTube uploads, privacy, intelligence modes, flashcards, quizzes, free plans, and how to verify AI summaries.",
    path: "/faq",
  }),

  privacy: buildPageMetadata({
    title: "Privacy Policy",
    description:
      "How Summify handles uploads and AI processing during public beta. Plain-language overview of data flow, providers, and retention.",
    path: "/privacy",
  }),

  terms: buildPageMetadata({
    title: "Terms of Use",
    description:
      "Terms for using the Summify AI summarizer workspace — acceptable use, AI output limitations, and service expectations.",
    path: "/terms",
  }),

  blog: buildPageMetadata({
    title: "Blog — AI PDF Summarizer, Study Notes & Tool Guides",
    description:
      "Guides on AI PDF summarizers, YouTube study notes, NotebookLM alternatives, flashcards, and document intelligence workflows.",
    path: "/blog",
    keywords: [
      "AI PDF summarizer",
      "YouTube summarizer",
      "NotebookLM alternatives",
      "AI study notes",
    ],
  }),

  login: buildPageMetadata({
    title: "Sign In",
    description:
      "Sign in to Summify with email and password or a magic link. Analysis stays free without an account — sign in saves analyses to your dashboard.",
    path: "/login",
    noindex: true,
  }),

  account: buildPageMetadata({
    title: "Your Account",
    description: "Manage your Summify beta account, email, and sign-out.",
    path: "/account",
    noindex: true,
  }),
} as const;

/** SEO overrides for high-opportunity mode landing pages. */
export const modePageSeo: Partial<
  Record<
    string,
    { title: string; description: string; keywords?: string[] }
  >
> = {
  "general-summary": {
    title: "AI Document Summarizer — General Summary Mode",
    description:
      "Balanced AI summaries for any PDF, article, or transcript. Clear overview, key themes, and study-ready structure — free to try in Summify.",
    keywords: [
      "document summarizer",
      "ai summarizer",
      "general summary",
      "summarize document",
    ],
  },
  "contract-analyzer": {
    title: "AI Contract Summary Tool — Clauses & Obligations",
    description:
      "Upload a contract or agreement for an AI first-pass summary of clauses, obligations, and points to review. Informational only — not legal advice.",
    keywords: [
      "contract summary",
      "contract summary ai",
      "ai contract summary",
      "contract summarization ai",
    ],
  },
  "executive-brief": {
    title: "AI Executive Brief — Decision-Ready Document Summary",
    description:
      "Turn long reports and decks into C-suite style briefs: decisions, tradeoffs, risks, and next steps. Free to try.",
    keywords: ["executive brief", "executive summary ai", "decision brief"],
  },
  "the-student": {
    title: "AI Study Notes Mode — Concepts, Flashcards & Quizzes",
    description:
      "Student-focused AI summaries with definitions, flashcards, and recall quizzes from PDFs, lectures, and videos.",
    keywords: [
      "ai study notes",
      "study summaries",
      "pdf to study guide",
      "ai summarizer for students",
    ],
  },
};
