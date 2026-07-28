import { pageSeo } from "@/lib/page-metadata";
import { seoLandingPageJsonLd } from "@/lib/schema";
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
import { PDF_FAQS, PDF_HOW_TO_STEPS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.summarizePdf;

export default function SummarizePdfPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/summarize-pdf",
          pageTitle: "AI PDF Summarizer",
          description:
            "Summarize PDF online with AI. Structured summaries, key insights, flashcards, and quizzes for research papers, textbooks, and reports.",
          howToSteps: [...PDF_HOW_TO_STEPS],
        })}
      />
      <PublicHero
        badge="AI PDF summarizer"
        title="AI PDF Summarizer — Summarize PDFs Instantly"
        description="Upload research papers, textbooks, reports, and ebooks. Get a structured AI PDF summary, key insights, flashcards, and a quiz — not just bullet lists."
        primaryCta={{ href: "/upload", label: "Summarize PDF free" }}
        secondaryCta={{ href: "/for-students", label: "For students" }}
      >
        <ProductMockCard />
      </PublicHero>

      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Summarize PDF</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              When you{" "}
              <strong className="font-semibold text-zinc-200">summarize PDF</strong> online in the{" "}
              <InternalTextLink href="/upload">Summify workspace</InternalTextLink>, you choose an
              intelligence mode — study, executive, creator, or contract — and receive structured
              outputs grounded in the source. No install: upload and run analysis in one flow.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">AI PDF Summarizer</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Looking for an{" "}
              <strong className="font-semibold text-zinc-200">AI PDF summarizer</strong> that goes
              beyond extracting bullets? Expect a structured summary, key insights, risks, and next
              actions, plus flashcards and a quiz for recall. Pair with our{" "}
              <InternalTextLink href="/summarize-powerpoint">PowerPoint summarizer</InternalTextLink>{" "}
              and{" "}
              <InternalTextLink href="/summarize-youtube-video">YouTube summarizer</InternalTextLink>{" "}
              for mixed-media research.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              PDF Summary Generator
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Use Summify as a{" "}
              <strong className="font-semibold text-zinc-200">PDF summary generator</strong> for
              papers, textbooks, and reports — then keep studying with Learn cards instead of
              re-reading the whole file. Students build{" "}
              <InternalTextLink href="/for-students">AI study notes</InternalTextLink>; professionals
              draft executive briefs from the same upload.
            </p>
          </div>
        </div>
      </section>

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
            description:
              "Title, overview, insights, risks, and next actions — grounded in the document.",
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

      {/* FAQPage JSON-LD emitted here only — not duplicated in page JsonLd. */}
      <FAQSection items={PDF_FAQS} withSchema />

      <RelatedLinksSection links={RELATED_LINKS.pdf} />

      <CTASection
        title="Summarize your next PDF"
        description="Four free core lenses are live (including Study). Open the workspace and upload in seconds."
        primaryLabel="Start summarizing"
      />
    </>
  );
}
