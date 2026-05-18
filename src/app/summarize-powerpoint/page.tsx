import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";

export const metadata = buildPageMetadata({
  title: "Summarize PowerPoint with AI — PPTX deck intelligence",
  description:
    "AI PowerPoint summarizer for PPTX decks: slide narrative, themes, logic gaps, and Learn cards. Presentation intelligence beyond bullet extraction.",
  path: "/summarize-powerpoint",
  keywords: [
    "summarize PowerPoint AI",
    "PPTX summarizer",
    "AI summarize presentation",
  ],
});

export default function SummarizePowerpointPage() {
  return (
    <>
      <PublicHero
        badge="Presentation intelligence"
        title="PowerPoint intelligence — narrative, themes, and gaps."
        description="Upload a .pptx deck. Summify reads slide text with presentation-aware intelligence: outline, repeated themes, and structured analysis plus Learn cards."
        primaryCta={{ href: "/upload", label: "Analyze a presentation" }}
        secondaryCta={{ href: "/modes/executive-brief", label: "Executive Brief mode" }}
      >
        <ProductMockCard />
      </PublicHero>

      <FormatWorkflow
        steps={[
          { title: "Upload PPTX", description: "Drop your deck in the file workspace tab." },
          { title: "Extract slides", description: "Titles, themes, and slide outline preserved." },
          { title: "Analyze", description: "Deck-aware compaction and intelligence modes." },
          { title: "Review & Learn", description: "Summary plus cards for recall and decisions." },
        ]}
      />

      <FeatureGrid
        title="What you get from a deck"
        features={[
          {
            title: "Slide-aware analysis",
            description: "Less fragment noise — editorial structure from real slide content.",
          },
          {
            title: "Narrative & themes",
            description: "See the story arc and repeated motifs across slides.",
          },
          {
            title: "Learn cards",
            description: "Concept and decision cards for briefings and study.",
          },
        ]}
      />

      <UseCaseSection
        title="Best for"
        cases={[
          {
            title: "Pitch & strategy decks",
            description: "Executive Brief mode for decisions and implications.",
          },
          {
            title: "Training & courses",
            description: "Student-friendly concepts from slide-heavy material.",
          },
          {
            title: "Client deliverables",
            description: "Quickly digest vendor or partner presentations.",
          },
        ]}
      />

      <CTASection
        title="Summarize your next presentation"
        description="PPTX upload in the workspace — same analysis engine as PDFs and articles."
      />
    </>
  );
}
