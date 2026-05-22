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
import { YOUTUBE_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.summarizeYoutube;

export default function SummarizeYoutubePage() {
  return (
    <>
      <JsonLd
        data={[
          ...productPageJsonLd({
            path: "/summarize-youtube-video",
            pageTitle: "YouTube Summarizer",
            description:
              "Paste a YouTube URL for transcript-based summaries, study notes, Learn cards, and quizzes.",
          }),
          faqPageSchema(YOUTUBE_FAQS),
        ]}
      />
      <PublicHero
        badge="YouTube summarizer"
        title="Summarize YouTube videos with AI from transcript to notes"
        description="Paste a video URL for YouTube transcript summarizer workflows — structured analysis, study notes from videos, key themes, and Learn cards for creators and students."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/for-creators", label: "For creators" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <SeoContentSection
        eyebrow="YouTube intelligence"
        title="A YouTube summarizer grounded in transcripts"
        blocks={[
          {
            body: (
              <>
                Summify does not download video files. It extracts captions and transcripts, then
                runs AI document analysis tuned to your mode — ideal when you need to summarize
                YouTube video with AI without rewatching the full runtime.
              </>
            ),
          },
          {
            heading: "Study notes from videos",
            body: (
              <>
                Students capture lectures as study notes from videos. Creators use the same flow
                with{" "}
                <InternalTextLink href="/modes/the-creator">The Creator mode</InternalTextLink> for
                hooks and repurposing. Pair with our{" "}
                <InternalTextLink href="/summarize-pdf">AI PDF summarizer</InternalTextLink> when
                research mixes papers and video.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="How to summarize YouTube video with AI"
        steps={[
          { title: "Paste URL", description: "Watch, Shorts, or youtu.be links supported." },
          { title: "Fetch transcript", description: "Caption-based extraction on the server." },
          { title: "Analyze", description: "Mode-specific intelligence on spoken content." },
          { title: "Learn layer", description: "Cards for recall, hooks, and connections." },
        ]}
      />

      <FeatureGrid
        title="What you get from video"
        features={[
          {
            title: "Transcript intelligence",
            description: "Analysis grounded in what was said — reliable for lectures and podcasts.",
          },
          {
            title: "Themes & structure",
            description: "Key ideas from long talks without manual note-taking.",
          },
          {
            title: "Learn cards",
            description: "Study or repurposing cards tuned to your intelligence mode.",
          },
        ]}
      />

      <UseCaseSection
        title="Best for"
        cases={[
          {
            title: "Lecture capture",
            description: "Recorded classes into reviewable notes and quizzes.",
          },
          {
            title: "Podcast & interviews",
            description: "Find hooks and angles for newsletters and social.",
          },
          {
            title: "Research learning",
            description: "Digest explainers without hours of playback.",
          },
        ]}
      />

      <FAQSection items={YOUTUBE_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.youtube} />

      <CTASection
        title="Analyze your next YouTube video"
        description="One-click flow in the workspace — transcript required on the video."
        primaryLabel="Open the workspace"
      />
    </>
  );
}
