import { JsonLd } from "@/components/seo/JsonLd";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { PublicHero } from "@/components/public/PublicHero";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoBreadcrumbs } from "@/components/public/SeoBreadcrumbs";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { pageSeo } from "@/lib/page-metadata";
import { seoLandingPageJsonLd } from "@/lib/schema";

export const metadata = pageSeo.pdfSummarizer;

const FAQS = [
  { q: "Is this only a PDF summary tool?", a: "No. Summify turns PDFs into structured study workflows with Learn cards, audio lessons, and podcast-style discussion." },
  { q: "Can I use it for research papers and lecture notes?", a: "Yes. Long papers, reports, and lecture notes are common workflows." },
  { q: "How is this different from generic AI chat?", a: "You get a workflow: structured outputs, revision loops, and workspace continuity instead of one-off answers." },
];

export default function PdfSummarizerPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/pdf-summarizer",
          pageTitle: "PDF Summarizer",
          description:
            "Turn long PDFs into structured study systems with summaries, Learn cards, audio lessons, and podcast-style discussion.",
          faqs: FAQS,
          howToSteps: [
            { name: "Upload your PDF", text: "Drop lecture notes, reports, or papers into the workspace." },
            { name: "Choose a study lens", text: "Pick the mode matching your exam, research, or revision goal." },
            { name: "Generate structured outputs", text: "Get summary, key insights, and revision-oriented cards." },
            { name: "Switch to audio", text: "Turn material into listenable lessons for mobile learning." },
          ],
        })}
      />
      <SeoBreadcrumbs items={[{ name: "Home", href: "/" }, { name: "PDF Summarizer", href: "/pdf-summarizer" }]} />
      <PublicHero
        badge="Study-focused PDF workflow"
        title="Summarize PDFs into a study system, not a text dump"
        description="Move from dense reading to structured understanding with summaries, Learn cards, and podcast-style lesson outputs in one calm workspace."
        primaryCta={{ href: "/upload", label: "Start with a PDF" }}
        secondaryCta={{ href: "/pdf-to-podcast", label: "See PDF to podcast" }}
      />
      <SeoContentSection
        eyebrow="Built for deep material"
        title="From long documents to usable study flow"
        blocks={[{ body: "Summify helps you process papers, ebooks, reports, and lecture packs with structure first: core ideas, key arguments, blind spots, and practical recall paths." }]}
      />
      <FormatWorkflow
        title="PDF study workflow"
        steps={[
          { title: "Upload", description: "Add textbook chapters, papers, or reports." },
          { title: "Analyze", description: "Generate structured understanding with an appropriate mode." },
          { title: "Practice", description: "Use Learn cards for active recall and revision loops." },
          { title: "Listen", description: "Convert to audio-style lessons for on-the-go studying." },
        ]}
      />
      <FeatureGrid
        title="Why students and researchers choose this"
        features={[
          { title: "Structured outputs", description: "Organized summaries for faster revision." },
          { title: "Audio learning", description: "Turn reading into listening sessions." },
          { title: "Workspace continuity", description: "Keep related analyses together by topic." },
        ]}
      />
      <UseCaseSection
        title="Use cases"
        cases={[
          { title: "Research papers", description: "Map arguments and methods before deeper reading." },
          { title: "Lecture notes", description: "Convert class notes into revision structure." },
          { title: "Professional reports", description: "Extract key decisions and action points quickly." },
        ]}
      />
      <FeatureGrid
        title="Better than generic AI chat"
        features={[
          { title: "Study-native flow", description: "Designed for learning tasks, not casual prompting." },
          { title: "Audio workflow", description: "Built-in conversion from notes to listening format." },
          { title: "Semantic organization", description: "Cleaner workspace for recurring study topics." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          { href: "/best-ai-for-studying", label: "Best AI for studying", description: "See the full study-system approach." },
          { href: "/ai-note-tool", label: "AI note tool", description: "Structure notes into revision blocks." },
          { href: "/youtube-video-summarizer", label: "YouTube summarizer", description: "Pair video lectures with PDF reading." },
        ]}
      />
      <CTASection title="Turn your next PDF into a structured study session" description="Open workspace, upload once, and keep the learning loop moving." primaryLabel="Open workspace" />
    </>
  );
}

