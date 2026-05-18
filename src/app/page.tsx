import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import Link from "next/link";

export const metadata = buildPageMetadata({
  title: "AI document intelligence for PDFs, videos, and decks",
  description:
    "Turn complex sources into structured intelligence. Summify.it analyzes PDFs, PowerPoint, YouTube, web articles, and text with 29 intelligence modes and built-in Learn cards.",
  path: "/",
  keywords: [
    "AI document intelligence",
    "PDF summarizer",
    "YouTube transcript summary",
    "PowerPoint summarizer",
    "study notes AI",
  ],
});

const formats = [
  { href: "/summarize-pdf", label: "PDF", desc: "Reports, papers, ebooks" },
  { href: "/summarize-youtube-video", label: "YouTube", desc: "Transcript intelligence" },
  { href: "/summarize-powerpoint", label: "PowerPoint", desc: "Slide deck analysis" },
  { href: "/upload", label: "Web & text", desc: "Articles, DOCX, TXT" },
];

export default function HomePage() {
  return (
    <>
      <PublicHero
        badge="Public beta · AI document intelligence"
        title="Turn complex sources into structured intelligence."
        description={
          <>
            Upload PDFs, PowerPoint decks, YouTube videos, web articles, or text. Pick an
            intelligence lens and get{" "}
            <span className="font-medium text-zinc-200">structured intelligence</span>,{" "}
            <span className="font-medium text-violet-200/90">Learn cards</span>, and study-ready
            outputs across{" "}
            <span className="font-medium text-zinc-200">29 modes</span> — four active today, Pro
            Intelligence expanding.
          </>
        }
        primaryCta={{ href: "/upload", label: "Start summarizing" }}
        secondaryCta={{ href: "/modes", label: "Explore modes" }}
      >
        <ProductMockCard />
      </PublicHero>

      <section className="border-b border-white/[0.04] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {formats.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-left transition-colors hover:border-violet-500/30"
            >
              <span className="text-xs font-medium text-zinc-200">{f.label}</span>
              <span className="mt-0.5 block text-[10px] text-zinc-600">{f.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <FeatureGrid
        eyebrow="Why Summify.it"
        title="More than a summary box"
        subtitle="A multi-source intelligence workspace with adaptive analysis and a deterministic Learn layer."
        features={[
          {
            title: "29 intelligence modes",
            description:
              "Executive, study, creator, legal, and specialized lenses — four active now, more unlocking with Pro Intelligence.",
          },
          {
            title: "Learn cards",
            description:
              "Concept, quiz, hook, and connection cards ranked for your mode — study and repurposing without a second tool.",
          },
          {
            title: "Multi-source workspace",
            description:
              "PDF, PPTX, YouTube, web articles, DOCX, and pasted text in one flow with source-aware intelligence.",
          },
          {
            title: "Structured outputs",
            description:
              "Insights, risks, actions, and mode-specific lenses — not generic filler paragraphs.",
          },
          {
            title: "One-click web & video",
            description:
              "Analyze articles and YouTube transcripts in a single step after extraction.",
          },
          {
            title: "Production-ready beta",
            description:
              "Groq and Gemini with fallback, knowledge-layer compaction, and token-aware pipelines.",
          },
        ]}
      />

      <UseCaseSection
        title="Built for how you actually work"
        subtitle="Students, creators, and professionals use different lenses on the same source."
        cases={[
          {
            title: "Students & researchers",
            description:
              "Turn lectures, papers, and videos into concepts, quizzes, and exam-ready notes.",
          },
          {
            title: "Creators & media",
            description: "Mine hooks, angles, and repurposable moments from long-form content.",
          },
          {
            title: "Leaders & operators",
            description: "Executive briefs with decisions, risks, and implications — fast.",
          },
        ]}
      />

      <FormatWorkflow
        title="From source to intelligence in minutes"
        steps={[
          { title: "Add a source", description: "Upload or paste a link — PDF, deck, video, or article." },
          { title: "Choose a lens", description: "Pick an active intelligence mode from 29 options." },
          { title: "Analyze", description: "Adaptive compaction and dual-provider analysis." },
          { title: "Learn & act", description: "Review structured output and Learn cards in one workspace." },
        ]}
      />

      <CTASection
        title="Start with four active intelligence modes"
        description="Executive Brief, The Student, The Creator, and Contract Analyzer are live today. More Pro modes coming soon."
        secondaryHref="/modes"
        secondaryLabel="Browse all 29 modes"
      />
    </>
  );
}
