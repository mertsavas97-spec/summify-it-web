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
import { HowToSummarizePdfWithAiBody } from "@/components/blog/posts/how-to-summarize-a-pdf-with-ai";
import { SummarizePowerpointDecksWithAiBody } from "@/components/blog/posts/summarize-powerpoint-decks-with-ai";
import { PdfSummaryGeneratorVsManualNotesBody } from "@/components/blog/posts/pdf-summary-generator-vs-manual-notes";
import { NotebookLmAlternativesAudioBody } from "@/components/blog/posts/notebooklm-alternatives-audio";
import { FreePdfSummarizerLimits2026Body } from "@/components/blog/posts/free-pdf-summarizer-limits-2026";
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
    slug: "notebooklm-alternatives-audio",
    title: "NotebookLM Alternatives for Audio Study in 2026",
    description:
      "NotebookLM alternatives compared on audio summaries, privacy, free limits, and source types — plus source migration and an Audio Overview alternative.",
    date: "2026-10-13",
    updatedAt: "2026-10-13",
    categoryId: "comparisons",
    category: postCategory("comparisons"),
    tags: [
      "NotebookLM alternatives",
      "audio study",
      "Audio Overview alternative",
      "AI study tools",
    ],
    keywords: [
      "notebooklm alternatives",
      "notebooklm alternatives with audio",
      "audio overview alternative",
      "notebooklm privacy",
    ],
    clusters: ["study-workflows"],
    readingTime: "11 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "NotebookLM is strong at chat-with-sources; study outputs depend on your prompting.",
      "Compare alternatives on audio, privacy, free limits, and source types — not scores.",
      "Migration is a file problem: export originals, upload, rebuild in chunks.",
      "Read each tool's privacy policy before uploading anything sensitive.",
    ],
    faqs: [
      {
        q: "What is the best NotebookLM alternative for audio?",
        a: "It depends on the job. NotebookLM's Audio Overview suits conversational overviews; Summify's Audio Study Mode follows a study sequence (analysis, Learn cards, quiz, then a teacher-style lesson). Test both on one file you know well.",
      },
      {
        q: "Is Summify a free NotebookLM alternative?",
        a: "Partly. The free plan includes 5 analyses per day, 12 Learn cards per run, 4 core lenses, and up to 10 saved analyses, with 20 MB uploads. Audio lessons, podcasts, mind maps, and spaced repetition are paid features.",
      },
      {
        q: "Can I move my sources over from NotebookLM?",
        a: "Yes, as files. Export your original PDFs, documents, or slides and upload them to the workspace — no notebook integration is required. Rebuild in chunks and verify one document before processing the rest.",
      },
      {
        q: "Does Summify replace NotebookLM's chat?",
        a: "No. Summify is a structured analysis workspace: pick a lens, get a labeled analysis with Learn cards, then re-run another lens for a different angle. If freeform chat is your main need, NotebookLM is the better fit.",
      },
    ],
    toc: [
      { id: "what-notebooklm-does-well", label: "What NotebookLM does well" },
      { id: "alternatives", label: "NotebookLM alternatives compared" },
      { id: "audio-alternative", label: "An Audio Overview alternative" },
      { id: "migration", label: "Migration: moving your sources" },
      { id: "privacy", label: "Privacy and data retention" },
      { id: "how-to-choose", label: "How to choose in five minutes" },
      { id: "faq", label: "Frequently asked questions" },
    ],
    workflowCluster: "study-workflows",
    relatedLinks: [
      {
        href: "/audio-study",
        label: "Audio Study Mode",
        description: "Teacher-style audio lessons from your own analysis.",
      },
      {
        href: "/compare/notebooklm",
        label: "NotebookLM vs Summify",
        description: "Side-by-side product comparison.",
      },
      { href: "/upload", label: "Open workspace", description: "Upload sources and run an analysis." },
    ],
    Content: NotebookLmAlternativesAudioBody,
  },
  {
    slug: "free-pdf-summarizer-limits-2026",
    title: "Free PDF Summarizer Limits in 2026: What You Get",
    description:
      "What a free PDF summarizer includes in 2026: daily analysis limits, file size and format caps, privacy checks, and the moment upgrading makes sense.",
    date: "2026-10-06",
    updatedAt: "2026-10-06",
    categoryId: "comparisons",
    category: postCategory("comparisons"),
    tags: [
      "free PDF summarizer",
      "PDF summarizer free",
      "free plan limits",
      "AI PDF summarizer",
    ],
    keywords: [
      "free pdf summarizer limits",
      "pdf summarizer free",
      "free AI PDF summarizer",
      "free PDF summarizer 2026",
    ],
    clusters: ["ai-pdf-summarizer"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "Free on Summify means 5 analyses per day, 12 Learn cards per run, 4 core lenses, and 10 saved analyses.",
      "File constraints that matter: 20 MB per file, 50 pages, 90,000 characters on Free.",
      "Privacy is a policy question — check retention, training use, and access before uploading.",
      "Upgrade on named friction, not on a countdown banner.",
    ],
    faqs: [
      {
        q: "Are free PDF summarizers safe to use?",
        a: "They are safe for non-sensitive material once you have read the vendor's privacy policy and know the retention window. Skip anything under NDA or medical confidentiality, and verify important claims against the source document.",
      },
      {
        q: "Why do free plans have daily limits?",
        a: "Because analysis is compute, and a daily limit keeps free usage predictable. It also pushes the workflow that produces good results: choose the documents that matter, run them in chunks, and read what comes back.",
      },
      {
        q: "What happens when I reach the free daily limit?",
        a: "The workspace shows a daily-limit notice with a compact plan comparison, and the counter resets the next day. Saved analyses stay in place — hitting a cap pauses today's runs, it does not delete your history.",
      },
      {
        q: "Can I get through a whole semester on the free plan?",
        a: "If you work ahead, yes — five well-chosen analyses a day covers a chapter or two per session across a week. Long source documents, saved history, and audio are the three signs it is time to compare plans.",
      },
    ],
    toc: [
      { id: "free-plan", label: "What you actually get on the free plan" },
      { id: "limits", label: "File size and format limits compared" },
      { id: "how-it-works", label: "How a free PDF summarizer works" },
      { id: "privacy", label: "Privacy: what free tools do with your data" },
      { id: "method", label: "How we checked the limits in this post" },
      { id: "when-pro", label: "When upgrading to a paid plan makes sense" },
      { id: "faq", label: "Frequently asked questions" },
      { id: "checklist", label: "Quick checklist before you upload" },
    ],
    workflowCluster: "ai-pdf-summarizer",
    relatedLinks: [
      { href: "/summarize-pdf", label: "AI PDF summarizer", description: "Primary workflow for this cluster." },
      { href: "/pricing", label: "Pricing and plan limits", description: "Current plans, limits, and billing options." },
    ],
    Content: FreePdfSummarizerLimits2026Body,
  },
  {
    slug: "how-to-summarize-a-pdf-with-ai",
    title: "How to Summarize a PDF with AI (Without Losing Accuracy)",
    description:
      "A 2026 workflow to summarize PDF online with AI: prepare and chunk the file, pick a mode, verify facts, then study with Learn cards and quizzes.",
    date: "2026-07-24",
    updatedAt: "2026-07-24",
    categoryId: "pdf-workflows",
    category: postCategory("pdf-workflows"),
    tags: ["summarize PDF with AI", "AI PDF summarizer", "PDF study notes", "summarize PDF online"],
    keywords: [
      "how to summarize a PDF with AI",
      "summarize PDF online",
      "AI PDF summarizer workflow",
      "summarize PDF accurately",
    ],
    clusters: ["ai-pdf-summarizer", "study-workflows"],
    readingTime: "10 min read",
    featured: true,
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "Chunk by chapter or paper — whole textbooks dilute AI summaries.",
      "Pick Student vs Executive on purpose; mode changes what you get.",
      "Spot-check names, dates, and numbers before you memorize or cite.",
      "Learn cards + quiz turn compression into recall practice.",
    ],
    faqs: [
      {
        q: "What is the fastest way to summarize a PDF with AI?",
        a: "Upload one chapter or paper, pick a mode, run analysis, spot-check names and numbers, then study Learn cards from the same run.",
      },
      {
        q: "Should I upload an entire textbook at once?",
        a: "No. Smaller chunks produce clearer summaries and better quiz cards. Split by chapter or section.",
      },
      {
        q: "Which Summify mode should I use for exam prep PDFs?",
        a: "Start with The Student for concepts and quiz-friendly cards. Use Executive Brief for workplace reports, not textbooks.",
      },
      {
        q: "Can I trust an AI PDF summary for citations?",
        a: "Not without verification. Confirm every quote, number, and name in the original PDF before you cite.",
      },
    ],
    toc: [
      { id: "why-workflow", label: "Why a workflow beats one-click summarize" },
      { id: "prepare", label: "Prepare the PDF before you upload" },
      { id: "mode", label: "Pick an intelligence mode" },
      { id: "run", label: "Run the analysis and read structure first" },
      { id: "verify", label: "Verify before you trust" },
      { id: "study", label: "Study the output: Learn cards and quiz" },
      { id: "mistakes", label: "Common mistakes" },
      { id: "checklist", label: "Quick checklist" },
    ],
    workflowCluster: "ai-pdf-summarizer",
    relatedLinks: [
      { href: "/summarize-pdf", label: "AI PDF summarizer", description: "Primary money page for this cluster." },
      { href: "/upload", label: "Open workspace", description: "Upload and run analysis." },
      { href: "/modes/the-student", label: "The Student mode", description: "Study-focused lens." },
      { href: "/blog/best-ai-pdf-summarizers-2026", label: "What to look for in AI PDF summarizers" },
      { href: "/guides/pdf-to-flashcards-workflow", label: "PDF to flashcards guide" },
    ],
    Content: HowToSummarizePdfWithAiBody,
  },
  {
    slug: "summarize-powerpoint-decks-with-ai",
    title: "Summarize PowerPoint Decks with AI",
    description:
      "How to summarize PowerPoint (.pptx) with AI in 2026 — slide-aware structure, mode choice, Google Slides export tips, and pairing decks with PDF readings.",
    date: "2026-07-24",
    updatedAt: "2026-07-24",
    categoryId: "pptx-documents",
    category: postCategory("pptx-documents"),
    tags: ["summarize PowerPoint", "PPTX summarizer", "AI slide summary", "PowerPoint summarizer"],
    keywords: [
      "summarize PowerPoint with AI",
      "PowerPoint summarizer",
      "PPTX AI summary",
      "summarize PowerPoint decks",
    ],
    clusters: ["pptx-summarizer", "study-workflows"],
    readingTime: "9 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "Prefer native .pptx over PDF exports so slide boundaries stay intact.",
      "Executive Brief for pitches; The Student for training and lecture decks.",
      "Verify metrics and claims on the slides — AI should not invent transitions.",
      "Pair decks with PDF chapters when courses mix media.",
    ],
    faqs: [
      {
        q: "Can AI summarize Google Slides?",
        a: "Export as PPTX and upload. Native Google Drive import is not required for the PowerPoint summarizer workflow.",
      },
      {
        q: "Which mode is best for pitch decks?",
        a: "Executive Brief emphasizes decisions and narrative clarity. Use The Student for training or lecture decks.",
      },
      {
        q: "Why not convert the deck to PDF first?",
        a: "PDF flattens slide structure. A PPTX-aware summarizer uses slide order and titles for a clearer narrative map.",
      },
      {
        q: "What if slides are mostly images with no text?",
        a: "Expect a thin summary. Add speaker notes or pair the deck with a captioned lecture recording.",
      },
    ],
    toc: [
      { id: "why-pptx", label: "Why PPTX needs a different lens" },
      { id: "prepare", label: "Prepare the deck before upload" },
      { id: "mode", label: "Choose a mode that matches the audience" },
      { id: "workflow", label: "A practical deck workflow" },
      { id: "quality", label: "What good looks like" },
      { id: "pair", label: "Pair decks with PDFs and video" },
      { id: "mistakes", label: "Common mistakes" },
      { id: "next", label: "From slides to a study system" },
    ],
    workflowCluster: "pptx-summarizer",
    relatedLinks: [
      { href: "/summarize-powerpoint", label: "PowerPoint summarizer", description: "Primary PPTX landing." },
      { href: "/summarize-pdf", label: "PDF summarizer", description: "Pair readings with decks." },
      { href: "/modes/executive-brief", label: "Executive Brief mode" },
      { href: "/upload", label: "Open workspace" },
    ],
    Content: SummarizePowerpointDecksWithAiBody,
  },
  {
    slug: "pdf-summary-generator-vs-manual-notes",
    title: "PDF Summary Generator vs Manual Notes",
    description:
      "PDF summary generator vs handwritten notes in 2026 — when AI compression helps, when encoding wins, and a hybrid study loop that uses both.",
    date: "2026-07-24",
    updatedAt: "2026-07-24",
    categoryId: "pdf-workflows",
    category: postCategory("pdf-workflows"),
    tags: ["PDF summary generator", "study notes", "AI vs manual notes", "exam prep"],
    keywords: [
      "PDF summary generator",
      "AI summary vs notes",
      "summarize PDF for studying",
      "PDF summary generator vs manual notes",
    ],
    clusters: ["ai-pdf-summarizer", "study-workflows", "learn-cards"],
    readingTime: "10 min read",
    author: DEFAULT_AUTHOR,
    keyTakeaways: [
      "Generators win on long-document triage; manual notes win on encoding and high-stakes precision.",
      "Never cite or memorize unchecked AI prose.",
      "Hybrid loop: map with AI → quiz → handwrite only misses.",
      "Choose by document length, stakes, and exam format — not by habit.",
    ],
    faqs: [
      {
        q: "Is a PDF summary generator enough for exams?",
        a: "Rarely alone. Use it to map the document, then quiz yourself and rewrite weak spots by hand when the exam format requires it.",
      },
      {
        q: "Does Summify replace note-taking?",
        a: "No. It generates structured summaries and Learn cards so your manual notes can focus on what still needs encoding.",
      },
      {
        q: "When should I skip the generator entirely?",
        a: "On short, high-stakes PDFs you must cite or solve by hand — careful reading plus your own notes is often faster and safer.",
      },
      {
        q: "How do Learn cards fit into the hybrid loop?",
        a: "After you verify the summary, edit cards and quiz yourself; handwrite only the items you miss so effort stays targeted.",
      },
    ],
    toc: [
      { id: "generator", label: "What a PDF summary generator is good for" },
      { id: "manual", label: "When manual notes still win" },
      { id: "compare", label: "Side-by-side comparison" },
      { id: "hybrid", label: "A hybrid loop that sticks" },
      { id: "students", label: "Implications for students" },
      { id: "workplace", label: "Implications for professionals" },
      { id: "choose", label: "How to choose in under a minute" },
      { id: "bottom-line", label: "Bottom line" },
    ],
    workflowCluster: "ai-pdf-summarizer",
    relatedLinks: [
      { href: "/summarize-pdf", label: "PDF summarizer / generator", description: "Primary money page." },
      { href: "/for-students", label: "For students" },
      { href: "/blog/how-to-summarize-a-pdf-with-ai", label: "How to summarize a PDF with AI" },
      { href: "/guides/pdf-to-flashcards-workflow", label: "PDF to flashcards guide" },
    ],
    Content: PdfSummaryGeneratorVsManualNotesBody,
  },
  {
    slug: "best-ai-pdf-summarizers-2026",
    title: "Best AI PDF Summarizer Tools List 2026",
    description:
      "Compare the best AI PDF summarizer tools in 2026 on accuracy, study cards, and privacy. See what to test on your files, then try Summify free.",
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
        a: "Yes. Upload PDFs in the workspace, pick a mode, and get structured analysis plus Learn cards on the Free plan.",
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
      { href: "/guides/how-to-summarize-youtube-videos-with-ai", label: "YouTube video summarization guide" },
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
