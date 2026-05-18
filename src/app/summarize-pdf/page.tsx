import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";

export const metadata = buildPageMetadata({
  title: "AI PDF summarizer with Learn cards and quiz-ready notes",
  description:
    "Summarize PDFs with AI — structured insights, study-ready Learn cards, and quiz-friendly outputs. Not just bullet summaries: intelligence modes for students and professionals.",
  path: "/summarize-pdf",
  keywords: [
    "AI PDF summarizer",
    "summarize PDF with AI",
    "AI quiz from PDF",
    "PDF study notes",
  ],
});

export default function SummarizePdfPage() {
  return (
    <>
      <PublicHero
        badge="PDF intelligence"
        title="AI PDF summarizer — structured intelligence, not just bullets."
        description="Upload research papers, reports, and ebooks. Get mode-specific analysis, key insights, risks, actions, and Learn cards you can study from or share."
        primaryCta={{ href: "/upload", label: "Summarize a PDF" }}
        secondaryCta={{ href: "/for-students", label: "For students" }}
      >
        <ProductMockCard />
      </PublicHero>

      <FormatWorkflow
        steps={[
          { title: "Upload PDF", description: "Drop your file in the workspace (PDF, DOCX, or TXT)." },
          { title: "Pick a lens", description: "Student, Executive, Creator, or Contract Analyzer." },
          { title: "Get structure", description: "Summary, insights, and mode-tuned analysis." },
          { title: "Study with Learn", description: "Concept, quiz, and why-it-matters cards." },
        ]}
      />

      <FeatureGrid
        title="What you get from a PDF"
        features={[
          {
            title: "Structured summary",
            description: "Title, overview, insights, risks, and next actions — grounded in the document.",
          },
          {
            title: "Learn cards",
            description: "Quiz-ready and concept cards weighted for your intelligence mode.",
          },
          {
            title: "Long-document handling",
            description: "Knowledge-layer compaction for longer PDFs without losing structure.",
          },
        ]}
      />

      <UseCaseSection
        title="Best for"
        cases={[
          {
            title: "Students",
            description: "Turn textbooks and papers into study notes and self-quizzes.",
          },
          {
            title: "Researchers",
            description: "Extract arguments, gaps, and themes from dense PDFs.",
          },
          {
            title: "Professionals",
            description: "Executive briefs and contract-style clarity from reports.",
          },
        ]}
      />

      <CTASection
        title="Summarize your next PDF"
        description="Four intelligence modes are live. Upload and analyze in the workspace."
      />
    </>
  );
}
