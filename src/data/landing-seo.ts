import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export const HOME_FAQS: FaqItem[] = [
  {
    q: "What is Summify?",
    a: "Summify is an AI document intelligence workspace. Upload PDFs, PowerPoint decks, YouTube videos, web articles, DOCX, or TXT, choose an intelligence mode, and get structured analysis plus Learn cards.",
  },
  {
    q: "Can Summify summarize YouTube videos?",
    a: "Yes. Paste a YouTube URL and Summify extracts the transcript, then runs analysis. Videos need available captions or transcripts.",
  },
  {
    q: "Does Summify create AI study notes?",
    a: "Yes. Modes like The Student emphasize concepts, quizzes, and recall-friendly Learn cards from PDFs, lectures, and videos.",
  },
  {
    q: "Is Summify free during public beta?",
    a: "Yes. The full workspace is free during public beta. Checkout and paid tiers are not enabled yet.",
  },
  {
    q: "Are uploaded documents stored permanently?",
    a: "No persistent library during beta. Files are processed for extraction and analysis on the server; we do not offer long-term document storage yet.",
  },
];

export const PDF_FAQS: FaqItem[] = [
  {
    q: "How does the AI PDF summarizer work?",
    a: "Upload a PDF in the workspace. Summify extracts text, you pick an intelligence mode, and the AI returns structured summaries, insights, and Learn cards — including quiz-friendly outputs for study.",
  },
  {
    q: "Can I summarize PDF online without installing software?",
    a: "Yes. Summify runs in the browser. Upload your PDF to the document analysis workspace and analyze in one flow.",
  },
  {
    q: "Does Summify generate a quiz from PDF content?",
    a: "Learn cards can include quiz-style prompts when using study-focused modes like The Student. Outputs are for review, not a formal LMS.",
  },
  {
    q: "What is the maximum PDF size?",
    a: "Standard upload limits apply during beta. Very long PDFs may be compacted for analysis while preserving structure.",
  },
];

export const YOUTUBE_FAQS: FaqItem[] = [
  {
    q: "How does the YouTube summarizer work?",
    a: "Paste a video URL. Summify fetches the transcript, profiles the content, and runs your chosen intelligence mode for structured notes and Learn cards.",
  },
  {
    q: "Can Summify summarize any YouTube video?",
    a: "The video needs an available transcript or captions. Videos without transcripts may not extract successfully.",
  },
  {
    q: "Does Summify provide timestamps?",
    a: "Analysis focuses on transcript content and themes. Timestamp-level navigation is on the roadmap; study notes reference key ideas from the full transcript.",
  },
  {
    q: "Is this a YouTube transcript summarizer?",
    a: "Yes. Summify is built for transcript-based intelligence — not downloading video files — so analysis reflects what was actually said.",
  },
];

export const PPTX_FAQS: FaqItem[] = [
  {
    q: "Can I upload PowerPoint presentations?",
    a: "Yes. Upload .pptx files in the workspace. Summify extracts slide text and runs presentation-aware analysis.",
  },
  {
    q: "How is this different from exporting slides to PDF?",
    a: "Summify understands slide structure, titles, and themes across the deck for narrative and gap analysis — not just flat text extraction.",
  },
  {
    q: "Which intelligence modes work best for decks?",
    a: "Executive Brief suits pitch and strategy decks. The Student helps with training material. Pick any active mode in the workspace.",
  },
  {
    q: "Does Summify support Google Slides?",
    a: "Export your deck as PPTX and upload it. Native Google Slides integration is not available in beta.",
  },
];

export const STUDENTS_FAQS: FaqItem[] = [
  {
    q: "How does Summify help with AI study notes?",
    a: "The Student mode emphasizes concepts, definitions, and quiz-ready Learn cards from PDFs, lectures, and YouTube content.",
  },
  {
    q: "Can I use Summify for exam prep?",
    a: "Yes. Turn readings and lecture videos into structured notes and self-quiz cards. Always verify material against your syllabus.",
  },
  {
    q: "Does Summify work with lecture recordings?",
    a: "Yes. Paste a YouTube link for a recorded lecture when captions exist, or upload slides and readings as PDF or PPTX.",
  },
  {
    q: "Is Summify free for students?",
    a: "The workspace is free during public beta. No student discount checkout is required today.",
  },
];

