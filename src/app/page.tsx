import { pageSeo } from "@/lib/page-metadata";
import { howToSummifySchema, softwareApplicationSchema } from "@/lib/schema";
import { SUMMIFY_HOW_TO_STEPS } from "@/data/seo-howto";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { VoiceStudyPromo } from "@/components/marketing/VoiceStudyPromo";
import { HOME_FAQS, RELATED_LINKS } from "@/data/landing-seo";
import Link from "next/link";

export const metadata = pageSeo.home;

const formats = [
  { href: "/summarize-pdf", label: "PDF", desc: "AI PDF summarizer" },
  { href: "/summarize-youtube-video", label: "YouTube", desc: "Transcript summarizer" },
  { href: "/summarize-powerpoint", label: "PowerPoint", desc: "PPTX deck analysis" },
  { href: "/upload", label: "Web & text", desc: "Document workspace" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationSchema({ path: "/" }),
          howToSummifySchema(SUMMIFY_HOW_TO_STEPS),
        ]}
      />
      <PublicHero
        badge="Public beta · AI study companion"
        title="Summaries, quizzes, and audio study lessons in one workspace"
        description={
          <>
            <span className="block font-medium text-zinc-300">
              Turn PDFs, videos, and articles into structured intelligence — then Learn, practice,
              and listen with teacher-style voice lessons.
            </span>
            <span className="mt-3 block">
              Still your{" "}
              <InternalTextLink href="/summarize-pdf">AI PDF summarizer</InternalTextLink>,{" "}
              <InternalTextLink href="/summarize-youtube-video">YouTube summarizer</InternalTextLink>
              , and{" "}
              <InternalTextLink href="/summarize-powerpoint">
                PowerPoint summarizer
              </InternalTextLink>{" "}
              — now with{" "}
              <InternalTextLink href="/audio-study">voice study</InternalTextLink>,{" "}
              <InternalTextLink href="/modes">29 intelligence modes</InternalTextLink>, and a full
              Summary → Learn → Quiz → listen workflow.
            </span>
          </>
        }
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
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
              <span className="mt-0.5 block text-[10px] text-zinc-500">{f.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <FeatureGrid
        eyebrow="Why Summify"
        title="AI document analysis beyond a summary box"
        subtitle="A document summary tool with adaptive analysis, study-ready Learn cards, and source-aware intelligence modes."
        features={[
          {
            title: "AI study notes & Learn cards",
            description:
              "Generate concept, quiz, hook, and connection cards — ideal for exam prep. Educational outputs stay in fluent English from any source language.",
          },
          {
            title: "Audio Study & voice lessons",
            description:
              "Teacher-style spoken lessons from your analysis — learn by listening on Pro with natural voice audio and playback controls.",
          },
          {
            title: "YouTube transcript summarizer",
            description:
              "Paste a video link for one-step transcript extraction and analysis — lectures, podcasts, and explainers.",
          },
          {
            title: "PowerPoint & PDF in one workspace",
            description:
              "Summarize PDF online or upload PPTX decks with the same intelligence engine and mode library.",
          },
          {
            title: "Structured intelligence outputs",
            description:
              "Insights, risks, actions, and mode-specific lenses — not generic filler paragraphs.",
          },
          {
            title: "29 intelligence modes",
            description:
              "General, executive, study, creator, and document lenses — five active now, more unlocking with Pro Intelligence.",
          },
          {
            title: "Production-ready beta",
            description:
              "Try free during public beta. Dual-provider analysis with token-aware compaction for long sources.",
          },
        ]}
      />

      <UseCaseSection
        title="Built for real document workflows"
        subtitle="Students, creators, and operators use the same workspace with different intelligence lenses."
        cases={[
          {
            title: "AI study notes for school",
            description:
              "Turn lectures, papers, and videos into concepts, quizzes, and exam-ready notes.",
          },
          {
            title: "YouTube & long-form video",
            description:
              "Digest transcripts for hooks, themes, and study notes without rewatching hours of video.",
          },
          {
            title: "Decks, reports & articles",
            description:
              "Executive briefs and presentation analysis from PDFs, PPTX, and web sources.",
          },
        ]}
      />

      <FormatWorkflow
        title="How this document summary tool works"
        steps={[
          {
            title: "Add a source",
            description: "Upload or paste — PDF, deck, YouTube URL, web article, or text.",
          },
          {
            title: "Choose a lens",
            description: "Pick an active intelligence mode from 29 options.",
          },
          {
            title: "Run AI document analysis",
            description: "Adaptive compaction and structured outputs from your source.",
          },
          {
            title: "Learn, quiz & listen",
            description: "Review analysis, drill Learn cards, take the quiz, then generate audio study.",
          },
        ]}
      />

      <FAQSection
        title="Common questions about Summify"
        subtitle="Quick answers before you open the workspace."
        items={HOME_FAQS}
      />

      <section className="border-b border-white/[0.04] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <VoiceStudyPromo />
        </div>
      </section>

      <RelatedLinksSection title="Explore by format and workflow" links={RELATED_LINKS.home} />

      <CTASection
        title="Start summarizing in the workspace"
        description="Summarize, learn, quiz, and listen — Executive Brief, The Student, The Creator, and Contract Summary are live today. Try free during public beta."
        primaryLabel="Try Summify free"
        secondaryHref="/faq"
        secondaryLabel="Read the FAQ"
      />
    </>
  );
}
