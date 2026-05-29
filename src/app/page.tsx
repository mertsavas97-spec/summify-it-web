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
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { HomeTrustBar } from "@/components/public/HomeTrustBar";
import { VoiceStudyPromo } from "@/components/marketing/VoiceStudyPromo";
import { HOME_FAQS, RELATED_LINKS } from "@/data/landing-seo";
import { HomePricingPreview } from "@/components/public/HomePricingPreview";
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
        title={
          <>
            Turn any PDF, video, or article into a complete{" "}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
              learning experience
            </span>
            .
          </>
        }
        description={
          <>
            <span className="block text-base font-medium text-zinc-200">
              Summarize. Learn. Quiz yourself. Listen on the go.
            </span>
            <span className="mt-3 block">
              Summify helps you go beyond summaries with Learn Cards, quizzes, audio lessons, and
              podcast-style study flows — all in one workspace.
            </span>
          </>
        }
        primaryCta={{ href: "/upload", label: "Try Summify Free" }}
        secondaryCta={{ href: "#how-it-works", label: "See how it works" }}
        variant="home"
      >
        <ProductMockCard variant="home" />
      </PublicHero>

      <section className="border-b border-white/[0.04] px-4 pb-8 pt-0 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ul className="mt-0 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500">
            <li className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400/70" aria-hidden />
              <span>
                <span className="text-zinc-200">1</span> guest analysis
              </span>
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" aria-hidden />
              <span>
                Free accounts get <span className="text-zinc-200">5 analyses/day</span>
              </span>
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" aria-hidden />
              <span>No credit card required</span>
            </li>
          </ul>
        </div>
      </section>

      <HomeTrustBar />

      <section className="border-b border-white/[0.04] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Supported sources
            </p>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-zinc-950/40 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-violet-500/25 hover:text-zinc-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20 group-hover:bg-violet-400/60" />
                  <span className="font-medium text-zinc-200/90">{f.label}</span>
                  <span className="hidden text-zinc-500 sm:inline">· {f.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FeatureGrid
        eyebrow="Why Summify"
        title="AI study workflows — not just summaries"
        subtitle="A premium AI learning workspace with summaries, Learn Cards, quizzes, audio lessons, podcasts, and mind maps."
        features={[
          {
            title: "AI Summaries",
            description: "Clear, structured takeaways you can actually study from.",
            icon: "≋",
            accent: "violet",
          },
          {
            title: "Learn Cards",
            description: "Concept + why-it-matters cards that build retention fast.",
            icon: "▦",
            accent: "cyan",
          },
          {
            title: "Quizzes",
            description: "Self-test with questions generated from your source.",
            icon: "?",
            accent: "amber",
          },
          {
            title: "Audio Lessons",
            description: "Teacher-style voice lessons you can play on the go.",
            icon: "▶",
            accent: "emerald",
          },
          {
            title: "Podcasts",
            description: "Podcast-style study flows that make long sources easy.",
            icon: "◉",
            accent: "fuchsia",
          },
          {
            title: "Mind Maps",
            description: "Turn documents into visual mental models and connections.",
            icon: "⟡",
            accent: "sky",
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
        id="how-it-works"
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

      <HomePricingPreview />

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
        title="Ready to turn documents into learnable content?"
        description="Upload a source and get summaries, Learn Cards, quizzes, and audio study flows in minutes."
        primaryLabel="Try Summify Free"
        secondaryHref="#how-it-works"
        secondaryLabel="See how it works"
      />
    </>
  );
}