export const CREATORS_FAQS: FaqItem[] = [
  {
    q: "Can Summify act as a podcast summarizer?",
    a: "Yes, when you have a transcript or YouTube upload with captions. Analysis highlights hooks, themes, and repurposable angles.",
  },
  {
    q: "Does Summify find viral hooks?",
    a: "The Creator mode weights hook and connection Learn cards for social-first repurposing from long-form transcripts and articles.",
  },
  {
    q: "Can I go from YouTube to content ideas?",
    a: "Yes. Analyze a video in the workspace with The Creator mode, then use structured outputs and Learn cards for threads, newsletters, and clips.",
  },
  {
    q: "Is uploaded creator content stored?",
    a: "No long-term storage during beta. Process content for analysis only; do not upload material you cannot send to AI providers.",
  },
];

export const RELATED_LINKS = {
  core: [
    {
      href: "/upload",
      label: "Document analysis workspace",
      description: "Upload PDFs, videos, decks, and articles in one place.",
    },
    {
      href: "/modes",
      label: "Intelligence modes",
      description: "29 lenses — four active in public beta.",
    },
    {
      href: "/faq",
      label: "FAQ",
      description: "Formats, privacy, beta limits, and Pro modes.",
    },
  ] satisfies RelatedLinkItem[],
  pdf: [
    {
      href: "/summarize-youtube-video",
      label: "YouTube transcript summarizer",
      description: "Turn lecture and interview transcripts into notes.",
    },
    {
      href: "/for-students",
      label: "AI study notes",
      description: "Exam prep and quiz cards from readings.",
    },
    {
      href: "/upload",
      label: "Summarize PDF online",
      description: "Open the workspace and upload your file.",
    },
  ] satisfies RelatedLinkItem[],
  youtube: [
    {
      href: "/summarize-pdf",
      label: "AI PDF summarizer",
      description: "Papers and readings alongside video sources.",
    },
    {
      href: "/for-creators",
      label: "Content repurposing",
      description: "Hooks and angles from long-form video.",
    },
    {
      href: "/upload",
      label: "Analyze YouTube video",
      description: "Paste a URL in the workspace.",
    },
  ] satisfies RelatedLinkItem[],
  pptx: [
    {
      href: "/summarize-pdf",
      label: "AI PDF summarizer",
      description: "Reports and papers with the same engine.",
    },
    {
      href: "/modes/executive-brief",
      label: "Executive Brief mode",
      description: "Pitch and strategy deck analysis.",
    },
    {
      href: "/upload",
      label: "PowerPoint summarizer",
      description: "Upload PPTX in the workspace.",
    },
  ] satisfies RelatedLinkItem[],
  students: [
    {
      href: "/summarize-pdf",
      label: "Summarize PDF for study",
      description: "Textbooks, papers, and handouts.",
    },
    {
      href: "/summarize-youtube-video",
      label: "YouTube lecture notes",
      description: "Transcript-based class capture.",
    },
    {
      href: "/modes/the-student",
      label: "The Student mode",
      description: "Study-focused intelligence lens.",
    },
  ] satisfies RelatedLinkItem[],
  creators: [
    {
      href: "/summarize-youtube-video",
      label: "YouTube summarizer",
      description: "Transcript intelligence for video.",
    },
    {
      href: "/modes/the-creator",
      label: "The Creator mode",
      description: "Hooks and repurposing emphasis.",
    },
    {
      href: "/upload",
      label: "Open the workspace",
      description: "Analyze your next piece of content.",
    },
  ] satisfies RelatedLinkItem[],
  home: [
    {
      href: "/summarize-pdf",
      label: "AI PDF summarizer",
      description: "Summarize PDF online with Learn cards.",
    },
    {
      href: "/summarize-youtube-video",
      label: "YouTube summarizer",
      description: "Transcript-based video intelligence.",
    },
    {
      href: "/summarize-powerpoint",
      label: "PowerPoint summarizer",
      description: "PPTX slide deck analysis.",
    },
    {
      href: "/for-students",
      label: "AI study notes",
      description: "Exam prep from lectures and readings.",
    },
    {
      href: "/for-creators",
      label: "Creator workflows",
      description: "Repurpose long-form content.",
    },
    {
      href: "/modes",
      label: "Intelligence modes",
      description: "Browse all 29 lenses.",
    },
  ] satisfies RelatedLinkItem[],
};
