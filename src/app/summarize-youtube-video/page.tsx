import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";

export const metadata = buildPageMetadata({
  title: "Summarize YouTube videos with AI — transcript to study notes",
  description:
    "YouTube video to structured intelligence: transcript extraction, key ideas, timestamps, and Learn cards. One-click analyze from a video link.",
  path: "/summarize-youtube-video",
  keywords: [
    "summarize YouTube video with AI",
    "YouTube video to study notes AI",
    "YouTube transcript summarizer",
  ],
});

export default function SummarizeYoutubePage() {
  return (
    <>
      <PublicHero
        badge="YouTube intelligence"
        title="YouTube transcript intelligence — one click from link to notes."
        description="Paste a video URL. Summify extracts the transcript, profiles the content, and returns structured analysis plus Learn cards — hooks for creators, concepts for students."
        primaryCta={{ href: "/upload", label: "Analyze a YouTube video" }}
        secondaryCta={{ href: "/for-creators", label: "For creators" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <FormatWorkflow
        steps={[
          { title: "Paste URL", description: "Watch, Shorts, or youtu.be links supported." },
          { title: "Fetch transcript", description: "Caption-based extraction on the server." },
          { title: "Analyze", description: "Mode-specific intelligence on spoken content." },
          { title: "Learn layer", description: "Cards for recall, hooks, and connections." },
        ]}
      />

      <FeatureGrid
        title="What you get from a video"
        features={[
          {
            title: "Transcript intelligence",
            description: "Analysis grounded in what was actually said — not video download.",
          },
          {
            title: "Key ideas & structure",
            description: "Themes, insights, and mode-specific outputs from long talks.",
          },
          {
            title: "Learn cards",
            description: "Study or repurposing cards tuned to Creator or Student modes.",
          },
        ]}
      />

      <UseCaseSection
        title="Best for"
        cases={[
          {
            title: "Lecture capture",
            description: "Turn recorded classes into reviewable notes and quizzes.",
          },
          {
            title: "Podcast & interview clips",
            description: "Find hooks and angles for social and newsletters.",
          },
          {
            title: "Research & learning",
            description: "Digest long explainers without rewatching hours of video.",
          },
        ]}
      />

      <CTASection
        title="Analyze your next YouTube video"
        description="One-click flow in the workspace — transcript required on the video."
      />
    </>
  );
}
