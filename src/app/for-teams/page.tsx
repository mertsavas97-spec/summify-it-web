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
import { TEAMS_FAQS, RELATED_LINKS } from "@/data/landing-seo";

export const metadata = pageSeo.forTeams;

export default function ForTeamsPage() {
  return (
    <>
      <PublicHero
        badge="For teams"
        title="Shared document intelligence for reports, decks, and recordings"
        description="Turn PDFs, PowerPoint decks, web articles, and meeting transcripts into executive-ready briefs. Executive Brief mode highlights risks, owners, and next actions — built for async team review."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/modes/executive-brief", label: "Executive Brief mode" }}
      >
        <ProductMockCard />
      </PublicHero>

      <SeoContentSection
        eyebrow="For teams"
        title="Faster alignment without another status meeting"
        blocks={[
          {
            body: (
              <>
                Summify helps teams compress long inputs into structured outputs in the{" "}
                <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>.
                Upload a quarterly report, strategy deck, or captioned webinar — pick Executive
                Brief — and share a scannable summary with stakeholders who have not read the
                source.
              </>
            ),
          },
          {
            heading: "Formats teams use daily",
            body: (
              <>
                Pair our{" "}
                <InternalTextLink href="/summarize-powerpoint">PowerPoint summarizer</InternalTextLink>{" "}
                with{" "}
                <InternalTextLink href="/summarize-pdf">PDF report analysis</InternalTextLink>{" "}
                and{" "}
                <InternalTextLink href="/use-cases/reports-teams">
                  team report workflows
                </InternalTextLink>{" "}
                for mixed-media reviews.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="Built for team knowledge work"
        features={[
          {
            title: "Executive Brief lens",
            description: "Decision-ready summaries with risks and implied owners.",
          },
          {
            title: "Deck + report coverage",
            description: "PPTX and PDF in one workspace with consistent structure.",
          },
          {
            title: "Shareable outputs",
            description: "Optional public share links when analyses are saved.",
          },
        ]}
      />

      <FormatWorkflow
        title="How teams use Summify"
        steps={[
          { title: "Upload source", description: "PDF, PPTX, article URL, or transcript." },
          { title: "Executive Brief", description: "Leadership tone with action emphasis." },
          { title: "Review gaps", description: "Risks and open questions surfaced early." },
          { title: "Share brief", description: "Hand off structured notes to the team." },
        ]}
      />

      <FAQSection items={TEAMS_FAQS} />

      <RelatedLinksSection links={RELATED_LINKS.teams} />

      <CTASection
        title="Try Executive Brief on your next report"
        description="Free during public beta — upload and analyze in one flow."
        primaryLabel="Open workspace"
        secondaryHref="/pricing"
        secondaryLabel="Team pricing preview"
      />
    </>
  );
}
