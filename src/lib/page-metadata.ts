/**
 * Optimized title + meta description per public route (brand suffix added by buildPageMetadata).
 */
import { buildPageMetadata } from "@/lib/seo";

export const pageSeo = {
  home: buildPageMetadata({
    title: "AI Learning Platform — Audio Lessons, Study Cards & Quizzes",
    description:
      "Summify turns PDFs, videos, and articles into teacher-style audio lessons, smart study cards, and quizzes. Learn without a screen — free in beta.",
    path: "/",
    keywords: [
      "AI learning platform",
      "audio learning",
      "learn by listening",
      "PDF to audio",
      "study cards",
      "quiz from PDF",
    ],
  }),

  upload: buildPageMetadata({
    title: "AI Study Workspace — Upload, Learn & Listen",
    description:
      "Upload PDFs, decks, videos, articles, or text. Get audio lessons, study cards, quizzes, and memory-friendly review. Turn any document into a learning workflow. Free in beta.",
    path: "/upload",
    keywords: ["study workspace", "audio study mode", "AI learning platform"],
  }),

  summarizePdf: buildPageMetadata({
    title: "PDF to Audio Lessons & Study Cards",
    description:
      "Turn PDFs into audio lessons, study cards, and quizzes. Upload a report or paper and start learning — free in beta.",
    path: "/summarize-pdf",
    keywords: ["PDF to audio", "PDF study notes", "PDF learning"],
  }),

  summarizeYoutube: buildPageMetadata({
    title: "YouTube to Audio Study Lessons",
    description:
      "Turn YouTube transcripts into audio lessons, study cards, and quizzes. Paste a link and start learning — try free in beta.",
    path: "/summarize-youtube-video",
    keywords: ["YouTube to audio", "YouTube study notes", "video learning"],
  }),

  summarizePowerpoint: buildPageMetadata({
    title: "PowerPoint to Study Materials",
    description:
      "Turn slide decks into audio lessons, study cards, and quizzes. Upload PPTX and start learning. Try free during public beta.",
    path: "/summarize-powerpoint",
    keywords: ["PowerPoint to audio", "PPTX study", "deck learning"],
  }),

  summarizeWebArticles: buildPageMetadata({
    title: "Web Article to Audio Lessons & Study Cards",
    description:
      "Paste a URL or upload article text for audio lessons, study cards, and quizzes. Learn from articles on the go — free in beta.",
    path: "/summarize-web-articles",
    keywords: ["article to audio", "web article learning", "URL study"],
  }),

  summarizeDocx: buildPageMetadata({
    title: "DOCX & Word Document Study Tool",
    description:
      "Upload Word .docx files for audio lessons, study cards, and contract summaries. Learn from documents on the go — try free during public beta.",
    path: "/summarize-docx",
    keywords: ["DOCX learning", "Word document study", "DOCX to audio"],
  }),

  summarizeMp3: buildPageMetadata({
    title: "Podcast & Audio Transcript Study Tool",
    description:
      "Turn podcast and interview transcripts into study cards, quizzes, and audio lessons. Works with TXT exports and captioned YouTube — try free in beta.",
    path: "/summarize-mp3",
    keywords: ["podcast learning", "audio transcript study", "MP3 study"],
  }),

  pdfSummarizer: buildPageMetadata({
    title: "PDF to Audio Study System — Learn Without a Screen",
    description:
      "Turn long PDFs into audio lessons, study cards, quizzes, and memory-friendly review in one workspace.",
    path: "/pdf-summarizer",
    keywords: ["PDF to audio", "PDF study system", "PDF learning"],
  }),

  bestAiForStudying: buildPageMetadata({
    title: "Best AI for Studying in 2026 — Audio Lessons, Study Cards & Quizzes",
    description:
      "Summify turns your lecture notes, PDFs, and YouTube videos into audio lessons, study cards, and quizzes. Built for students who learn by listening.",
    path: "/best-ai-for-studying",
    keywords: ["best ai for studying", "ai study workspace", "active recall ai", "audio-first studying"],
  }),

  pdfToPodcast: buildPageMetadata({
    title: "Turn Any PDF Into a Podcast Study Session — Summify",
    description:
      "Convert dense PDFs into podcast-style lessons so you can study while commuting, walking, or between classes without losing structure.",
    path: "/pdf-to-podcast",
    keywords: ["pdf to podcast", "audio learning", "study while commuting", "podcast study tool"],
  }),

  youtubeVideoSummarizer: buildPageMetadata({
    title: "YouTube Video Summarizer for Lectures & Educational Content",
    description:
      "Summarize long YouTube lectures into clear notes, insights, and revision-ready structure, then continue learning with audio and workspace tools.",
    path: "/youtube-video-summarizer",
    keywords: ["youtube video summarizer", "lecture summarizer", "educational video notes"],
  }),

  aiNoteTool: buildPageMetadata({
    title: "AI Note Tool for Structured Study & Revision Workflows",
    description:
      "Organize ideas into structured notes, review loops, and audio study outputs in a calm AI knowledge workspace built for real learning.",
    path: "/ai-note-tool",
    keywords: ["ai note tool", "structured notes", "revision workflow", "knowledge workspace"],
  }),

  forStudents: buildPageMetadata({
    title: "AI Study Tool for Students — Audio Lessons, Learn Cards & Podcast Study",
    description:
      "Generate AI study notes, concepts, and quizzes from lectures, PDFs, and videos. Built for students — upload sources and start summarizing instantly. Free in beta.",
    path: "/for-students",
    keywords: ["AI study notes", "exam prep", "lecture summarizer"],
  }),

  forCreators: buildPageMetadata({
    title: "AI Content & Video Summarizer",
    description:
      "Mine hooks, angles, and repurposable moments from long-form video and articles. Creator-focused intelligence modes — try free during public beta.",
    path: "/for-creators",
    keywords: ["content repurposing AI", "podcast summary", "creator tools"],
  }),

  forTeams: buildPageMetadata({
    title: "AI Learning Platform for Teams",
    description:
      "Turn reports, decks, and meeting transcripts into shared audio lessons and study cards. Team learning workflows — free during public beta.",
    path: "/for-teams",
    keywords: ["team learning platform", "meeting summary AI", "executive brief"],
  }),

  forFreelancers: buildPageMetadata({
    title: "AI Summaries for Freelancers & Contracts",
    description:
      "First-pass reads on client briefs, SOWs, and agreements with Contract Summary and Executive Brief modes. Verify outputs — not legal advice.",
    path: "/for-freelancers",
    keywords: ["contract summary AI", "freelancer document tools", "client brief AI"],
  }),

  forResearchers: buildPageMetadata({
    title: "Research Paper Study Tool — Audio Lessons & Study Cards",
    description:
      "Turn PDFs, preprints, and web articles into audio lessons and study cards for literature review. The Student and General Summary modes — try free in beta.",
    path: "/for-researchers",
    keywords: ["research paper study", "literature review AI", "academic PDF learning"],
  }),

  modes: buildPageMetadata({
    title: "29 AI Study Modes for Documents & Video",
    description:
      "Browse executive, study, creator, and general learning modes for PDFs, YouTube, decks, and articles. Five modes active in public beta — more unlocking with Pro.",
    path: "/modes",
    keywords: ["AI study modes", "learning modes"],
  }),

  pricing: buildPageMetadata({
    title: "Pricing — AI Learning Platform Plans",
    description:
      "Compare Free, Scholar, Pro, and Team plans for audio lessons, study cards, quizzes, mind maps, and memory review. Public beta pricing preview.",
    path: "/pricing",
  }),

  about: buildPageMetadata({
    title: "About Summify",
    description:
      "Summify is an AI learning platform that turns PDFs, videos, decks, and articles into audio lessons, study cards, and quizzes. Explore the public beta.",
    path: "/about",
  }),

  faq: buildPageMetadata({
    title: "FAQ — Formats, Privacy, Learn Cards & AI Output",
    description:
      "Answers on uploads, privacy, intelligence modes, Learn cards, mind maps, memory review, free plans, and how to verify AI summaries during public beta.",
    path: "/faq",
  }),

  privacy: buildPageMetadata({
    title: "Privacy Policy",
    description:
      "How Summify handles uploads and AI processing during public beta. Plain-language overview of data flow, providers, and what we do not store yet.",
    path: "/privacy",
  }),

  terms: buildPageMetadata({
    title: "Terms of Use",
    description:
      "Terms for using the Summify workspace — acceptable use, AI output limitations, and service expectations.",
    path: "/terms",
  }),

  blog: buildPageMetadata({
    title: "Blog — AI PDF, YouTube, Learn Cards & Quiz Guides",
    description:
      "Guides on AI PDF summarizers, YouTube study notes, Learn cards, and post-learn quizzes. Topical hubs for study, research, and document intelligence workflows.",
    path: "/blog",
    keywords: [
      "AI PDF summarizer",
      "YouTube summarizer",
      "Learn cards",
      "AI quiz from PDF",
      "study notes AI",
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
