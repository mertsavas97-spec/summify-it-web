import type { BlogCategoryId } from "@/data/blog-categories";
import { getBlogCategory } from "@/data/blog-categories";
import type { BlogAuthorInfo, BlogPost } from "@/data/blog-post-types";

export type {
  BlogAuthorInfo,
  BlogFaqItem,
  BlogPost,
  BlogRelatedLink,
  BlogTocItem,
} from "@/data/blog-post-types";
import { BestAiPdfSummarizersBody } from "@/components/blog/posts/best-ai-pdf-summarizers-2026";
import { YoutubeStudyNotesBody } from "@/components/blog/posts/youtube-videos-study-notes";
import { StudentsExamPrepBody } from "@/components/blog/posts/students-exam-prep-ai";
import { AiStudyNotesBlogBody } from "@/components/blog/posts/ai-study-notes-guide";
import { PdfToFlashcardsBlogBody } from "@/components/blog/posts/pdf-to-flashcards-workflow";
import { AUDIO_STUDY_BLOG_POSTS } from "@/data/audio-study-blog-registry";

const DEFAULT_AUTHOR: BlogAuthorInfo = {
  name: "Summify Editorial",
  role: "Product & learning workflows",
  bio: "Guides on AI document intelligence, Learn cards, and quizzes — for students and knowledge workers.",
  href: "/about",
};

