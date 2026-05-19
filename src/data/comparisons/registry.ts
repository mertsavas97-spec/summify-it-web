import type { ComparisonPageConfig } from "./types";
import { ChatPdfComparisonBody } from "@/components/comparisons/chatpdf";
import { QuillbotComparisonBody } from "@/components/comparisons/quillbot";
import { NottaComparisonBody } from "@/components/comparisons/notta";

export const COMPARISONS: ComparisonPageConfig[] = [
  {
    slug: "chatpdf",
    competitorName: "ChatPDF",
    title: "Summify vs ChatPDF",
    description:
      "Compare document intelligence workspaces: structured modes, Learn cards, and multi-format support vs. chat-first PDF Q&A.",
    date: "2026-05-11",
    idealUsers: [
      "Students who need study notes and quizzes, not only Q&A",
      "Teams reviewing PDFs, decks, and videos in one workspace",
      "Users who want mode-specific outputs without prompt engineering",
    ],
    summifyStrengths: [
      "29 intelligence modes (five active in beta) with consistent structure",
      "Learn cards for concepts, quizzes, and review",
      "PDF, YouTube, PPTX, web articles, DOCX, and TXT in one workspace",
      "Mind maps and memory review on saved analyses",
    ],
    summifyLimitations: [
      "Smaller brand awareness than chat-first PDF tools",
      "Team collaboration features still on roadmap",
      "No native desktop app during beta",
    ],
    competitorStrengths: [
      "Fast chat interface familiar to PDF users",
      "Strong brand recognition for simple PDF Q&A",
      "Low friction for single-document questions",
    ],
    competitorLimitations: [
      "Less emphasis on multi-format intelligence workflows",
      "Study and executive structure vary by prompt, not product modes",
      "Feature sets differ by plan — verify current offering",
    ],
    tableRows: [
      { feature: "PDF upload", summify: true, competitor: true },
      { feature: "YouTube / transcript", summify: true, competitor: "Varies" },
      { feature: "Intelligence modes", summify: "29 (5 active)", competitor: "Chat-first" },
      { feature: "Learn / study cards", summify: true, competitor: false },
      { feature: "Mind maps", summify: true, competitor: false },
      { feature: "Public beta pricing", summify: "Free", competitor: "Freemium" },
    ],
    faqs: [
      {
        q: "Is Summify a ChatPDF alternative?",
        a: "Yes, for users who want structured document intelligence across formats — not only chat Q&A on one PDF.",
      },
      {
        q: "Can I ask follow-up questions in Summify?",
        a: "The workspace focuses on structured first-pass analysis. Re-run with different modes for alternate lenses.",
      },
      {
        q: "Which is better for students?",
        a: "Summify emphasizes Learn cards and The Student mode. Try both on the same lecture PDF.",
      },
      {
        q: "Is either tool legal advice for contracts?",
        a: "No. Summify Contract Summary is informational only. Consult counsel for agreements.",
      },
    ],
    relatedLinks: [
      { href: "/summarize-pdf", label: "PDF summarizer", description: "Summify format page." },
      { href: "/guides/best-ai-pdf-summarizers-2026", label: "PDF summarizer guide", description: "Evaluation framework." },
      { href: "/upload", label: "Try Summify", description: "Free during beta." },
    ],
    Content: ChatPdfComparisonBody,
  },
  {
    slug: "quillbot",
    competitorName: "QuillBot",
    title: "Summify vs QuillBot",
    description:
      "Summify focuses on document intelligence and study layers; QuillBot is known for paraphrasing and writing assistance — different jobs, compared honestly.",
    date: "2026-05-13",
    idealUsers: [
      "Readers who need structured summaries of long inputs",
      "Students building notes and Learn cards from sources",
      "Teams needing executive briefs from reports",
    ],
    summifyStrengths: [
      "Purpose-built analysis structure (insights, risks, actions)",
      "Source-grounded summaries from uploads and URLs",
      "Learn cards and mind maps for review",
    ],
    summifyLimitations: [
      "Not a paraphrasing or grammar tool",
      "No browser extension for inline rewriting",
    ],
    competitorStrengths: [
      "Paraphrasing, grammar, and co-writing features",
      "Familiar to students improving draft prose",
      "Summarizer feature for pasted text",
    ],
    competitorLimitations: [
      "Less depth on multi-format document intelligence",
      "No equivalent to 29 intelligence modes",
      "Summarizer output style differs from mode-tuned analysis",
    ],
    tableRows: [
      { feature: "Long PDF intelligence", summify: true, competitor: "Summarizer" },
      { feature: "YouTube transcripts", summify: true, competitor: false },
      { feature: "Paraphrasing", summify: false, competitor: true },
      { feature: "Study / quiz layer", summify: "Learn cards", competitor: false },
      { feature: "Executive brief lens", summify: true, competitor: false },
    ],
    faqs: [
      {
        q: "Can Summify paraphrase essays?",
        a: "Summify analyzes and structures source documents — it is not a paraphrasing editor.",
      },
      {
        q: "Should students use both?",
        a: "Some use QuillBot for draft prose and Summify for understanding readings — keep academic integrity policies in mind.",
      },
      {
        q: "Which summarizes PDFs better?",
        a: "Test both on the same chapter. Compare structure, fidelity, and whether you need study cards.",
      },
      {
        q: "Is Summify free?",
        a: "The workspace is free during public beta.",
      },
    ],
    relatedLinks: [
      { href: "/for-students", label: "For students", description: "Study positioning." },
      { href: "/guides/ai-study-notes-guide", label: "Study notes guide", description: "Workflow depth." },
      { href: "/upload", label: "Workspace", description: "Try Summify." },
    ],
    Content: QuillbotComparisonBody,
  },
  {
    slug: "notta",
    competitorName: "Notta",
    title: "Summify vs Notta",
    description:
      "Notta excels at meeting transcription; Summify excels at transcript and document intelligence with modes and Learn cards — compare use cases.",
    date: "2026-05-14",
    idealUsers: [
      "Creators repurposing captioned video and podcast transcripts",
      "Students turning lecture transcripts into study notes",
      "Teams that already have text and need structured briefs",
    ],
    summifyStrengths: [
      "Intelligence modes for study, executive, and creator outputs",
      "PDF, decks, and articles — not only meetings",
      "Learn cards and mind maps",
    ],
    summifyLimitations: [
      "No live meeting bot during beta",
      "Relies on existing transcripts or captions for video",
    ],
    competitorStrengths: [
      "Live transcription and meeting capture",
      "Calendar integrations for recorded calls",
      "Searchable meeting archives on paid tiers",
    ],
    competitorLimitations: [
      "Less focus on PDF and academic study workflows",
      "Structured intelligence modes differ from Summify’s product model",
    ],
    tableRows: [
      { feature: "Live meeting capture", summify: false, competitor: true },
      { feature: "Paste / upload transcript", summify: true, competitor: true },
      { feature: "PDF & deck analysis", summify: true, competitor: "Limited" },
      { feature: "Creator / hook emphasis", summify: "The Creator mode", competitor: "Notes" },
      { feature: "Learn / quiz cards", summify: true, competitor: false },
    ],
    faqs: [
      {
        q: "Can Summify replace Notta for meetings?",
        a: "Not for live capture. Use Notta (or similar) for recording, then analyze exported transcripts in Summify if policy allows.",
      },
      {
        q: "Does Summify transcribe audio?",
        a: "Summify analyzes text — transcripts, captions, or pasted notes.",
      },
      {
        q: "Which is better for podcasts?",
        a: "Summify with The Creator mode for hooks and structure; Notta if you need recording infrastructure.",
      },
      {
        q: "Can teams use both?",
        a: "Yes — capture with one tool, intelligence with another. Verify data policies.",
      },
    ],
    relatedLinks: [
      { href: "/summarize-mp3", label: "Audio / podcast", description: "Transcript workflows." },
      { href: "/for-creators", label: "For creators", description: "Repurposing." },
      { href: "/summarize-youtube-video", label: "YouTube", description: "Captioned video." },
    ],
    Content: NottaComparisonBody,
  },
];

export const COMPARISON_SLUGS = COMPARISONS.map((c) => c.slug);

export function getComparisonBySlug(slug: string): ComparisonPageConfig | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
