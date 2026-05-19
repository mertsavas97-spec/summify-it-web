import { InternalTextLink } from "@/components/public/InternalTextLink";
import type { UseCaseLandingConfig } from "./types";
import {
  RESEARCHERS_FAQS,
  FREELANCERS_FAQS,
  CREATORS_FAQS,
  TEAMS_FAQS,
  RELATED_LINKS,
} from "@/data/landing-seo";

export const USE_CASES: UseCaseLandingConfig[] = [
  {
    slug: "research-papers-students",
    path: "/use-cases/research-papers-students",
    badge: "Use case",
    title: "Research papers for students",
    description:
      "Turn academic PDFs and preprints into structured study notes with The Student mode — verify every claim before citing.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-students", label: "For students" },
    seoBlocks: [
      {
        body: (
          <>
            Literature-heavy courses generate more reading than calendar hours. Summify helps
            you orient on{" "}
            <InternalTextLink href="/summarize-pdf">research PDFs</InternalTextLink> with
            thematic insights and concept Learn cards — then you confirm statistics and
            arguments in the source.
          </>
        ),
      },
      {
        heading: "Workflow",
        body: (
          <>
            Upload one paper per session, run{" "}
            <InternalTextLink href="/modes/the-student">The Student</InternalTextLink>, export
            mental notes into your Zotero or Notion system, and drill Learn cards before
            discussion sections.
          </>
        ),
      },
    ],
    workflow: {
      title: "Research paper workflow",
      steps: [
        { title: "Upload PDF", description: "One paper or chapter per analysis." },
        { title: "The Student mode", description: "Concept and quiz emphasis." },
        { title: "Map themes", description: "Compare insights across your reading list." },
        { title: "Verify claims", description: "Confirm before writing essays." },
      ],
    },
    features: [
      { title: "Dense PDF handling", description: "Compaction for long academic PDFs." },
      { title: "Concept cards", description: "Learn layer for definitions and quizzes." },
      { title: "Mixed sources", description: "Pair with web articles for survey courses." },
    ],
    formats: [
      { title: "PDF", description: "Papers and textbooks", href: "/summarize-pdf" },
      { title: "Web articles", description: "Public reporting", href: "/summarize-web-articles" },
      { title: "YouTube", description: "Captioned lectures", href: "/summarize-youtube-video" },
    ],
    faqs: RESEARCHERS_FAQS,
    relatedLinks: RELATED_LINKS.researchers,
    cta: {
      title: "Analyze your next paper",
      description: "Free during public beta.",
      primaryLabel: "Open workspace",
    },
  },
  {
    slug: "contracts-freelancers",
    path: "/use-cases/contracts-freelancers",
    badge: "Use case",
    title: "Contracts for freelancers",
    description:
      "First-pass reads on client agreements and SOWs with Contract Summary — informational only, always verify with counsel.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/guides/contract-summary-ai-guide", label: "Contract guide" },
    seoBlocks: [
      {
        body: (
          <>
            Freelancers juggle scope documents, MSAs, and statements of work. Summify highlights
            obligations and ambiguous language in{" "}
            <InternalTextLink href="/summarize-docx">DOCX</InternalTextLink> and PDF uploads —
            not legal advice.
          </>
        ),
      },
    ],
    workflow: {
      title: "Contract review workflow",
      steps: [
        { title: "Upload agreement", description: "DOCX or PDF from client." },
        { title: "Contract Summary", description: "Obligations and risk callouts." },
        { title: "Question list", description: "Items to clarify before signing." },
        { title: "Counsel review", description: "Human verification required." },
      ],
    },
    features: [
      { title: "Obligation highlights", description: "Dates, payments, termination." },
      { title: "DOCX support", description: "Client exports from Google Docs." },
      { title: "Executive Brief", description: "Commercial terms in proposals." },
    ],
    formats: [
      { title: "DOCX", description: "Word agreements", href: "/summarize-docx" },
      { title: "PDF", description: "Signed scans", href: "/summarize-pdf" },
    ],
    faqs: FREELANCERS_FAQS,
    relatedLinks: RELATED_LINKS.freelancers,
    cta: {
      title: "Review your next client contract",
      description: "Do not upload material you cannot send to AI providers.",
      primaryLabel: "Open workspace",
    },
  },
  {
    slug: "podcasts-creators",
    path: "/use-cases/podcasts-creators",
    badge: "Use case",
    title: "Podcasts for creators",
    description:
      "Repurpose episode transcripts into hooks, beats, and newsletters with The Creator mode.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-creators", label: "For creators" },
    seoBlocks: [
      {
        body: (
          <>
            Creators need show notes and social angles without re-listening to every episode.
            Paste transcripts or use{" "}
            <InternalTextLink href="/summarize-youtube-video">captioned YouTube</InternalTextLink>{" "}
            uploads with{" "}
            <InternalTextLink href="/modes/the-creator">The Creator</InternalTextLink>.
          </>
        ),
      },
    ],
    workflow: {
      title: "Podcast repurposing workflow",
      steps: [
        { title: "Get transcript", description: "TXT paste or captioned video." },
        { title: "The Creator", description: "Hooks and narrative beats." },
        { title: "Plan content", description: "Threads, newsletters, clips." },
        { title: "Ship Learn cards", description: "Pull quotes to verify in audio." },
      ],
    },
    features: [
      { title: "Hook cards", description: "Social-first Learn emphasis." },
      { title: "Transcript fidelity", description: "Grounded in spoken text." },
      { title: "Multi-episode", description: "Analyze series consistently." },
    ],
    formats: [
      { title: "MP3 / audio", description: "Transcript workflows", href: "/summarize-mp3" },
      { title: "YouTube", description: "Video podcasts", href: "/summarize-youtube-video" },
    ],
    faqs: CREATORS_FAQS,
    relatedLinks: RELATED_LINKS.creators,
    cta: {
      title: "Repurpose your next episode",
      description: "Free during public beta.",
      primaryLabel: "Open workspace",
    },
  },
  {
    slug: "reports-teams",
    path: "/use-cases/reports-teams",
    badge: "Use case",
    title: "Reports for teams",
    description:
      "Compress quarterly reports and strategy decks into executive briefs your team can act on.",
    primaryCta: { href: "/upload", label: "Try Summify free" },
    secondaryCta: { href: "/for-teams", label: "For teams" },
    seoBlocks: [
      {
        body: (
          <>
            Teams drown in PDFs and slide decks before every planning cycle. Summify&apos;s{" "}
            <InternalTextLink href="/modes/executive-brief">Executive Brief</InternalTextLink>{" "}
            surfaces risks, decisions, and next actions from{" "}
            <InternalTextLink href="/summarize-pdf">reports</InternalTextLink> and{" "}
            <InternalTextLink href="/summarize-powerpoint">PPTX</InternalTextLink>.
          </>
        ),
      },
    ],
    workflow: {
      title: "Team report workflow",
      steps: [
        { title: "Upload report", description: "PDF or board deck." },
        { title: "Executive Brief", description: "Leadership-ready structure." },
        { title: "Share brief", description: "Optional public share link." },
        { title: "Act on gaps", description: "Assign owners for open risks." },
      ],
    },
    features: [
      { title: "Risk emphasis", description: "Weighted in Executive Brief." },
      { title: "Deck support", description: "PPTX slide intelligence." },
      { title: "Share links", description: "When analyses are saved." },
    ],
    formats: [
      { title: "PDF", description: "Quarterly reports", href: "/summarize-pdf" },
      { title: "PowerPoint", description: "Strategy decks", href: "/summarize-powerpoint" },
    ],
    faqs: TEAMS_FAQS,
    relatedLinks: RELATED_LINKS.teams,
    cta: {
      title: "Brief your team faster",
      description: "Free during public beta.",
      primaryLabel: "Open workspace",
    },
  },
];

export const USE_CASE_SLUGS = USE_CASES.map((u) => u.slug);

export function getUseCaseBySlug(slug: string): UseCaseLandingConfig | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
