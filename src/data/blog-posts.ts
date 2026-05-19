import type { ComponentType } from "react";
import { BestAiPdfSummarizersBody } from "@/components/blog/posts/best-ai-pdf-summarizers-2026";
import { YoutubeStudyNotesBody } from "@/components/blog/posts/youtube-videos-study-notes";
import { StudentsExamPrepBody } from "@/components/blog/posts/students-exam-prep-ai";
import { AiStudyNotesBlogBody } from "@/components/blog/posts/ai-study-notes-guide";
import { PdfToFlashcardsBlogBody } from "@/components/blog/posts/pdf-to-flashcards-workflow";

export type BlogTocItem = {
  id: string;
  label: string;
};

export type BlogRelatedLink = {
  href: string;
  label: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  readingTime: string;
  relatedLinks: BlogRelatedLink[];
  keyTakeaways?: string[];
  toc?: BlogTocItem[];
  Content: ComponentType;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-ai-pdf-summarizers-2026",
    title: "Best AI PDF Summarizers in 2026: What to Look For",
    description:
      "How to choose an AI PDF summarizer without hype — accuracy, structure, study outputs, and when to summarize PDF online vs. skim manually.",
    date: "2026-05-10",
    category: "Guides",
    tags: [
      "AI PDF summarizer",
      "summarize PDF online",
      "document summary tool",
      "free AI summarizer",
    ],
    readingTime: "8 min read",
    relatedLinks: [
      { href: "/summarize-pdf", label: "AI PDF summarizer workspace" },
      { href: "/upload", label: "Upload and analyze documents" },
      { href: "/for-students", label: "AI study notes for students" },
    ],
    Content: BestAiPdfSummarizersBody,
  },
  {
    slug: "youtube-videos-into-study-notes",
    title: "How to Turn YouTube Videos Into Study Notes",
    description:
      "A practical workflow for turning lectures and explainers into structured study notes using transcripts, timestamps, and AI — without losing context.",
    date: "2026-05-12",
    category: "Study",
    tags: [
      "YouTube summarizer",
      "YouTube video to study notes AI",
      "summarize YouTube video with AI",
      "YouTube transcript summarizer",
    ],
    readingTime: "7 min read",
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
    category: "Students",
    tags: [
      "AI study notes",
      "AI quiz from PDF",
      "exam prep from notes",
      "AI flashcard generator",
    ],
    readingTime: "8 min read",
    relatedLinks: [
      { href: "/for-students", label: "Summify for students" },
      { href: "/summarize-pdf", label: "Summarize PDF lecture notes" },
      { href: "/summarize-youtube-video", label: "Summarize YouTube lectures" },
      { href: "/upload", label: "Start in the workspace" },
    ],
    Content: StudentsExamPrepBody,
  },
  {
    slug: "ai-study-notes-guide",
    title: "AI Study Notes: A Practical Starter Guide",
    description:
      "How to build AI study notes from PDFs and videos without replacing real learning — modes, Learn cards, and verification habits.",
    date: "2026-05-16",
    category: "Study",
    tags: ["AI study notes", "exam prep", "Learn cards"],
    readingTime: "6 min read",
    keyTakeaways: [
      "Align AI notes with your syllabus before generating.",
      "The Student mode weights quiz and concept cards.",
      "Verify claims in the original PDF or transcript.",
    ],
    toc: [
      { id: "structure", label: "Structure beats length" },
      { id: "modes", label: "Pick the right mode" },
      { id: "review", label: "Review habits" },
    ],
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
    category: "Study",
    tags: ["PDF flashcards", "AI quiz from PDF", "Learn cards"],
    readingTime: "5 min read",
    keyTakeaways: [
      "One chapter per session keeps cards focused.",
      "Edit generated cards — quality beats quantity.",
      "Schedule spaced review, not one-night cram generation.",
    ],
    toc: [
      { id: "chunk", label: "Chunk your PDF" },
      { id: "generate", label: "Generate with The Student" },
      { id: "review", label: "Spaced review" },
    ],
    relatedLinks: [
      { href: "/guides/pdf-to-flashcards-workflow", label: "Full flashcards guide" },
      { href: "/summarize-pdf", label: "PDF summarizer" },
      { href: "/upload", label: "Open workspace" },
    ],
    Content: PdfToFlashcardsBlogBody,
  },
];
