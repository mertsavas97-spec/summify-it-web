import { pageSeo } from "@/lib/page-metadata";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { RESEARCHERS_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.forResearchers;

export default function ForResearchersPage() {
  return (
    <>
      <PublicHero
        badge="For researchers"
        title="Literature review from PDFs, preprints, and web articles"
        description="Synthesize academic PDFs and reporting into structured notes with General Summary or The Student mode. Built for thematic extraction — always verify claims against the source."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/the-student", label: "The Student mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <SeoContentSection
        eyebrow="For researchers"
        title="Evidence synthesis without replacing close reading"
        blocks={[
          {
            body: (
              <>
                Summify supports literature review workflows in the{" "}
                <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>.
                Upload papers via our{" "}
                <InternalTextLink href="/summarize-pdf">PDF summarizer</InternalTextLink> or
                analyze public articles with the{" "}
                <InternalTextLink href="/summarize-web-articles">web article flow</InternalTextLink>.
              </>
            ),
          },
          {
            heading: "Verify every claim",
            body: (
              <>
                AI summaries can miss nuance or misstate findings. Use outputs to orient your
                reading list, then confirm statistics and citations in the original. See our{" "}
                <InternalTextLink href="/guides/ai-study-notes-guide">
                  AI study notes guide
                </InternalTextLink>{" "}
                for review discipline.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="Research-oriented capabilities"
        features={[
          {
            title: "PDF & preprint support",
            description: "Dense academic PDFs with compaction for long documents.",
          },
          {
            title: "Thematic extraction",
            description: "Insights, gaps, and connections across sections.",
          },
          {
            title: "Learn for concepts",
            description: "Concept cards when using study-focused modes.",
          },
        ]}
      />

      <FormatWorkflow
        title="How researchers use Summify"
        steps={[
          { title: "Collect sources", description: "PDF papers, preprints, and article URLs." },
          { title: "Choose lens", description: "General Summary or The Student for concepts." },
          { title: "Map themes", description: "Compare insights across your reading set." },
          { title: "Verify in source", description: "Confirm claims before citing in writing." },
        ]}
      />

      <FAQSection items={RESEARCHERS_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.researchers} />

      <CTASection
        title="Synthesize your next paper"
        description="Free during public beta — start with one PDF or article URL."
        primaryLabel="Open workspace"
        secondaryHref="/use-cases/research-papers-students"
        secondaryLabel="Research use case"
      />
    </>
  );
}
