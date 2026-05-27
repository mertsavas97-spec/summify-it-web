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

export const metadata = pageSeo.youtubeVideoSummarizer;

const FAQS = [
  { q: "Can I summarize long educational videos?", a: "Yes. Summify is designed for long-form lecture and educational content where structure matters." },
  { q: "Does this generate notes from YouTube?", a: "Yes. It converts transcript-based content into structured notes and key insights." },
  { q: "Can I combine video and PDF learning?", a: "Yes. Many users pair lecture videos with PDFs in one workflow." },
];

export default function YoutubeVideoSummarizerPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/youtube-video-summarizer",
          pageTitle: "YouTube Video Summarizer",
          description:
            "Summarize long YouTube lectures and educational videos into structured notes, insights, and revision outputs.",
          faqs: FAQS,
        })}
      />
      <SeoBreadcrumbs items={[{ name: "Home", href: "/" }, { name: "YouTube Video Summarizer", href: "/youtube-video-summarizer" }]} />
      <PublicHero
        badge="Educational video intelligence"
        title="Summarize YouTube lectures into clear study notes"
        description="Turn long video content into structured understanding you can revise, connect to readings, and revisit later in audio-first study flow."
        primaryCta={{ href: "/upload", label: "Paste a YouTube URL" }}
        secondaryCta={{ href: "/pdf-summarizer", label: "Pair with PDF summaries" }}
      />
      <SeoContentSection
        eyebrow="From passive watching to active learning"
        title="Extract insights from long educational video"
        blocks={[
          { body: "Instead of rewatching entire lectures, summarize core concepts, reasoning, and practical takeaways into reusable notes. The goal is better retention, not just shorter content." },
        ]}
      />
      <FormatWorkflow
        title="YouTube summarization workflow"
        steps={[
          { title: "Paste URL", description: "Add lecture or educational video link." },
          { title: "Analyze transcript", description: "Generate structured key ideas and themes." },
          { title: "Create notes", description: "Save clean study-oriented outputs." },
          { title: "Reinforce", description: "Use related audio and card-based review workflows." },
        ]}
      />
      <UseCaseSection
        title="Best fit use cases"
        cases={[
          { title: "Lecture capture", description: "Condense long class recordings into revision notes." },
          { title: "Concept channels", description: "Extract reusable insights from educational creators." },
          { title: "Research explainers", description: "Pair video explainers with source reading." },
        ]}
      />
      <FeatureGrid
        title="Built for studying, not feed scrolling"
        features={[
          { title: "Structured notes", description: "Clear outputs designed for review sessions." },
          { title: "Cross-source workflow", description: "Connect YouTube insights with PDF material." },
          { title: "Audio continuity", description: "Continue learning while walking or commuting." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          {
            href: "/guides/how-to-summarize-youtube-videos-with-ai",
            label: "YouTube video summarization guide",
            description: "Learn how to summarize YouTube videos with AI without losing context.",
          },
          { href: "/best-ai-for-studying", label: "Best AI for studying", description: "See complete learning-system workflows." },
          { href: "/ai-note-tool", label: "AI note tool", description: "Turn video insights into structured revision notes." },
          { href: "/pdf-to-podcast", label: "PDF to podcast", description: "Bring reading and listening together." },
        ]}
      />
      <CTASection title="Turn your next lecture into usable notes" description="Paste the link, extract structure, and keep momentum." primaryLabel="Summarize YouTube video" />
    </>
  );
}
