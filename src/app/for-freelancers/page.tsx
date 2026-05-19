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
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { FREELANCERS_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.forFreelancers;

export default function ForFreelancersPage() {
  return (
    <>
      <PublicHero
        badge="For freelancers"
        title="Client briefs, SOWs, and contracts — first-pass intelligence"
        description="Upload DOCX and PDF client documents. Contract Summary highlights obligations and ambiguous clauses for your review. Executive Brief compresses strategy memos before you respond."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/contract-analyzer", label: "Contract Summary" }}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="For freelancers"
        title="Move faster on client paperwork — verify everything"
        blocks={[
          {
            body: (
              <>
                Summify helps freelancers skim client agreements and briefs in the{" "}
                <InternalTextLink href="/upload">analysis workspace</InternalTextLink>.
                Use Contract Summary for agreements and Executive Brief for proposals — then
                validate every clause and commitment in the original document.
              </>
            ),
          },
          {
            heading: "Not legal advice",
            body: (
              <>
                Outputs are informational starting points. See our{" "}
                <InternalTextLink href="/guides/contract-summary-ai-guide">
                  contract summary guide
                </InternalTextLink>{" "}
                and{" "}
                <InternalTextLink href="/summarize-docx">DOCX summarizer</InternalTextLink>{" "}
                for workflow tips.
              </>
            ),
          },
        ]}
      />

      <ProductDisclaimer className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8" />

      <FeatureGrid
        title="Freelancer-friendly workflows"
        features={[
          {
            title: "Contract first reads",
            description: "Dates, obligations, and risks called out for human review.",
          },
          {
            title: "DOCX & PDF",
            description: "Client exports from Google Docs or signed PDFs.",
          },
          {
            title: "Brief compression",
            description: "Executive Brief for RFPs and strategy decks.",
          },
        ]}
      />

      <FormatWorkflow
        title="How freelancers use Summify"
        steps={[
          { title: "Upload client doc", description: "DOCX, PDF, or pasted scope text." },
          { title: "Pick lens", description: "Contract Summary or Executive Brief." },
          { title: "Flag gaps", description: "Note ambiguous terms to clarify with client." },
          { title: "Verify source", description: "Confirm every obligation in the original." },
        ]}
      />

      <FAQSection items={FREELANCERS_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.freelancers} />

      <CTASection
        title="Analyze your next client document"
        description="Free during public beta — do not upload confidential material you cannot process on AI providers."
        primaryLabel="Open workspace"
        secondaryHref="/summarize-docx"
        secondaryLabel="DOCX summarizer"
      />
    </>
  );
}
