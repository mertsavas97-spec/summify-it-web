import { Suspense } from "react";
import { pageSeo } from "@/lib/page-metadata";
import { howToSummifySchema, softwareApplicationSchema } from "@/lib/schema";
import { SUMMIFY_HOW_TO_STEPS } from "@/data/seo-howto";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { HomeHero } from "@/components/public/HomeHero";
import { HomeAfterSummarySection } from "@/components/public/HomeAfterSummarySection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { HomeTrustBar } from "@/components/public/HomeTrustBar";
import { HOME_FAQS, RELATED_LINKS } from "@/data/landing-seo";
import { HomePricingPreview } from "@/components/public/HomePricingPreview";
import { SummarizeFormatGrid } from "@/components/public/SummarizeFormatGrid";
import { PersonaChipsRow } from "@/components/public/PersonaChipsRow";
import { DifferentiationStrip } from "@/components/public/DifferentiationStrip";
import { SocialProofCarousel } from "@/components/public/SocialProofCarousel";
import { StickyCTA } from "@/components/public/StickyCTA";
import { HomeClosingCta } from "@/components/public/HomeClosingCta";

export const metadata = pageSeo.home;

/* Hero headline alternatives (comment-only, do not auto-replace):
   1) Free AI summarizer for PDFs, decks, videos, and articles.
   2) Summarize any source — then flashcards, quiz, and audio.
   3) AI PDF & document summarizer with a built-in study workflow.
*/
export default function HomePage() {
  return (
    <>
      <ProductEventTracker event="landing_view" />
      <JsonLd
        data={[
          softwareApplicationSchema({ path: "/" }),
          howToSummifySchema(SUMMIFY_HOW_TO_STEPS),
        ]}
      />

      <Suspense fallback={<div className="min-h-[420px]" aria-hidden />}>
        <HomeHero />
      </Suspense>

      <HomeTrustBar />

      <SummarizeFormatGrid />

      <PersonaChipsRow />

      <HomeAfterSummarySection />

      <FormatWorkflow
        id="how-it-works"
        title="From upload to summary in minutes"
        steps={[
          {
            title: "Upload or paste",
            description: "Add a PDF, PowerPoint, YouTube URL, web article, or text.",
          },
          {
            title: "Get your AI summary",
            description: "Structured overview and key insights, tuned by your lens.",
          },
          {
            title: "Study, quiz, or listen next",
            description:
              "Open study cards, take a quiz, explore the mind map — or generate an audio lesson / podcast when you're ready.",
          },
        ]}
      />

      <DifferentiationStrip />

      <HomePricingPreview />

      <SocialProofCarousel />

      <FAQSection
        title="Common questions about Summify"
        subtitle="Quick answers before your first AI summary."
        items={HOME_FAQS}
      />

      <HomeClosingCta />

      <RelatedLinksSection title="Explore by format and workflow" links={RELATED_LINKS.home} />
      <StickyCTA />
    </>
  );
}
