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

      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-semibold text-white">Team plan pricing</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            One flat plan — no per-seat math on day one. Billed through our payment provider;
            invoices included.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/90">
                Monthly
              </span>
              <p className="mt-2 text-3xl font-semibold text-white">
                $24.99
                <span className="text-sm font-normal text-zinc-500">/month</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Cancel anytime · invoices included</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950/50 p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Yearly
              </span>
              <p className="mt-2 text-3xl font-semibold text-white">
                $199.99
                <span className="text-sm font-normal text-zinc-500">/year</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Save ~33% vs monthly</p>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 lg:max-w-3xl">
            {[
              "Up to 5 seats included",
              "Everything in Pro — all intelligence modes",
              "Shared library for saved analyses",
              "API access and custom modes",
              "Invoices for procurement",
              "20 MB file size, exports, and mind maps",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400/90" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-zinc-600">
            Full plan comparison on the{" "}
            <InternalTextLink href="/pricing">pricing page</InternalTextLink>.
          </p>
        </div>
      </section>

      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold text-white">
            How your documents are handled
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Before you route internal documents through any AI tool, the data terms matter.
            Here is what our{" "}
            <InternalTextLink href="/privacy">privacy policy</InternalTextLink> states today:
          </p>
          <ul className="mt-6 space-y-3 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-400/90" aria-hidden>
                ✓
              </span>
              <span>We do not sell your uploaded content.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-400/90" aria-hidden>
                ✓
              </span>
              <span>
                Extracted text and prompts are sent to third-party AI providers only to
                generate your summaries, Learn cards, and quizzes.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-400/90" aria-hidden>
                ✓
              </span>
              <span>
                Server logs are used for reliability and security — not for advertising.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-600" aria-hidden>
                —
              </span>
              <span className="text-zinc-500">
                We do not currently claim SOC 2, ISO 27001, or a DPA — ask us before your
                security review if procurement requires them.
              </span>
            </li>
          </ul>
        </div>
      </section>

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
        description="Upload and analyze in one flow. Team plans cover up to 5 seats."
        primaryLabel="Open workspace"
        secondaryHref="/pricing"
        secondaryLabel="Team pricing preview"
      />
    </>
  );
}
