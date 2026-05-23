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

export const metadata = pageSeo.aiNoteTool;

const FAQS = [
  { q: "Is this just auto-generated notes?", a: "No. It is a structured note workflow with revision and audio reinforcement paths." },
  { q: "Can I use this for smart revision?", a: "Yes. Use note structure plus Learn cards and repeatable review cycles." },
  { q: "Does it work for mixed sources?", a: "Yes. You can combine PDFs, videos, and text notes inside one workspace." },
];

export default function AiNoteToolPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/ai-note-tool",
          pageTitle: "AI Note Tool",
          description:
            "Organize ideas into structured notes, revision loops, and audio study outputs in a calm AI knowledge workspace.",
          faqs: FAQS,
        })}
      />
      <SeoBreadcrumbs items={[{ name: "Home", href: "/" }, { name: "AI Note Tool", href: "/ai-note-tool" }]} />
      <PublicHero
        badge="Structured knowledge workspace"
        title="AI note tool for calm, structured revision"
        description="Capture ideas from PDFs, videos, and notes, then shape them into a study-friendly system you can revisit without cognitive clutter."
        primaryCta={{ href: "/upload", label: "Create structured notes" }}
        secondaryCta={{ href: "/best-ai-for-studying", label: "See study system" }}
      />
      <SeoContentSection
        eyebrow="Notes that stay useful"
        title="From fragmented inputs to smart revision"
        blocks={[
          { body: "Most note tools collect information. Summify helps transform it into usable structure: key concepts, linked ideas, and practical recall prompts." },
        ]}
      />
      <FormatWorkflow
        title="AI note workflow"
        steps={[
          { title: "Ingest", description: "Upload PDFs or paste source links." },
          { title: "Structure", description: "Generate organized note blocks by intent." },
          { title: "Review", description: "Turn notes into recall-oriented cards." },
          { title: "Reinforce", description: "Use audio review for low-focus moments." },
        ]}
      />
      <UseCaseSection
        title="Use cases"
        cases={[
          { title: "Exam revisions", description: "Build concise topic maps from scattered material." },
          { title: "Course synthesis", description: "Combine lectures and readings into one note system." },
          { title: "Creator research", description: "Structure source notes for future scripts and content." },
        ]}
      />
      <FeatureGrid
        title="Comparison block"
        features={[
          { title: "Generic notes", description: "Fast to write, hard to revise at scale." },
          { title: "Summify notes", description: "Structured for review, recall, and audio continuity." },
          { title: "Outcome", description: "Higher clarity and better long-term retrieval." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          { href: "/pdf-summarizer", label: "PDF summarizer", description: "Generate high-signal source inputs." },
          { href: "/youtube-video-summarizer", label: "YouTube summarizer", description: "Turn lectures into note-ready structure." },
          { href: "/pdf-to-podcast", label: "PDF to podcast", description: "Convert notes into listening sessions." },
        ]}
      />
      <CTASection title="Build your AI note system" description="Structure once, revise with less friction." primaryLabel="Open AI note workspace" />
    </>
  );
}

