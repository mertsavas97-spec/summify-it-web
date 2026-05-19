import type { ComponentType } from "react";
import { BestAiPdfSummarizersBody } from "@/components/blog/posts/best-ai-pdf-summarizers-2026";
import { YoutubeStudyNotesBody } from "@/components/blog/posts/youtube-videos-study-notes";
import { StudentsExamPrepBody } from "@/components/blog/posts/students-exam-prep-ai";

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
];
