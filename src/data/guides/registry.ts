import type { GuideArticle } from "./types";
import { BestAiPdfSummarizersGuideBody } from "@/components/guides/best-ai-pdf-summarizers-2026";
import { YoutubeSummarizeGuideBody } from "@/components/guides/how-to-summarize-youtube-videos-with-ai";
import { AiStudyNotesGuideBody } from "@/components/guides/ai-study-notes-guide";
import { PdfToFlashcardsGuideBody } from "@/components/guides/pdf-to-flashcards-workflow";
import { ContractSummaryGuideBody } from "@/components/guides/contract-summary-ai-guide";

export const GUIDES: GuideArticle[] = [
  {
    slug: "best-ai-pdf-summarizers-2026",
    title: "Best AI PDF Summarizers in 2026: A Practical Buyer’s Guide",
    description:
      "How to evaluate AI PDF summarizers on structure, fidelity, study outputs, and privacy — with a framework you can apply before paying for any tool.",
    date: "2026-05-01",
    updatedAt: "2026-05-18",
    readingTime: "14 min read",
    category: "Guides",
    tags: ["AI PDF summarizer", "document summary tool", "summarize PDF online"],
    keyTakeaways: [
      "Judge summarizers on fidelity and structure, not star ratings.",
      "Study workflows need Learn-style outputs, not one-paragraph dumps.",
      "Always spot-check names, dates, and numbers against the source PDF.",
      "Privacy disclosures matter as much as output quality for sensitive PDFs.",
    ],
    toc: [
      { id: "what-to-expect", label: "What to expect from a PDF summarizer" },
      { id: "evaluation-criteria", label: "Evaluation criteria" },
      { id: "study-vs-executive", label: "Study vs. executive lenses" },
      { id: "privacy", label: "Privacy and retention" },
      { id: "summify-workflow", label: "How Summify fits" },
    ],
    faqs: [
      {
        q: "What is the best AI PDF summarizer in 2026?",
        a: "There is no universal winner. Choose based on your workflow — study notes, executive briefs, or contract first reads — and test on your own files.",
      },
      {
        q: "Are free AI PDF summarizers safe?",
        a: "Read privacy policies. Do not upload confidential material unless retention and provider use are acceptable.",
      },
      {
        q: "Can AI summarizers replace reading?",
        a: "No. Use them to orient and review faster, then verify critical claims in the source.",
      },
      {
        q: "Does Summify work for textbooks?",
        a: "Yes, with compaction on very long PDFs. The Student mode emphasizes concepts and quiz-style Learn cards.",
      },
    ],
    relatedLinks: [
      { href: "/summarize-pdf", label: "AI PDF summarizer", description: "Format landing and workspace CTA." },
      { href: "/blog/best-ai-pdf-summarizers-2026", label: "Shorter blog version", description: "Editorial overview on the blog." },
      { href: "/compare/chatpdf", label: "Summify vs ChatPDF", description: "Feature comparison." },
    ],
    Content: BestAiPdfSummarizersGuideBody,
  },
  {
    slug: "how-to-summarize-youtube-videos-with-ai",
    title: "How to Summarize YouTube Videos With AI (Without Losing Context)",
    description:
      "A step-by-step workflow for transcript-based YouTube intelligence — captions, modes, study notes, and verification habits that keep summaries trustworthy.",
    date: "2026-05-03",
    readingTime: "12 min read",
    category: "Guides",
    tags: ["YouTube summarizer", "transcript summary", "video study notes"],
    keyTakeaways: [
      "Transcript quality determines summary quality — captions must exist.",
      "Pick intelligence modes that match your goal: study, executive, or creator.",
      "Chunk long videos mentally by theme before trusting a single pass.",
      "Verify quotes and claims against the transcript before citing.",
    ],
    toc: [
      { id: "prerequisites", label: "Prerequisites: captions and transcripts" },
      { id: "workflow", label: "Step-by-step workflow" },
      { id: "modes", label: "Choosing an intelligence mode" },
      { id: "study-notes", label: "Turning output into study notes" },
      { id: "pitfalls", label: "Common pitfalls" },
    ],
    faqs: [
      {
        q: "Can AI summarize any YouTube video?",
        a: "Only when a transcript or captions are available. Videos without captions may fail extraction.",
      },
      {
        q: "Does Summify download video files?",
        a: "No. Analysis uses transcript text, reflecting what was spoken.",
      },
      {
        q: "How do I summarize lectures?",
        a: "Use The Student mode after pasting a captioned lecture URL for concept-heavy Learn cards.",
      },
      {
        q: "Are timestamps included?",
        a: "Analysis focuses on themes across the transcript. Timestamp navigation is on the roadmap.",
      },
    ],
    relatedLinks: [
      { href: "/summarize-youtube-video", label: "YouTube summarizer", description: "Product landing page." },
      { href: "/for-students", label: "For students", description: "Lecture and exam prep workflows." },
      { href: "/for-creators", label: "For creators", description: "Repurposing and hooks." },
    ],
    Content: YoutubeSummarizeGuideBody,
  },
  {
    slug: "ai-study-notes-guide",
    title: "The Complete Guide to AI Study Notes (2026)",
    description:
      "How to build reliable AI study notes from PDFs, lectures, and videos — modes, Learn cards, spaced review, and habits that keep AI useful for exam prep.",
    date: "2026-05-05",
    readingTime: "13 min read",
    category: "Guides",
    tags: ["AI study notes", "exam prep", "Learn cards"],
    keyTakeaways: [
      "Study notes need structure: concepts, misconceptions, and self-quiz prompts.",
      "The Student mode weights quiz and concept Learn cards for recall.",
      "Combine PDF and YouTube sources in one review session.",
      "AI notes supplement — never replace — syllabus-aligned study.",
    ],
    toc: [
      { id: "foundations", label: "Foundations of good study notes" },
      { id: "sources", label: "Sources: PDF, video, slides" },
      { id: "modes", label: "Intelligence modes for students" },
      { id: "learn-cards", label: "Learn cards and self-quiz" },
      { id: "review-habits", label: "Review habits that stick" },
    ],
    faqs: [
      {
        q: "Are AI study notes accurate?",
        a: "They can miss nuance. Always verify against your syllabus and original sources.",
      },
      {
        q: "Can Summify generate quizzes?",
        a: "Learn cards include quiz-style prompts in study modes. They are for self-review, not formal assessment.",
      },
      {
        q: "What formats work for study?",
        a: "PDF, PPTX, YouTube with captions, web articles, and pasted text.",
      },
      {
        q: "Is Summify free for students?",
        a: "The workspace is free during public beta.",
      },
    ],
    relatedLinks: [
      { href: "/for-students", label: "For students", description: "Segment landing page." },
      { href: "/modes/the-student", label: "The Student mode", description: "Study-focused lens." },
      { href: "/blog/ai-study-notes-guide", label: "Blog companion", description: "Shorter editorial post." },
    ],
    Content: AiStudyNotesGuideBody,
  },
  {
    slug: "pdf-to-flashcards-workflow",
    title: "PDF to Flashcards: A Modern Workflow With AI",
    description:
      "Turn PDF chapters into review-ready Learn cards — export habits, mode selection, and how to avoid shallow flashcards that fail exams.",
    date: "2026-05-07",
    readingTime: "11 min read",
    category: "Guides",
    tags: ["PDF flashcards", "AI quiz from PDF", "Learn cards"],
    keyTakeaways: [
      "Flashcards work when they test understanding, not isolated sentences.",
      "The Student mode produces concept, quiz, and misconception cards.",
      "One PDF chapter per session keeps cards focused.",
      "Review on a schedule — generation is only half the workflow.",
    ],
    toc: [
      { id: "why-flashcards", label: "Why flashcards still matter" },
      { id: "upload", label: "Upload and chunk your PDF" },
      { id: "learn-output", label: "Learn card types" },
      { id: "review-loop", label: "The review loop" },
      { id: "mistakes", label: "Mistakes to avoid" },
    ],
    faqs: [
      {
        q: "Does Summify export to Anki?",
        a: "Direct Anki export is on the roadmap. Today, review Learn cards in the workspace and memory review flows.",
      },
      {
        q: "How many cards per PDF?",
        a: "Card count varies by length and mode. Focus on quality over quantity.",
      },
      {
        q: "Can I use scanned PDFs?",
        a: "Text extraction quality depends on scan clarity. Prefer digital PDFs when possible.",
      },
      {
        q: "Which mode for flashcards?",
        a: "The Student mode weights quiz and concept cards highest.",
      },
    ],
    relatedLinks: [
      { href: "/summarize-pdf", label: "PDF summarizer", description: "Start with your chapter upload." },
      { href: "/for-students", label: "For students", description: "Exam prep positioning." },
      { href: "/blog/pdf-to-flashcards-workflow", label: "Blog companion", description: "Shorter walkthrough." },
    ],
    Content: PdfToFlashcardsGuideBody,
  },
  {
    slug: "contract-summary-ai-guide",
    title: "Contract Summary With AI: A Safe First-Pass Workflow",
    description:
      "How freelancers and teams use AI for contract first reads — what Contract Summary mode does, what it cannot do, and verification steps before you sign.",
    date: "2026-05-09",
    readingTime: "10 min read",
    category: "Guides",
    tags: ["contract summary AI", "agreement review", "DOCX contracts"],
    keyTakeaways: [
      "AI contract summaries are informational — not legal advice.",
      "Upload DOCX or PDF and use Contract Summary mode for obligation highlights.",
      "Flag ambiguous clauses and verify every date and party name in source.",
      "Do not upload material you cannot send to AI providers.",
    ],
    toc: [
      { id: "scope", label: "What AI contract summary can do" },
      { id: "limits", label: "Limits and disclaimers" },
      { id: "workflow", label: "Recommended workflow" },
      { id: "freelancers", label: "Freelancer checklist" },
      { id: "teams", label: "Team procurement use" },
    ],
    faqs: [
      {
        q: "Is Summify legal advice?",
        a: "No. Contract Summary produces informational overviews. Consult qualified counsel for binding decisions.",
      },
      {
        q: "Which file types work?",
        a: "PDF and DOCX uploads in the workspace.",
      },
      {
        q: "Can AI spot missing clauses?",
        a: "It may flag gaps heuristically. Never rely on AI alone for completeness.",
      },
      {
        q: "Is client data stored?",
        a: "No long-term document library during beta. See Privacy for processing details.",
      },
    ],
    relatedLinks: [
      { href: "/modes/contract-analyzer", label: "Contract Summary mode", description: "Product mode page." },
      { href: "/for-freelancers", label: "For freelancers", description: "Segment landing." },
      { href: "/summarize-docx", label: "DOCX summarizer", description: "Word agreement uploads." },
    ],
    Content: ContractSummaryGuideBody,
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
