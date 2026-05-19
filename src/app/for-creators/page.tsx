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
import { CREATORS_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.forCreators;

export default function ForCreatorsPage() {
  return (
    <>
      <PublicHero
        badge="For creators"
        title="Podcast summarizer and YouTube to content ideas"
        description="Repurpose long-form content with The Creator mode — viral hooks AI suggestions, beat sheets, and Learn cards from transcripts, articles, and documents."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/the-creator", label: "The Creator mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <SeoContentSection
        eyebrow="Creator workflows"
        title="Repurpose long-form without rewatching everything"
        blocks={[
          {
            body: (
              <>
                Summify works as a podcast summarizer when you have transcripts or captioned
                YouTube uploads. Use it for YouTube to content ideas — threads, newsletters, and
                short-form scripts grounded in what was actually said.
              </>
            ),
          },
          {
            heading: "Hooks and angles",
            body: (
              <>
                The Creator mode emphasizes hook and connection Learn cards — a practical viral
                hooks AI assistant for planning social content. Start in the{" "}
                <InternalTextLink href="/upload">document analysis workspace</InternalTextLink> or
                jump to our{" "}
                <InternalTextLink href="/summarize-youtube-video">
                  YouTube summarizer
                </InternalTextLink>{" "}
                for video-first workflows.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="Built for repurposing workflows"
        features={[
          {
            title: "YouTube & video",
            description: "Transcript intelligence with hook and beat emphasis.",
          },
          {
            title: "Hooks & angles",
            description: "Learn cards for social threads and newsletters.",
          },
          {
            title: "Long-form to short",
            description: "Structured takeaways without rereading everything.",
          },
        ]}
      />

      <FormatWorkflow
        title="How creators use Summify"
        steps={[
          { title: "Paste or upload", description: "Video URL, article link, or script file." },
          { title: "The Creator lens", description: "Creative tone with repurposing guidance." },
          { title: "Scan outputs", description: "Insights, narrative beats, and pull quotes." },
          { title: "Ship Learn cards", description: "Hook and link cards for content planning." },
        ]}
      />

      <FAQSection items={CREATORS_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.creators} />

      <CTASection
        title="Try The Creator in the workspace"
        description="Analyze your next video or article in one flow."
        primaryLabel="Start summarizing"
        secondaryHref="/summarize-youtube-video"
        secondaryLabel="YouTube summarizer"
      />
    </>
  );
}
