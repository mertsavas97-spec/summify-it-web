import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";
export const metadata = buildPageMetadata({
  title: "AI study notes from PDFs, lectures, and YouTube",
  description:
    "Turn PDFs, lecture videos, and articles into study-ready intelligence with The Student mode — concepts, quizzes, and Learn cards.",
  path: "/for-students",
  keywords: [
    "AI study notes from PDF",
    "AI quiz from PDF",
    "YouTube lecture notes AI",
  ],
});

export default function ForStudentsPage() {
  return (
    <>
      <PublicHero
        badge="For students"
        title="Turn PDFs, lectures, and videos into study-ready understanding."
        description="Use The Student intelligence mode on papers, slides, YouTube lectures, and web articles. Get structured notes, concept cards, and quiz-friendly Learn outputs."
        primaryCta={{ href: "/upload", label: "Start studying smarter" }}
        secondaryCta={{ href: "/modes/the-student", label: "The Student mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <FeatureGrid
        title="Study workflows that fit your sources"
        features={[
          {
            title: "PDFs & papers",
            description: "Upload readings and research PDFs for structured study notes.",
          },
          {
            title: "YouTube lectures",
            description: "One-click transcript analysis for recorded classes.",
          },
          {
            title: "Quiz-ready Learn",
            description: "Concept and quiz cards weighted for exam prep.",
          },
        ]}
      />

      <FormatWorkflow
        title="Study flow"
        steps={[
          { title: "Add material", description: "PDF, PPTX, video link, or pasted notes." },
          { title: "Select The Student", description: "Academic lens with quiz-heavy Learn." },
          { title: "Review analysis", description: "Insights, concepts, and gaps flagged." },
          { title: "Drill with Learn", description: "Cards for recall before the exam." },
        ]}
      />

      <CTASection
        title="Try The Student mode free"
        description="Active in the workspace today alongside Executive Brief, The Creator, and Contract Analyzer."
        secondaryHref="/modes"
        secondaryLabel="All modes"
      />
    </>
  );
}
