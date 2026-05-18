import { buildPageMetadata } from "@/lib/seo";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { ProductMockCard } from "@/components/public/ProductMockCard";

export const metadata = buildPageMetadata({
  title: "AI content intelligence for creators — hooks, angles, repurposing",
  description:
    "Turn podcasts, YouTube videos, and long-form content into hooks, angles, and repurposable ideas with The Creator mode and Learn cards.",
  path: "/for-creators",
  keywords: [
    "AI podcast summarizer",
    "YouTube to blog post AI",
    "viral hooks AI",
  ],
});

export default function ForCreatorsPage() {
  return (
    <>
      <PublicHero
        badge="For creators"
        title="Turn long-form content into hooks, angles, and repurposable ideas."
        description="The Creator mode finds emotional beats, social-first hooks, and moments worth clipping — from YouTube transcripts, articles, and documents."
        primaryCta={{ href: "/upload", label: "Analyze content" }}
        secondaryCta={{ href: "/modes/the-creator", label: "The Creator mode" }}
      >
        <ProductMockCard variant="learn" />
      </PublicHero>

      <FeatureGrid
        title="Built for repurposing workflows"
        features={[
          {
            title: "YouTube & video",
            description: "Transcript intelligence with hook and beat emphasis.",
          },
          {
            title: "Hooks & angles",
            description: "Memory-hook and connection Learn cards for social threads.",
          },
          {
            title: "Long-form to short",
            description: "Structured takeaways without rewatching or rereading everything.",
          },
        ]}
      />

      <FormatWorkflow
        steps={[
          { title: "Paste or upload", description: "Video URL, article link, or script file." },
          { title: "The Creator lens", description: "Creative tone with repurposing guidance." },
          { title: "Scan outputs", description: "Insights, narrative beats, and pull quotes." },
          { title: "Ship Learn cards", description: "Hook and link cards for content planning." },
        ]}
      />

      <CTASection
        title="Try The Creator in the workspace"
        description="Analyze your next video or article in one flow."
        secondaryHref="/summarize-youtube-video"
        secondaryLabel="YouTube summarizer"
      />
    </>
  );
}
