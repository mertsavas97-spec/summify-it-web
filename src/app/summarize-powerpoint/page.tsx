import { pageSeo } from "@/lib/page-metadata";
import { faqPageSchema, productPageJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { PPTX_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.summarizePowerpoint;

export default function SummarizePowerpointPage() {
  return (
    <>
      <JsonLd
        data={[
          ...productPageJsonLd({
            path: "/summarize-powerpoint",
            pageTitle: "PowerPoint Summarizer",
            description:
              "Upload PPTX decks for slide narrative, themes, executive insights, and Learn cards.",
          }),
          faqPageSchema(PPTX_FAQS),
        ]}
      />
      <PublicHero
        badge="PowerPoint summarizer"
        title="Summarize PowerPoint with AI — PPTX deck intelligence"
        description="Upload a .pptx deck for presentation analysis: slide narrative, themes, logic gaps, and Learn cards. A PowerPoint summarizer built for pitch decks, training, and client reviews."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/executive-brief", label: "Executive Brief" }}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="Presentation intelligence"
        title="PPTX summarizer for real slide decks"
        blocks={[
          {
            body: (
              <>
                Most tools flatten slides into noisy text. Summify reads slide titles, themes, and
                body copy for presentation analysis — so your PowerPoint summarizer output reflects
                how the deck was meant to flow.
              </>
            ),
          },
          {
            heading: "Why teams use it",
            body: (
              <>
                Strategy teams digest vendor decks. Educators turn training slides into study
                material alongside our{" "}
                <InternalTextLink href="/summarize-pdf">AI PDF summarizer</InternalTextLink>.
                Use{" "}
                <InternalTextLink href="/modes/executive-brief">
                  Executive Brief mode
                </InternalTextLink>{" "}
                in the{" "}
                <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>{" "}
                for decision-ready outputs.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="How presentation analysis works"
        steps={[
          { title: "Upload PPTX", description: "Drop your deck in the file workspace tab." },
          { title: "Extract slides", description: "Titles, themes, and outline preserved." },
          { title: "Analyze", description: "Deck-aware compaction and intelligence modes." },
          { title: "Review & Learn", description: "Summary plus cards for recall and decisions." },
        ]}
      />

      <FeatureGrid
        title="What you get from a deck"
        features={[
          {
            title: "Slide-aware analysis",
            description: "Editorial structure from real slide content, not fragment noise.",
          },
          {
            title: "Narrative & themes",
            description: "Story arc and repeated motifs across the presentation.",
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
            description: "Executive Brief for decisions and implications.",
          },
          {
            title: "Training & courses",
            description: "Student-friendly concepts from slide-heavy material.",
          },
          {
            title: "Client deliverables",
            description: "Digest partner presentations quickly.",
          },
        ]}
      />

      <FAQSection items={PPTX_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.pptx} />

      <CTASection
        title="Summarize your next presentation"
        description="PPTX upload in the workspace — same engine as PDFs and articles."
        primaryLabel="Start summarizing"
      />
    </>
  );
}
