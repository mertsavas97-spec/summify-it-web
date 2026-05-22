import type { BlogPost } from "@/data/blog-post-types";
import { getBlogCategory } from "@/data/blog-categories";
import {
  AiStudyCompanionWorkflowsBody,
  AiTeacherVoiceResearchBody,
  AudioLearningVsRereadingBody,
  BestAiAudioStudyTools2026Body,
  LearnWhileWalkingBody,
  LectureNotesToSpokenBody,
  PassiveLearningWithAiBody,
  PdfToAudioLessonsBody,
  StudyWhileCommutingBody,
  SummaryQuizToAudioBody,
} from "@/components/blog/posts/audio-study-collection";

const DEFAULT_AUTHOR = {
  name: "Summify Editorial",
  role: "Product & learning workflows",
  bio: "Guides on AI document intelligence, voice study, Learn cards, and quizzes.",
  href: "/about",
} as const;

function cat(
  id: "study-learning" | "pdf-workflows" | "productivity" | "comparisons" | "ai-research",
) {
  return getBlogCategory(id).name;
}

const UPLOAD = { href: "/upload", label: "Open workspace" };
const AUDIO = { href: "/audio-study", label: "Audio Study Mode" };

export const AUDIO_STUDY_BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-ai-audio-study-tools-2026",
    title: "Best AI Audio Study Tools in 2026",
    description:
      "How to choose AI audio study tools — lesson structure, source grounding, quiz pairing, and English learn outputs from any document language.",
    date: "2026-05-18",
    updatedAt: "2026-05-20",
    categoryId: "comparisons",
    category: cat("comparisons"),
    tags: ["audio study", "AI voice study", "learn by listening"],
    keywords: ["best AI audio study tools", "AI voice study 2026", "audio study app"],
    clusters: ["study-workflows"],
    readingTime: "12 min read",
    featured: true,
    trending: true,
    author: DEFAULT_AUTHOR,
    faqs: [
      {
        q: "What makes an AI audio study tool different from TTS?",
        a: "Lesson scripts with pedagogy and source grounding — not reading summaries aloud.",
      },
    ],
    toc: [
      { id: "criteria", label: "What to look for" },
      { id: "compare", label: "vs generic TTS" },
      { id: "workflow", label: "Workflow" },
    ],
    relatedLinks: [AUDIO, { href: "/pdf-to-audio-study", label: "PDF to audio study" }, UPLOAD],
    Content: BestAiAudioStudyTools2026Body,
  },
  {
    slug: "how-to-turn-pdfs-into-audio-lessons",
    title: "How to Turn PDFs Into Audio Lessons",
    description:
      "Step-by-step PDF to audio lesson workflow: chunk chapters, Learn cards, quiz, then teacher-style voice study with Summify.",
    date: "2026-05-18",
    updatedAt: "2026-05-20",
    categoryId: "pdf-workflows",
    category: cat("pdf-workflows"),
    tags: ["PDF audio", "audio lessons", "PDF study"],
    keywords: ["turn PDF into audio", "PDF audio lesson", "listen to PDF study"],
    clusters: ["ai-pdf-summarizer", "study-workflows"],
    readingTime: "11 min read",
    author: DEFAULT_AUTHOR,
    faqs: [
      {
        q: "How long should a PDF audio lesson be?",
        a: "Roughly four to eight minutes per chapter keeps retention high on commutes.",
      },
    ],
    toc: [
      { id: "chunk", label: "Chunk the PDF" },
      { id: "learn-first", label: "Learn first" },
      { id: "listen", label: "Listen with intent" },
    ],
    relatedLinks: [
      { href: "/summarize-pdf", label: "PDF summarizer" },
      { href: "/pdf-to-audio-study", label: "PDF to audio study" },
      UPLOAD,
    ],
    Content: PdfToAudioLessonsBody,
  },
  {
    slug: "learn-while-walking-ai-voice-study",
    title: "Learn While Walking Using AI Voice Study",
    description:
      "Safe, effective walking study habits with AI voice lessons — session length, quiz-first review, and teacher-style audio.",
    date: "2026-05-19",
    updatedAt: "2026-05-20",
    categoryId: "study-learning",
    category: cat("study-learning"),
    tags: ["learn while walking", "voice study", "passive learning"],
    keywords: ["learn while walking", "study walking AI", "audio study commute"],
    clusters: ["study-workflows"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "safety", label: "Safety" },
      { id: "length", label: "Session length" },
      { id: "pair", label: "Pair with quiz" },
    ],
    relatedLinks: [
      { href: "/learn-by-listening", label: "Learn by listening" },
      AUDIO,
      UPLOAD,
    ],
    Content: LearnWhileWalkingBody,
  },
  {
    slug: "ai-study-companion-workflows",
    title: "AI Study Companion Workflows",
    description:
      "Summify as an AI study companion: summarize, learn, quiz, and listen in one workspace — without replacing critical reading.",
    date: "2026-05-19",
    updatedAt: "2026-05-20",
    categoryId: "study-learning",
    category: cat("study-learning"),
    tags: ["AI study companion", "study workflow", "voice study"],
    keywords: ["AI study companion", "study platform AI", "learn practice listen"],
    clusters: ["study-workflows"],
    readingTime: "9 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [{ id: "four-pass", label: "Four-pass model" }],
    relatedLinks: [AUDIO, UPLOAD],
    Content: AiStudyCompanionWorkflowsBody,
  },
  {
    slug: "summary-quiz-to-audio-learning",
    title: "From Summary to Quiz to Audio Learning",
    description:
      "Why the best AI study path runs summary → Learn → quiz → audio — and how each step targets a different memory process.",
    date: "2026-05-19",
    updatedAt: "2026-05-20",
    categoryId: "study-learning",
    category: cat("study-learning"),
    tags: ["quiz", "audio learning", "study path"],
    keywords: ["summary quiz audio", "AI study workflow", "audio learning path"],
    clusters: ["study-workflows", "ai-quiz-generation"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "summary", label: "Summary" },
      { id: "quiz", label: "Quiz" },
      { id: "audio", label: "Audio" },
    ],
    relatedLinks: [AUDIO, UPLOAD],
    Content: SummaryQuizToAudioBody,
  },
  {
    slug: "audio-learning-vs-rereading",
    title: "Audio Learning vs Rereading: What Works Better?",
    description:
      "Compare audio learning and rereading for retention — when to listen, when to read visuals again, and how to sequence both.",
    date: "2026-05-20",
    updatedAt: "2026-05-20",
    categoryId: "study-learning",
    category: cat("study-learning"),
    tags: ["audio learning", "rereading", "retention"],
    keywords: ["audio learning vs rereading", "listen or reread", "study retention"],
    clusters: ["study-workflows"],
    readingTime: "11 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "rereading", label: "Rereading" },
      { id: "audio-win", label: "When audio wins" },
    ],
    relatedLinks: [
      { href: "/learn-by-listening", label: "Learn by listening" },
      UPLOAD,
    ],
    Content: AudioLearningVsRereadingBody,
  },
  {
    slug: "passive-learning-with-ai",
    title: "Passive Learning With AI (Without Foolish Passive Listening)",
    description:
      "Use AI for passive learning the right way — quiz-first encoding, short teacher-style lessons, and scheduled listen blocks.",
    date: "2026-05-20",
    updatedAt: "2026-05-20",
    categoryId: "productivity",
    category: cat("productivity"),
    tags: ["passive learning", "AI study", "audio study"],
    keywords: ["passive learning AI", "passive study audio", "AI listening study"],
    clusters: ["study-workflows"],
    readingTime: "9 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "active-first", label: "Active first" },
      { id: "structure", label: "Structure" },
    ],
    relatedLinks: [
      { href: "/ai-audio-study-guide", label: "AI audio study guide" },
      AUDIO,
    ],
    Content: PassiveLearningWithAiBody,
  },
  {
    slug: "ai-teacher-voice-research-papers",
    title: "AI Teacher Voice for Research Papers",
    description:
      "Hear research paper structure before deep annotation — audio skim workflows for PDFs with English learn outputs.",
    date: "2026-05-20",
    updatedAt: "2026-05-20",
    categoryId: "ai-research",
    category: cat("ai-research"),
    tags: ["research papers", "AI teacher voice", "audio skim"],
    keywords: ["AI teacher voice research", "listen to research paper", "paper audio study"],
    clusters: ["research-workflows"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "skim", label: "Audio skim" },
      { id: "citations", label: "Citations" },
    ],
    relatedLinks: [
      { href: "/for-researchers", label: "For researchers" },
      { href: "/teacher-style-ai-learning", label: "Teacher-style AI" },
      UPLOAD,
    ],
    Content: AiTeacherVoiceResearchBody,
  },
  {
    slug: "lecture-notes-to-spoken-lessons",
    title: "Turn Lecture Notes Into Spoken Lessons",
    description:
      "Convert slides and lecture PDFs into spoken study sessions — Student mode, Learn cards, quiz, and Audio Study.",
    date: "2026-05-20",
    updatedAt: "2026-05-20",
    categoryId: "study-learning",
    category: cat("study-learning"),
    tags: ["lecture notes", "spoken lessons", "PPTX study"],
    keywords: ["lecture notes to audio", "spoken lessons AI", "slide deck study audio"],
    clusters: ["study-workflows"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "slides", label: "Slides" },
      { id: "english", label: "English outputs" },
    ],
    relatedLinks: [
      { href: "/summarize-powerpoint", label: "PowerPoint summarizer" },
      { href: "/for-students", label: "For students" },
      UPLOAD,
    ],
    Content: LectureNotesToSpokenBody,
  },
  {
    slug: "study-with-ai-while-commuting",
    title: "Study With AI While Commuting",
    description:
      "Commute-friendly AI study plans: short voice lessons, quiz-driven listening, and weekly audio queues from your analyses.",
    date: "2026-05-20",
    updatedAt: "2026-05-20",
    categoryId: "productivity",
    category: cat("productivity"),
    tags: ["commute study", "AI audio", "voice study"],
    keywords: ["study while commuting", "commute audio study", "AI study transit"],
    clusters: ["study-workflows"],
    readingTime: "10 min read",
    trending: true,
    author: DEFAULT_AUTHOR,
    faqs: [],
    toc: [
      { id: "transit", label: "Transit" },
      { id: "noise", label: "Noise" },
    ],
    relatedLinks: [
      { href: "/learn-by-listening", label: "Learn by listening" },
      AUDIO,
      UPLOAD,
    ],
    Content: StudyWhileCommutingBody,
  },
];
