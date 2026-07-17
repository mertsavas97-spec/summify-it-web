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
import { PDF_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.summarizePdf;

export default function SummarizePdfPage() {
  return (
    <>
      <JsonLd
        data={[
          ...productPageJsonLd({
            path: "/summarize-pdf",
            pageTitle: "Free AI PDF Summarizer",
            description:
              "Summarize PDF online with AI. Structured summaries, key insights, flashcards, and quizzes for research papers, textbooks, and reports.",
          }),
          faqPageSchema(PDF_FAQS),
        ]}
      />
      <PublicHero
        badge="Free AI PDF summarizer"
        title="Free AI PDF summarizer — summarize PDF online"
        description="Upload research papers, textbooks, reports, and ebooks. Get a structured AI PDF summary, key insights, flashcards, and a quiz — not just bullet lists."
        primaryCta={{ href: "/upload", label: "Summarize PDF free" }}
        secondaryCta={{ href: "/for-students", label: "For students" }}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="Why Summify for PDFs"
        title="An AI PDF summarizer built for depth — and study"
        blocks={[
          {
            body: (
              <>
                Looking for a{" "}
                <strong className="font-semibold text-zinc-200">PDF summarizer</strong> that goes
                beyond extracting bullets? When you{" "}
                <strong className="font-semibold text-zinc-200">summarize PDF</strong> online in the{" "}
                <InternalTextLink href="/upload">Summify workspace</InternalTextLink>, you choose an
                intelligence mode — study, executive, creator, or contract — and receive structured
                outputs grounded in the source.
              </>
            ),
          },
          {
            heading: "What you get from every PDF",
            body: (
              <>
                Expect a structured summary, key insights, risks, and next actions, plus flashcards
                and a quiz for recall. Students use it to build{" "}
                <InternalTextLink href="/for-students">AI study notes</InternalTextLink>; teams pair
                it with our{" "}
                <InternalTextLink href="/summarize-powerpoint">
                  PowerPoint summarizer
                </InternalTextLink>{" "}
                and{" "}
                <InternalTextLink href="/summarize-youtube-video">
                  YouTube summarizer
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
          { title: "Pick a lens", description: "Student, Executive, Creator, or Contract Summary." },
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
