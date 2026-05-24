import { JsonLd } from "@/components/seo/JsonLd";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { PublicHero } from "@/components/public/PublicHero";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoBreadcrumbs } from "@/components/public/SeoBreadcrumbs";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { pageSeo } from "@/lib/page-metadata";
import { seoLandingPageJsonLd } from "@/lib/schema";

export const metadata = pageSeo.pdfToPodcast;

const FAQS = [
  { q: "Is this passive learning only?", a: "It supports passive moments, but works best when paired with active recall cards and short review loops." },
  { q: "Can I use this for commute study?", a: "Yes. Many users convert textbook sections or reports into audio sessions for commute time." },
  { q: "Does it preserve structure from the PDF?", a: "Yes. The goal is to keep conceptual structure while making it listenable." },
];

export default function PdfToPodcastPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/pdf-to-podcast",
          pageTitle: "Turn Any PDF Into a Podcast Study Session — Summify",
          description:
            "Upload your lecture notes or research paper. Two AI speakers discuss the key ideas in a natural conversation you can listen to anywhere.",
          faqs: FAQS,
          howToSteps: [
            { name: "Upload reading", text: "Add your PDF chapter, report, or paper." },
            { name: "Generate structure", text: "Extract key points and study-relevant sections." },
            { name: "Create audio lesson", text: "Transform output into podcast-style listening." },
            { name: "Reinforce with review", text: "Return to cards and notes for active recall." },
          ],
        })}
      />
      <SeoBreadcrumbs items={[{ name: "Home", href: "/" }, { name: "PDF to Podcast", href: "/pdf-to-podcast" }]} />
      <PublicHero
        badge="Audio-first study"
        title="Turn PDFs into podcast-style learning sessions"
        description="Upload your lecture notes or research paper. Two AI speakers discuss the key ideas in a natural conversation you can listen to anywhere."
        primaryCta={{ href: "/upload", label: "Convert a PDF" }}
        secondaryCta={{ href: "/best-ai-for-studying", label: "See study workflows" }}
      />
      <SeoContentSection
        eyebrow="Lifestyle-friendly learning"
        title="When reading time is fragmented, listening keeps momentum"
        blocks={[
          { body: "PDF to podcast workflows help bridge low-energy moments. Instead of dropping the study session, you can continue through structured audio and return to text later." },
        ]}
      />
      <FormatWorkflow
        title="Podcast workflow visual"
        steps={[
          { title: "Ingest PDF", description: "Upload source material." },
          { title: "Extract key structure", description: "Build a coherent understanding map." },
          { title: "Generate podcast-style output", description: "Convert into listenable lesson format." },
          { title: "Loop back to revision", description: "Reinforce with cards and note review." },
        ]}
      />
      <UseCaseSection
        title="Listening use cases"
        cases={[
          { title: "Commuting", description: "Use travel time for low-friction revision." },
          { title: "Walking", description: "Turn recovery breaks into concept reinforcement." },
          { title: "Late-night review", description: "Reduce screen fatigue while maintaining focus." },
        ]}
      />
      <FeatureGrid
        title="Productivity angle"
        features={[
          { title: "Less context switching", description: "Keep one workflow across text and audio." },
          { title: "Lower cognitive drag", description: "Capture material even when deep reading is hard." },
          { title: "Better continuity", description: "Return to the same workspace when back at desk." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          { href: "/pdf-summarizer", label: "PDF summarizer", description: "Start from structured summaries." },
          { href: "/ai-note-tool", label: "AI note tool", description: "Organize what you listened to." },
          { href: "/youtube-video-summarizer", label: "YouTube summarizer", description: "Blend lecture video with PDF reading." },
        ]}
      />
      <CTASection title="Listen to your next chapter" description="Convert long reading into a practical audio study session." primaryLabel="Start PDF to podcast" />
    </>
  );
}
