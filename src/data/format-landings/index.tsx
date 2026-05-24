import { InternalTextLink } from "@/components/public/InternalTextLink";
import { DOCX_FAQS, MP3_FAQS, RELATED_LINKS, WEB_FAQS } from "@/data/landing-seo";
import type { FormatLandingConfig } from "./types";

export const WEB_ARTICLES_LANDING: FormatLandingConfig = {
  path: "/summarize-web-articles",
  breadcrumbLabel: "Web article summarizer",
  hero: {
    badge: "Web article summarizer",
    title: "Summarize web articles and URLs with structured intelligence",
    description:
      "Paste a public article URL or upload saved HTML exports. Summify extracts readable text, applies your intelligence mode, and returns structured summaries, insights, and Learn cards — not a shallow bullet list.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-researchers", label: "For researchers" },
  },
  iosCta: {
    title: "Prefer studying on your phone?",
    description:
      "Try the Summify iOS app for mobile summaries, learn cards, and audio-friendly study workflows.",
    label: "Explore the iOS app",
  },
  seoContent: {
    eyebrow: "Why Summify for articles",
    title: "An article summarizer built for depth and citation-aware reading",
    blocks: [
      {
        body: (
          <>
            Summify treats web articles like first-class sources in the{" "}
            <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>.
            Choose General Summary for neutral reads, Executive Brief for leadership
            memos, or The Student when you need concept-heavy study notes from long-form
            explainers.
          </>
        ),
      },
      {
        heading: "What you get from a URL",
        body: (
          <>
            Expect structured sections — overview, key insights, risks, and next actions —
            plus Learn cards when your mode emphasizes recall. Pair article analysis with our{" "}
            <InternalTextLink href="/summarize-pdf">AI PDF summarizer</InternalTextLink> when
            research mixes papers and online reporting.
          </>
        ),
      },
    ],
  },
  workflow: {
    title: "How the web article summarizer works",
    steps: [
      { title: "Add the URL", description: "Paste a public article link or upload TXT/HTML exports." },
      { title: "Pick a lens", description: "Student, Executive, Creator, or General Summary." },
      { title: "Review structure", description: "Mode-tuned analysis grounded in extracted text." },
      { title: "Study with Learn", description: "Concept and quiz cards for review workflows." },
    ],
  },
  features: {
    title: "Web article summarizer capabilities",
    items: [
      {
        title: "Readable extraction",
        description: "Main content focus — navigation and ad noise minimized where possible.",
      },
      {
        title: "Mode-specific tone",
        description: "Same article, different lenses — study vs. executive vs. creator angles.",
      },
      {
        title: "Mixed-source research",
        description: "Combine with PDF and YouTube in one workspace session.",
      },
    ],
  },
  useCases: {
    title: "Best for",
    cases: [
      {
        title: "Researchers & analysts",
        description: "Synthesize reporting, white papers, and industry blogs faster.",
      },
      {
        title: "Students",
        description: "Turn long explainers into structured notes and self-quiz cards.",
      },
      {
        title: "Creators",
        description: "Mine beats and hooks from interviews and thought-leadership posts.",
      },
    ],
  },
  faqs: WEB_FAQS,
  relatedLinks: RELATED_LINKS.webArticles,
  cta: {
    title: "Summarize your next article",
    description: "Paste a URL in the workspace and pick an intelligence mode in seconds.",
    primaryLabel: "Start summarizing",
  },
};

