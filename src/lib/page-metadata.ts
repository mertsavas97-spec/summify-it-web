/**
 * Optimized title + meta description per public route (brand suffix added by buildPageMetadata).
 */
import { buildPageMetadata } from "@/lib/seo";

export const pageSeo = {
  home: buildPageMetadata({
    title: "AI PDF & Document Summarizer with Study Notes",
    description:
      "Summify is an AI document intelligence workspace: summarize PDFs, YouTube videos, and PowerPoint decks with 29 intelligence modes, Learn cards, and mind maps. Free during public beta.",
    path: "/",
    keywords: [
      "AI PDF summarizer",
      "YouTube summarizer",
      "document intelligence",
      "AI study notes",
    ],
  }),

  upload: buildPageMetadata({
    title: "AI Document Summarizer Workspace",
    description:
      "Upload PDFs, decks, videos, web articles, DOCX, or TXT. Choose an intelligence mode and start summarizing instantly. Free during public beta.",
    path: "/upload",
  }),

  summarizePdf: buildPageMetadata({
    title: "AI PDF Summarizer & Study Notes",
    description:
      "Turn PDFs into structured summaries, insights, and AI study notes with Learn cards. Upload a report or paper and start summarizing instantly — free in beta.",
    path: "/summarize-pdf",
    keywords: ["AI PDF summarizer", "PDF study notes", "summarize PDF"],
  }),

  summarizeYoutube: buildPageMetadata({
    title: "AI YouTube Video Summarizer",
    description:
      "Extract YouTube transcripts and get structured video intelligence, key moments, and study-ready notes. Paste a link and analyze in one step — try free in beta.",
    path: "/summarize-youtube-video",
    keywords: ["YouTube summarizer", "transcript summary", "video notes AI"],
  }),

  summarizePowerpoint: buildPageMetadata({
    title: "AI PowerPoint Summarizer",
    description:
      "Summarize slide decks into executive insights, themes, and action items. Upload PPTX and analyze with intelligence modes. Try free during public beta.",
    path: "/summarize-powerpoint",
    keywords: ["PowerPoint summarizer", "PPTX AI summary", "deck analyzer"],
  }),

  summarizeWebArticles: buildPageMetadata({
    title: "AI Web Article Summarizer",
    description:
      "Paste a URL or upload article text for structured summaries, insights, and Learn cards. Intelligence modes for study, executive, and creator workflows — free in beta.",
    path: "/summarize-web-articles",
    keywords: ["article summarizer", "URL summarizer AI", "web page summary"],
  }),

  summarizeDocx: buildPageMetadata({
    title: "AI DOCX & Word Document Summarizer",
    description:
      "Upload Word .docx files for structured document intelligence — executive briefs, study notes, and contract first reads. Try free during public beta.",
    path: "/summarize-docx",
    keywords: ["DOCX summarizer", "Word document AI summary", "summarize docx"],
  }),

  summarizeMp3: buildPageMetadata({
    title: "AI Podcast & Audio Transcript Summarizer",
    description:
      "Turn podcast and interview transcripts into structured notes, hooks, and Learn cards. Works with TXT exports and captioned YouTube — try free in beta.",
    path: "/summarize-mp3",
    keywords: ["podcast summarizer AI", "audio transcript summary", "MP3 notes"],
  }),

  forStudents: buildPageMetadata({
    title: "AI Study Notes & Exam Prep",
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
    title: "AI Document Intelligence for Teams",
    description:
      "Turn reports, decks, and meeting transcripts into executive briefs teams can act on. Structured analysis and Learn cards — free during public beta.",
    path: "/for-teams",
    keywords: ["team document summarizer", "meeting summary AI", "executive brief"],
  }),

  forFreelancers: buildPageMetadata({
    title: "AI Summaries for Freelancers & Contracts",
    description:
      "First-pass reads on client briefs, SOWs, and agreements with Contract Summary and Executive Brief modes. Verify outputs — not legal advice.",
    path: "/for-freelancers",
    keywords: ["contract summary AI", "freelancer document tools", "client brief AI"],
  }),

  forResearchers: buildPageMetadata({
    title: "AI Research Paper & Article Summarizer",
    description:
      "Synthesize PDFs, preprints, and web articles into structured notes for literature review. The Student and General Summary modes — try free in beta.",
    path: "/for-researchers",
    keywords: ["research paper summarizer", "literature review AI", "academic PDF summary"],
  }),

  modes: buildPageMetadata({
    title: "29 AI Intelligence Modes for Documents & Video",
    description:
      "Browse executive, study, creator, and document intelligence lenses for PDFs, YouTube, decks, and articles. Five modes active in public beta — more unlocking with Pro.",
    path: "/modes",
    keywords: ["AI analysis modes", "document intelligence modes"],
  }),

  pricing: buildPageMetadata({
    title: "Pricing — AI Document Intelligence Plans",
    description:
      "Compare Free, Scholar, Pro, and Team plans for AI summarization, Learn cards, mind maps, memory review, and workspace features. Public beta pricing preview.",
    path: "/pricing",
  }),

  about: buildPageMetadata({
    title: "About Summify",
    description:
      "Summify is an AI document intelligence workspace for PDFs, videos, decks, and articles — with structured analysis and Learn cards. Explore the public beta.",
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
    title: "Blog — AI Summarization Guides",
    description:
      "Editorial guides on AI PDF summarizers, YouTube study notes, and exam prep workflows. Practical workflows for students and knowledge workers using Summify.",
    path: "/blog",
    keywords: ["AI summarizer guides", "PDF summarizer blog", "study notes AI"],
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
