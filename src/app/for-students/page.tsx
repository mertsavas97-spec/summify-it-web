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
import { STUDENTS_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.forStudents;

export default function ForStudentsPage() {
  return (
    <>
      <PublicHero
        badge="AI study notes"
        title="AI study notes from PDFs, lectures, and YouTube"
        description="Turn readings and recorded lectures into structured notes, concept cards, and exam prep material. The Student intelligence mode emphasizes quiz-ready Learn outputs."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/the-student", label: "The Student mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <SeoContentSection
        eyebrow="For students"
        title="Exam prep from notes, not just highlights"
        blocks={[
          {
            body: (
              <>
                Summify helps you build AI study notes from the sources you already use — PDF
                readings, slide decks, and YouTube lectures. Open the{" "}
                <InternalTextLink href="/upload">AI study notes workspace</InternalTextLink> and
                run The Student mode for concept-heavy Learn cards.
              </>
            ),
          },
          {
            heading: "Quiz generator from PDF and video",
            body: (
              <>
                Learn cards act as a lightweight quiz generator from PDF and transcript sources.
                Pair with our{" "}
                <InternalTextLink href="/summarize-pdf">summarize PDF online</InternalTextLink>{" "}
                flow and{" "}
                <InternalTextLink href="/summarize-youtube-video">
                  YouTube lecture notes
                </InternalTextLink>{" "}
                for mixed-semester workflows.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="Study workflows that fit your sources"
        features={[
          {
            title: "PDFs & papers",
            description: "Upload readings for structured study notes and themes.",
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
        title="How it works for students"
        steps={[
          { title: "Add material", description: "PDF, PPTX, video link, or pasted notes." },
          { title: "Select The Student", description: "Academic lens with quiz-heavy Learn." },
          { title: "Review analysis", description: "Insights, concepts, and gaps flagged." },
          { title: "Drill with Learn", description: "Cards for recall before the exam." },
        ]}
      />

      <FAQSection items={STUDENTS_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.students} />

      <CTASection
        title="Try The Student mode free"
        description="Active in the workspace today alongside Executive Brief, The Creator, and Contract Summary."
        primaryLabel="Open the workspace"
        secondaryHref="/modes"
        secondaryLabel="Intelligence modes"
      />
    </>
  );
}