export const DOCX_LANDING: FormatLandingConfig = {
  path: "/summarize-docx",
  breadcrumbLabel: "DOCX summarizer",
  hero: {
    badge: "DOCX summarizer",
    title: "Summarize Word documents with AI document intelligence",
    description:
      "Upload .docx files — reports, briefs, policies, and drafts — for structured summaries, risk callouts, and Learn cards. Executive Brief and Contract Summary modes shine on professional Word workflows.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-freelancers", label: "For freelancers" },
  },
  iosCta: {
    title: "Working from iPhone?",
    description:
      "The Summify iOS app helps turn PDFs into summaries and study-ready outputs on the go.",
    label: "Explore the iOS app",
  },
  seoContent: {
    eyebrow: "Why Summify for DOCX",
    title: "A Word document summarizer that respects structure",
    blocks: [
      {
        body: (
          <>
            Summify extracts headings, lists, and body text from DOCX uploads in the{" "}
            <InternalTextLink href="/upload">analysis workspace</InternalTextLink>. Unlike
            paste-only tools, you keep document hierarchy for mode-specific analysis.
          </>
        ),
      },
      {
        heading: "Professional workflows",
        body: (
          <>
            Freelancers use Contract Summary for client agreements; teams run Executive Brief
            on strategy memos. Students can still route coursework through{" "}
            <InternalTextLink href="/modes/the-student">The Student mode</InternalTextLink>{" "}
            when lecture notes live in Word.
          </>
        ),
      },
    ],
  },
  workflow: {
    title: "How the DOCX summarizer works",
    steps: [
      { title: "Upload DOCX", description: "Drop your .docx in the workspace alongside PDFs." },
      { title: "Select mode", description: "Executive, Student, Creator, Contract, or General." },
      { title: "Get structure", description: "Insights, risks, and actions tuned to the lens." },
      { title: "Review Learn", description: "Concept and quiz cards when study modes apply." },
    ],
  },
  features: {
    title: "DOCX summarizer capabilities",
    items: [
      {
        title: "Heading-aware extraction",
        description: "Preserves section flow for narrative and gap analysis.",
      },
      {
        title: "Contract-friendly lens",
        description: "Contract Summary highlights obligations — verify in source.",
      },
      {
        title: "Export-friendly inputs",
        description: "Works with Google Docs exports saved as .docx.",
      },
    ],
  },
  useCases: {
    title: "Best for",
    cases: [
      {
        title: "Freelancers & agencies",
        description: "Client briefs, SOWs, and contracts without rereading every clause.",
      },
      {
        title: "Teams",
        description: "Internal memos and project docs into shareable briefs.",
      },
      {
        title: "Students",
        description: "Lecture outlines and assignment drafts into study notes.",
      },
    ],
  },
  faqs: DOCX_FAQS,
  relatedLinks: RELATED_LINKS.docx,
  cta: {
    title: "Summarize your next Word document",
    description: "Upload DOCX in the workspace — free during public beta.",
    primaryLabel: "Upload DOCX",
  },
};

export const MP3_LANDING: FormatLandingConfig = {
  path: "/summarize-mp3",
  breadcrumbLabel: "MP3 & audio summarizer",
  hero: {
    badge: "MP3 & audio",
    title: "Summarize audio and podcasts with transcript intelligence",
    description:
      "When you have transcripts or captioned YouTube audio, Summify turns long recordings into structured notes, hooks, and Learn cards. Ideal for podcast repurposing and interview review — upload text exports or use video links with captions.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-creators", label: "For creators" },
    mockVariant: "learn",
  },
  iosCta: {
    title: "Prefer studying on your phone?",
    description:
      "Try the Summify iOS app for mobile summaries, learn cards, and audio-friendly study workflows.",
    label: "Explore the iOS app",
  },
  seoContent: {
    eyebrow: "Why Summify for audio",
    title: "Podcast summarizer workflows grounded in what was said",
    blocks: [
      {
        body: (
          <>
            Summify analyzes transcript text — from pasted show notes, caption exports, or{" "}
            <InternalTextLink href="/summarize-youtube-video">YouTube with captions</InternalTextLink>.
            The Creator mode emphasizes hooks and repurposing angles for social content planning.
          </>
        ),
      },
      {
        heading: "From recording to outline",
        body: (
          <>
            Upload TXT transcripts or route captioned video through the{" "}
            <InternalTextLink href="/upload">workspace</InternalTextLink>. You receive the same
            structured intelligence as PDFs — summary, insights, and Learn cards — tuned to your
            mode.
          </>
        ),
      },
    ],
  },
  workflow: {
    title: "How audio summarization works in Summify",
    steps: [
      { title: "Provide text", description: "Transcript paste, TXT upload, or captioned YouTube URL." },
      { title: "Creator or General", description: "Repurposing vs. neutral first-pass reads." },
      { title: "Scan beats", description: "Themes, hooks, and pull quotes from the transcript." },
      { title: "Plan content", description: "Learn cards for threads, newsletters, and show notes." },
    ],
  },
  features: {
    title: "Audio & podcast capabilities",
    items: [
      {
        title: "Transcript-first",
        description: "Analysis reflects spoken content — not guessed audio semantics.",
      },
      {
        title: "Creator emphasis",
        description: "Hook and connection cards for repurposing workflows.",
      },
      {
        title: "Interview review",
        description: "Executive Brief for stakeholder interviews and research calls.",
      },
    ],
  },
  useCases: {
    title: "Best for",
    cases: [
      {
        title: "Podcasters & YouTubers",
        description: "Show notes, threads, and newsletters from episode transcripts.",
      },
      {
        title: "Researchers",
        description: "Oral history and interview transcripts into thematic notes.",
      },
      {
        title: "Teams",
        description: "Meeting and webinar transcripts into action-oriented briefs.",
      },
    ],
  },
  faqs: MP3_FAQS,
  relatedLinks: RELATED_LINKS.mp3,
  cta: {
    title: "Summarize your next recording",
    description: "Start with a transcript or captioned video in the workspace.",
    primaryLabel: "Open workspace",
    secondaryHref: "/summarize-youtube-video",
    secondaryLabel: "YouTube summarizer",
  },
};

export const FORMAT_LANDINGS = {
  webArticles: WEB_ARTICLES_LANDING,
  docx: DOCX_LANDING,
  mp3: MP3_LANDING,
} as const;
