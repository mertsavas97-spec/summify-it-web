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
        title="Your AI Study Companion for Lectures, PDFs & Research Papers"
        description="Create structured notes, Learn cards, audio lessons, and podcast-style study sessions from your class materials in one workflow."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/the-student", label: "The Student mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-semibold text-zinc-100">
          ChatGPT vs NotebookLM vs Summify
        </h2>
        <p className="mt-3 text-center text-sm text-zinc-400">
          Compare core study outputs across common tools.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-zinc-900/40">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-white/[0.08] bg-zinc-950/50 text-zinc-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 font-semibold">ChatGPT</th>
                <th className="px-4 py-3 font-semibold">NotebookLM</th>
                <th className="px-4 py-3 font-semibold">Summify</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-medium text-zinc-100">PDF Summary</td>
                <td className="px-4 py-3">Yes</td>
                <td className="px-4 py-3">Yes</td>
                <td className="px-4 py-3">Yes</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-medium text-zinc-100">Learn Cards</td>
                <td className="px-4 py-3">Limited / manual prompting</td>
                <td className="px-4 py-3">Limited</td>
                <td className="px-4 py-3">Built-in structured cards</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-medium text-zinc-100">Audio Lessons</td>
                <td className="px-4 py-3">Not workflow-native</td>
                <td className="px-4 py-3">Limited</td>
                <td className="px-4 py-3">Teacher-style lessons</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-zinc-100">Podcast Study</td>
                <td className="px-4 py-3">No</td>
                <td className="px-4 py-3">Audio overviews</td>
                <td className="px-4 py-3">Two-speaker podcast study</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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