function postCategory(id: BlogCategoryId): string {
  return getBlogCategory(id).name;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-ai-pdf-summarizers-2026",
    title: "Best AI PDF Summarizers in 2026: What to Look For",
    description:
      "How to choose an AI PDF summarizer without hype — accuracy, structure, study outputs, and when to summarize PDF online vs. skim manually.",
    date: "2026-05-10",
    updatedAt: "2026-05-18",
    categoryId: "comparisons",
    category: postCategory("comparisons"),
    tags: [
      "AI PDF summarizer",
      "summarize PDF online",
      "document summary tool",
      "free AI summarizer",
    ],
    keywords: [
      "best AI PDF summarizer",
      "summarize PDF online",
      "document summary tool",
      "AI PDF summarizer 2026",
    ],
    clusters: ["ai-pdf-summarizer", "research-workflows"],
    readingTime: "8 min read",
    featured: true,
    trending: true,
    author: DEFAULT_AUTHOR,
    faqs: [
      {
        q: "What should an AI PDF summarizer include beyond a short summary?",
        a: "Look for structured sections (insights, risks, actions), intelligence modes for your use case, and study outputs like Learn cards and quizzes — not only a paragraph dump.",
      },
      {
        q: "How do I verify an AI PDF summary is accurate?",
        a: "Spot-check names, dates, and numbers in the original PDF. Summify surfaces source-backed Learn cards so you can trace claims back to the document.",
      },
      {
        q: "Is Summify free for PDF summarization?",
        a: "Yes during public beta. Upload PDFs in the workspace, pick a mode, and get structured analysis plus Learn cards on the free tier.",
      },
    ],
    toc: [
      { id: "what-to-deliver", label: "What summarize PDF online should deliver" },
      { id: "criteria", label: "Criteria that matter" },
      { id: "study-outputs", label: "Study outputs: Learn cards & quiz" },
      { id: "try-summify", label: "Try Summify on your PDFs" },
    ],
    workflowCluster: "ai-pdf-summarizer",
    relatedLinks: [
      { href: "/summarize-pdf", label: "AI PDF summarizer workspace" },
      { href: "/compare/chatpdf", label: "Summify vs ChatPDF" },
      { href: "/upload", label: "Upload and analyze documents" },
    ],
    Content: BestAiPdfSummarizersBody,
  },
  {
    slug: "youtube-videos-into-study-notes",
    title: "How to Turn YouTube Videos Into Study Notes",
    description:
      "A practical workflow for turning lectures and explainers into structured study notes using transcripts, timestamps, and AI — without losing context.",
    date: "2026-05-12",
    updatedAt: "2026-05-17",
    categoryId: "youtube-summaries",
    category: postCategory("youtube-summaries"),
    tags: [
      "YouTube summarizer",
      "YouTube video to study notes AI",
      "summarize YouTube video with AI",
      "YouTube transcript summarizer",
    ],
    keywords: [
      "YouTube video to study notes",
      "AI YouTube summarizer",
      "summarize YouTube video with AI",
      "lecture notes from video",
    ],
    clusters: ["ai-youtube-summarizer", "study-workflows", "learn-cards"],
    readingTime: "7 min read",
    trending: true,
    author: DEFAULT_AUTHOR,
    faqs: [
      {
        q: "Can AI summarize a YouTube video without watching it?",
        a: "Yes — when a transcript is available, Summify analyzes the full transcript with intelligence modes and generates structured notes and Learn cards.",
      },
      {
        q: "Do YouTube study notes keep timestamps?",
        a: "Creator and Student modes emphasize beats and sections; verify clip-worthy moments against the transcript in your workspace.",
      },
      {
        q: "How do Learn cards help after a YouTube summary?",
        a: "Learn cards turn key ideas into recall prompts, then a post-learn quiz checks understanding — a full Summary → Learn → Quiz path.",
      },
    ],
    toc: [
      { id: "transcript-first", label: "Transcript-first workflow" },
      { id: "structure", label: "Structure your notes" },
      { id: "learn-quiz", label: "Learn cards and quiz" },
    ],
    workflowCluster: "ai-youtube-summarizer",
    relatedLinks: [
      { href: "/summarize-youtube-video", label: "YouTube video summarizer" },
      { href: "/for-students", label: "AI study notes for exam prep" },
      { href: "/upload", label: "Analyze a YouTube link" },
    ],
    Content: YoutubeStudyNotesBody,
  },
  {
    slug: "students-ai-summarizers-exam-prep",
    title: "How Students Use AI Summarizers for Exam Prep",
    description:
      "From lecture PDFs to practice quizzes — how students use AI study notes, flashcard-style Learn cards, and structured review without replacing real learning.",
    date: "2026-05-15",
    updatedAt: "2026-05-19",
    categoryId: "study-learning",
    category: postCategory("study-learning"),
    tags: [
      "AI study notes",
      "AI quiz from PDF",
      "exam prep from notes",
      "AI flashcard generator",
    ],
    keywords: [
      "AI study notes exam prep",
      "AI quiz from PDF",
      "Learn cards for students",
      "exam prep summarizer",
    ],
    clusters: ["study-workflows", "learn-cards", "ai-quiz-generation"],
    readingTime: "8 min read",
    featured: false,
    trending: true,
    author: DEFAULT_AUTHOR,
    faqs: [
      {
        q: "Should students replace reading with AI summarizers?",
        a: "No — use summaries as a structured first pass, then verify hard concepts in the source. Learn cards and quizzes support active recall, not passive skipping.",
      },
      {
        q: "How does Summify generate quizzes from lecture PDFs?",
        a: "After you complete Learn cards, Summify builds multiple-choice questions from your summary, insights, and accessible cards — with explanations.",
      },
      {
        q: "Which intelligence mode is best for exam prep?",
        a: "The Student mode weights concept and quiz-style Learn cards. Pair it with PDF or YouTube sources from your course.",
      },
    ],
    toc: [
      { id: "workflow", label: "Exam prep workflow" },
      { id: "learn-cards", label: "Learn cards" },
      { id: "quiz", label: "Post-learn quiz" },
    ],
    workflowCluster: "study-workflows",
    relatedLinks: [
      { href: "/for-students", label: "Summify for students" },
      { href: "/summarize-pdf", label: "Summarize PDF lecture notes" },
      { href: "/summarize-youtube-video", label: "Summarize YouTube lectures" },
    ],
    Content: StudentsExamPrepBody,
  },
  {
    slug: "ai-study-notes-guide",
    title: "AI Study Notes: A Practical Starter Guide",
    description:
      "How to build AI study notes from PDFs and videos without replacing real learning — modes, Learn cards, and verification habits.",
    date: "2026-05-16",
    updatedAt: "2026-05-19",
    categoryId: "study-learning",
    category: postCategory("study-learning"),
    tags: ["AI study notes", "exam prep", "Learn cards"],
    keywords: ["AI study notes guide", "study notes from PDF", "Learn cards AI"],
    clusters: ["study-workflows", "learn-cards", "ai-pdf-summarizer"],
    readingTime: "6 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "Align AI notes with your syllabus before generating.",
      "The Student mode weights quiz and concept cards.",
      "Verify claims in the original PDF or transcript.",
    ],
    faqs: [
      {
        q: "What is the difference between a summary and AI study notes?",
        a: "Study notes add structure for review: insights, risks, action items, and Learn cards tuned for recall — not a single compressed paragraph.",
      },
      {
        q: "Can I use the same workflow for PDFs and YouTube lectures?",
        a: "Yes. Summify supports both in one workspace with the same Summary → Learn → Quiz learning path.",
      },
    ],
    toc: [
      { id: "structure", label: "Structure beats length" },
      { id: "modes", label: "Pick the right mode" },
      { id: "review", label: "Review habits" },
    ],
    workflowCluster: "study-workflows",
    relatedLinks: [
      { href: "/guides/ai-study-notes-guide", label: "Full study notes guide" },
      { href: "/for-students", label: "Summify for students" },
      { href: "/upload", label: "Open workspace" },
    ],
    Content: AiStudyNotesBlogBody,
  },
  {
    slug: "pdf-to-flashcards-workflow",
    title: "PDF to Flashcards: A Quick Workflow",
    description:
      "Turn PDF chapters into Learn cards for self-quiz — chunking, The Student mode, and review loops that actually stick.",
    date: "2026-05-17",
    updatedAt: "2026-05-20",
    categoryId: "pdf-workflows",
    category: postCategory("pdf-workflows"),
    tags: ["PDF flashcards", "AI quiz from PDF", "Learn cards"],
    keywords: ["PDF to flashcards", "AI flashcard generator PDF", "Learn cards workflow"],
    clusters: ["ai-pdf-summarizer", "learn-cards", "ai-quiz-generation"],
    readingTime: "5 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "One chapter per session keeps cards focused.",
      "Edit generated cards — quality beats quantity.",
      "Schedule spaced review, not one-night cram generation.",
    ],
    faqs: [
      {
        q: "Are Learn cards the same as flashcards?",
        a: "Similar goal — active recall — but Learn cards are source-backed and typed (concept, fact, quiz) from your analysis, then tied to a post-learn quiz.",
      },
      {
        q: "How many PDF pages should I upload per session?",
        a: "One chapter or section keeps cards focused and improves quiz quality on the free tier.",
      },
    ],
    toc: [
      { id: "chunk", label: "Chunk your PDF" },
      { id: "generate", label: "Generate with The Student" },
      { id: "review", label: "Spaced review" },
    ],
    workflowCluster: "ai-pdf-summarizer",
    relatedLinks: [
      { href: "/guides/pdf-to-flashcards-workflow", label: "Full flashcards guide" },
      { href: "/summarize-pdf", label: "PDF summarizer" },
      { href: "/upload", label: "Open workspace" },
    ],
    Content: PdfToFlashcardsBlogBody,
  },
  ...AUDIO_STUDY_BLOG_POSTS,
];
