import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";

export const HOME_FAQS: FaqItem[] = [
  {
    q: "What is Summify?",
    a: "Summify is an AI summarizer for PDFs, PowerPoint decks, YouTube videos, and web articles. You get a structured summary and key insights — then flashcards, quizzes, and optional audio lessons so you can actually study what you summarize.",
  },
  {
    q: "Is Summify a PDF summarizer?",
    a: "Yes. Upload a PDF and get an AI summary with insights, flashcards, and a quiz. It also works with PowerPoint, YouTube transcripts, Word docs, and article URLs.",
  },
  {
    q: "Can Summify summarize YouTube videos?",
    a: "Yes. Paste a YouTube URL and Summify extracts the transcript, then runs analysis. Videos need available captions or transcripts.",
  },
  {
    q: "Does Summify create study notes and flashcards?",
    a: "Yes. After the summary, you can open Learn cards and quizzes — especially with study-focused modes like The Student.",
  },
  {
    q: "Can I listen to my summary as audio?",
    a: "Pro plans include Audio Study Mode — teacher-style spoken lessons generated from your analysis, with natural voice audio and full playback controls.",
  },
  {
    q: "Is Summify free?",
    a: "Yes. You can try analysis free during public beta. Checkout and paid tiers unlock higher limits and audio features.",
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

export const WEB_FAQS: FaqItem[] = [
  {
    q: "How does the web article summarizer work?",
    a: "Paste a public URL in the workspace. Summify extracts readable article text, you pick an intelligence mode, and receive structured summaries, insights, and Learn cards.",
  },
  {
    q: "Can Summify summarize paywalled articles?",
    a: "Summify needs publicly reachable content for URL extraction. Save articles as PDF or DOCX when paywalls block automated fetch.",
  },
  {
    q: "Which modes work best for articles?",
    a: "General Summary for neutral reads, Executive Brief for leadership content, The Student for study notes, and The Creator for repurposing long posts.",
  },
  {
    q: "Does Summify store article URLs?",
    a: "URLs are processed for extraction during analysis. No permanent article library is offered during public beta.",
  },
];

export const DOCX_FAQS: FaqItem[] = [
  {
    q: "Can I upload Word .docx files?",
    a: "Yes. Upload DOCX in the workspace alongside PDF and TXT. Summify extracts headings and body text for mode-specific analysis.",
  },
  {
    q: "Does Summify work with Google Docs?",
    a: "Export your document as .docx and upload it. Native Google Docs integration is not available in beta.",
  },
  {
    q: "Is Contract Summary available for DOCX agreements?",
    a: "Yes. Contract Summary mode highlights obligations and ambiguous clauses for human review — not legal advice.",
  },
  {
    q: "What is the maximum DOCX size?",
    a: "Standard upload limits apply during beta. Very long documents may be compacted while preserving structure.",
  },
];

export const MP3_FAQS: FaqItem[] = [
  {
    q: "Can Summify summarize MP3 audio files directly?",
    a: "Summify analyzes transcript text. Upload TXT transcripts, paste captions, or use YouTube URLs when captions exist.",
  },
  {
    q: "Does Summify work as a podcast summarizer?",
    a: "Yes, when you have episode transcripts. The Creator mode emphasizes hooks and repurposing from spoken content.",
  },
  {
    q: "Can I summarize meeting recordings?",
    a: "Provide a transcript export. Captioned webinar uploads on YouTube also work when transcripts are available.",
  },
  {
    q: "Does Summify generate timestamps?",
    a: "Analysis focuses on transcript themes. Timestamp navigation is on the roadmap; verify quotes in the source recording.",
  },
];

export const TEAMS_FAQS: FaqItem[] = [
  {
    q: "How do teams use Summify?",
    a: "Upload reports, decks, and meeting transcripts. Executive Brief mode produces decision-ready summaries with risks and next actions.",
  },
  {
    q: "Is there a Team plan?",
    a: "Team pricing is previewed on the pricing page. Public beta workspace access is free today.",
  },
  {
    q: "Can teammates share analyses?",
    a: "Saved analyses support optional public share links. Team workspaces with roles are on the roadmap.",
  },
  {
    q: "What formats do teams use most?",
    a: "PDF reports, PowerPoint decks, web articles, and YouTube recordings with captions for async review.",
  },
];

export const FREELANCERS_FAQS: FaqItem[] = [
  {
    q: "Can freelancers summarize client contracts?",
    a: "Yes. Upload DOCX or PDF and use Contract Summary for a first-pass read. Always verify clauses with counsel.",
  },
  {
    q: "Does Summify replace legal review?",
    a: "No. Contract Summary is informational only — not legal advice. Use outputs as a starting point.",
  },
  {
    q: "What about client confidentiality?",
    a: "Do not upload material you cannot process on third-party AI providers. See our Privacy page for data flow.",
  },
  {
    q: "Which modes help with client briefs?",
    a: "Executive Brief for strategy docs, General Summary for neutral reads, and The Creator for content deliverables.",
  },
];

export const RESEARCHERS_FAQS: FaqItem[] = [
  {
    q: "Can researchers summarize academic PDFs?",
    a: "Yes. Upload papers in the workspace. The Student mode emphasizes concepts; General Summary offers neutral synthesis.",
  },
  {
    q: "Does Summify cite sources?",
    a: "Outputs reference themes from your upload. Always verify claims and citations against the original paper.",
  },
  {
    q: "Can I analyze literature from web articles?",
    a: "Yes. Paste public article URLs or upload PDFs when paywalls block fetch.",
  },
  {
    q: "How does Summify handle long papers?",
    a: "Long PDFs may be compacted for analysis while preserving narrative structure during beta.",
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
      description: "29 lenses — five active in public beta.",
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
  webArticles: [
    {
      href: "/upload",
      label: "Analyze a web article",
      description: "Paste a URL in the workspace.",
    },
    {
      href: "/summarize-pdf",
      label: "AI PDF summarizer",
      description: "Papers and reports alongside articles.",
    },
    {
      href: "/for-researchers",
      label: "For researchers",
      description: "Evidence synthesis workflows.",
    },
  ] satisfies RelatedLinkItem[],
  docx: [
    {
      href: "/upload",
      label: "Upload DOCX",
      description: "Word documents in the workspace.",
    },
    {
      href: "/modes/contract-analyzer",
      label: "Contract Summary mode",
      description: "First-pass agreement review.",
    },
    {
      href: "/for-freelancers",
      label: "For freelancers",
      description: "Client docs and contracts.",
    },
  ] satisfies RelatedLinkItem[],
  mp3: [
    {
      href: "/summarize-youtube-video",
      label: "YouTube summarizer",
      description: "Captioned video and podcast uploads.",
    },
    {
      href: "/for-creators",
      label: "For creators",
      description: "Repurpose transcripts into content.",
    },
    {
      href: "/upload",
      label: "Open workspace",
      description: "Paste transcripts or URLs.",
    },
  ] satisfies RelatedLinkItem[],
  teams: [
    {
      href: "/modes/executive-brief",
      label: "Executive Brief mode",
      description: "Decision-ready team briefs.",
    },
    {
      href: "/summarize-powerpoint",
      label: "PowerPoint summarizer",
      description: "Deck review for stakeholders.",
    },
    {
      href: "/upload",
      label: "Team workspace",
      description: "Analyze reports and recordings.",
    },
  ] satisfies RelatedLinkItem[],
  freelancers: [
    {
      href: "/modes/contract-analyzer",
      label: "Contract Summary",
      description: "Client agreement first reads.",
    },
    {
      href: "/summarize-docx",
      label: "DOCX summarizer",
      description: "Word briefs and SOWs.",
    },
    {
      href: "/upload",
      label: "Open workspace",
      description: "Analyze client documents.",
    },
  ] satisfies RelatedLinkItem[],
  researchers: [
    {
      href: "/summarize-pdf",
      label: "PDF summarizer",
      description: "Papers and preprints.",
    },
    {
      href: "/summarize-web-articles",
      label: "Web article summarizer",
      description: "Online reporting and blogs.",
    },
    {
      href: "/modes/the-student",
      label: "The Student mode",
      description: "Concept-heavy synthesis.",
    },
  ] satisfies RelatedLinkItem[],
  home: [
    {
      href: "/summarize-pdf",
      label: "AI PDF summarizer",
      description: "Summarize PDF online with flashcards & quiz.",
    },
    {
      href: "/summarize-powerpoint",
      label: "PowerPoint summarizer",
      description: "AI summary for PPTX decks.",
    },
    {
      href: "/summarize-youtube-video",
      label: "YouTube summarizer",
      description: "Transcript-based video summaries.",
    },
    {
      href: "/compare/notebooklm",
      label: "NotebookLM alternative",
      description: "Summify vs NotebookLM for study.",
    },
    {
      href: "/modes/contract-analyzer",
      label: "Contract summary AI",
      description: "First-pass clause overviews.",
    },
    {
      href: "/for-students",
      label: "AI study notes",
      description: "Exam prep from lectures and readings.",
    },
    {
      href: "/modes",
      label: "Intelligence modes",
      description: "Browse summarizer lenses.",
    },
    {
      href: "/upload",
      label: "Open workspace",
      description: "Start your next AI summary.",
    },
  ] satisfies RelatedLinkItem[],
};
