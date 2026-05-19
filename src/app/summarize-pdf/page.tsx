import { pageSeo } from "@/lib/page-metadata";
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
import { PDF_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.summarizePdf;

export default function SummarizePdfPage() {
  return (
    <>
      <PublicHero
        badge="AI PDF summarizer"
        title="Summarize PDF online with structured intelligence"
        description="Upload research papers, reports, and ebooks to our AI PDF summarizer. Get mode-specific analysis, AI study notes, quiz-ready Learn cards, and insights — not just bullet summaries."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/for-students", label: "AI study notes" }}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="Why Summify for PDFs"
        title="An AI PDF summarizer built for depth"
        blocks={[
          {
            body: (
              <>
                Summify is a document summary tool that goes beyond extracting bullets. When you
                summarize PDF online in the{" "}
                <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>,
                you choose an intelligence mode — study, executive, creator, or legal — and receive
                structured outputs grounded in the source.
              </>
            ),
          },
          {
            heading: "What you get",
            body: (
              <>
                Expect a structured summary, key insights, risks, and next actions, plus Learn cards
                for concepts and self-quiz review. Students use it to build{" "}
                <InternalTextLink href="/for-students">AI study notes</InternalTextLink>; teams pair
                it with our{" "}
                <InternalTextLink href="/summarize-youtube-video">
                  YouTube transcript summarizer
                </InternalTextLink>{" "}
                for mixed-media research.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="How the PDF summarizer works"
        steps={[
          { title: "Upload PDF", description: "Drop your file in the workspace (PDF, DOCX, or TXT)." },
          { title: "Pick a lens", description: "Student, Executive, Creator, or Contract Analyzer." },
          { title: "Get structure", description: "AI document analysis with mode-tuned outputs." },
          { title: "Study with Learn", description: "Concept, quiz, and why-it-matters cards." },
        ]}
      />

      <FeatureGrid
        title="PDF summarizer capabilities"
        features={[
          {
            title: "Structured summary",
            description: "Title, overview, insights, risks, and next actions — grounded in the document.",
          },
          {
            title: "Quiz from PDF",
            description: "Learn cards weighted for recall when using study-focused modes.",
          },
          {
            title: "Long-document handling",
            description: "Compaction for longer PDFs without losing narrative structure.",
          },
        ]}
      />

      <UseCaseSection
        title="Best for"
        cases={[
          {
            title: "Students & exam prep",
            description: "Textbooks and papers into study notes and self-quizzes.",
          },
          {
            title: "Researchers",
            description: "Extract arguments, gaps, and themes from dense PDFs.",
          },
          {
            title: "Professionals",
            description: "Executive briefs from reports via intelligence modes.",
          },
        ]}
      />

      <FAQSection items={PDF_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.pdf} />

      <CTASection
        title="Summarize your next PDF"
        description="Four intelligence modes are live. Open the workspace and upload in seconds."
        primaryLabel="Start summarizing"
      />
    </>
  );
}
