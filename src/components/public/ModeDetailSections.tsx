import Link from "next/link";
import { CORE_PRODUCT_LENS_MODE_IDS, getIntelligenceModeById } from "@/config/modes";
import { formatRecommendedSources, getCategoryLabelForMode } from "@/lib/mode-groups";
import { getModeMarketingPreview } from "@/data/mode-marketing";
import type { IntelligenceModeId } from "@/types/modes";
import { Button } from "@/components/ui/Button";
import { ProductDisclaimer } from "@/components/public/ProductDisclaimer";
import { ProductMockCard } from "./ProductMockCard";
import { CTASection } from "./CTASection";
import { InternalTextLink } from "./InternalTextLink";
import { ModeSeoExpansion } from "./ModeSeoExpansion";
import { ComparisonTable } from "@/components/seo/content/ComparisonTable";

type ModeDetailSectionsProps = {
  modeId: IntelligenceModeId;
};

function isCoreProductLens(modeId: string): boolean {
  return (CORE_PRODUCT_LENS_MODE_IDS as readonly string[]).includes(modeId);
}

function modeHeroTitle(modeId: IntelligenceModeId, fallbackLabel: string): string {
  switch (modeId) {
    case "general-summary":
      return "AI Document Summarizer — General Summary";
    case "contract-analyzer":
      return "AI Contract Summary — Clauses & Obligations";
    case "the-student":
      return "AI Study Notes — The Student Mode";
    case "executive-brief":
      return "AI Executive Brief — Decision-Ready Summary";
    case "the-creator":
      return "AI Creator Mode — Hooks, Themes & Beats";
    case "exam-prep":
      return "AI Exam Prep Mode — High-Yield Facts & Test Angles";
    default:
      return fallbackLabel;
  }
}

const MODE_USE_CASES: Partial<
  Record<IntelligenceModeId, { title: string; description: string }[]>
> = {
  "general-summary": [
    {
      title: "First-pass understanding",
      description: "Get a balanced read of any PDF, article, or transcript before deeper analysis.",
    },
    {
      title: "Mixed-source research",
      description: "When you need a neutral lens before switching to Student or Executive modes.",
    },
    {
      title: "Quick handoffs",
      description: "Share structured summaries with teammates who have not read the source.",
    },
  ],
  "executive-brief": [
    {
      title: "Board and leadership updates",
      description: "Decision-ready summaries with risks, tradeoffs, and implied owners.",
    },
    {
      title: "Strategy decks & reports",
      description: "Compress long PDFs and PPTX decks into executive narrative.",
    },
    {
      title: "Vendor and partner reviews",
      description: "Highlight commitments and gaps without re-reading every slide.",
    },
  ],
  "the-student": [
    {
      title: "Lecture capture",
      description: "Turn YouTube lectures and slide PDFs into concepts and self-quizzes.",
    },
    {
      title: "Exam prep",
      description: "Learn cards weighted for recall, misconceptions, and connections.",
    },
    {
      title: "Reading-heavy courses",
      description: "Pair with our PDF summarizer for papers and textbook chapters.",
    },
  ],
  "the-creator": [
    {
      title: "YouTube repurposing",
      description: "Mine hooks, themes, and clip ideas from transcript intelligence.",
    },
    {
      title: "Newsletter & thread drafts",
      description: "Structured beats from podcasts, interviews, and long articles.",
    },
    {
      title: "Content planning",
      description: "See narrative flow before editing in your creative tools.",
    },
  ],
  "contract-analyzer": [
    {
      title: "Contract first reads",
      description: "Obligations, dates, and ambiguous clauses called out for human review.",
    },
    {
      title: "Policy documents",
      description: "Informational overviews — not legal advice.",
    },
    {
      title: "Procurement packets",
      description: "Compare vendor terms faster with risk-weighted insights.",
    },
  ],
};

export function ModeDetailSections({ modeId }: ModeDetailSectionsProps) {
  const mode = getIntelligenceModeById(modeId);
  // Marketing pages for core lenses (incl. paid/locked Contract & Exam) must still render an H1.
  if (!mode || (mode.availability !== "active" && !isCoreProductLens(modeId))) return null;

  const preview = getModeMarketingPreview(modeId);
  const useCases = MODE_USE_CASES[modeId] ?? [];
  const isLockedMarketing = mode.availability !== "active";

  return (
    <>
      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80">
              {getCategoryLabelForMode(modeId)} ·{" "}
              {isLockedMarketing ? "Paid lens" : "Active mode"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {modeHeroTitle(mode.id, mode.label)}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              {mode.intelligenceLens}
            </p>
            <p className="mt-3 text-sm text-zinc-500">{mode.shortDescription}</p>
            <p className="mt-4 text-xs text-zinc-600">
              Best for: {formatRecommendedSources(mode.recommendedSources)}
            </p>
            {mode.id === "contract-analyzer" ? (
              <ProductDisclaimer className="mt-4 max-w-prose" />
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button href={isLockedMarketing ? "/pricing" : "/upload"} size="md">
                {isLockedMarketing ? `Unlock ${mode.label}` : `Try ${mode.label} in workspace`}
              </Button>
              <Button href="/modes" size="md" variant="secondary">
                All modes
              </Button>
            </div>
          </div>
          <ProductMockCard variant="learn" />
        </div>
      </section>

      {useCases.length > 0 && (
        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-white">Use cases</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              How teams and students apply {mode.label} inside the{" "}
              <InternalTextLink href="/upload">document analysis workspace</InternalTextLink>.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {useCases.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4"
                >
                  <h3 className="text-sm font-medium text-zinc-200">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {modeId === "contract-analyzer" && (
        <>
          <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-white">
                Contract Summary case study — MSA first read
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                A walkthrough on a master services agreement (MSA), written with US and UK
                contract terminology. Illustrative scenario — not a legal opinion.
              </p>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
                  <span className="text-[10px] font-semibold text-violet-400/80">The input</span>
                  <h3 className="mt-2 text-sm font-medium text-zinc-200">
                    28-page MSA + statement of work
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    US-style: indemnification, limitation of liability, governing law
                    (Delaware). UK-style: indemnities, liability caps, and governing law
                    (England &amp; Wales) clauses sit in the same sections you would scan
                    manually.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
                  <span className="text-[10px] font-semibold text-violet-400/80">The pass</span>
                  <h3 className="mt-2 text-sm font-medium text-zinc-200">
                    Obligations, dates, and ambiguous clauses
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    Payment terms, notice periods, auto-renewal and termination-for-convenience
                    rights are pulled into structured sections, with vague wording flagged for
                    human review rather than silently summarized away.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
                  <span className="text-[10px] font-semibold text-violet-400/80">The output</span>
                  <h3 className="mt-2 text-sm font-medium text-zinc-200">
                    Review memo + Learn cards
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    A decision-ready brief your team can circulate, plus flashcards on the key
                    terms — useful for onboarding junior reviewers and for procurement handoffs.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-xs text-zinc-600">
                Contract Summary is informational only and does not constitute legal advice —
                always have counsel review signable agreements.
              </p>
            </div>
          </section>

          <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-xl font-semibold text-white">
                Contract Summary vs manual review
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Most teams still triage agreements by skimming. Here is what changes when the
                first pass runs in Summify.
              </p>
              <div className="mt-6">
                <ComparisonTable
                  competitorName="Manual review"
                  rows={[
                    {
                      feature: "First pass on a 28-page MSA",
                      summify: "Minutes",
                      competitor: "Hours",
                    },
                    {
                      feature: "Obligations & key dates extracted into sections",
                      summify: true,
                      competitor: "By hand",
                    },
                    {
                      feature: "Ambiguous clauses flagged for human review",
                      summify: true,
                      competitor: "Reviewer-dependent",
                    },
                    {
                      feature: "Repeatable output across a procurement batch",
                      summify: true,
                      competitor: false,
                    },
                    {
                      feature: "Learn cards for team onboarding",
                      summify: "Learn cards",
                      competitor: false,
                    },
                    {
                      feature: "Legal advice",
                      summify: false,
                      competitor: "Counsel",
                    },
                  ]}
                />
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                Compare formats too:{" "}
                <InternalTextLink href="/summarize-docx">DOCX</InternalTextLink> and{" "}
                <InternalTextLink href="/summarize-pdf">PDF</InternalTextLink> agreements run
                through the same mode.
              </p>
            </div>
          </section>
        </>
      )}

      <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-semibold text-white">Workflow</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Add source",
                body: "Upload PDF, PPTX, YouTube URL, web article, or paste text.",
              },
              {
                step: "2",
                title: `Select ${mode.label}`,
                body: "Choose this mode in the intelligence picker before you analyze.",
              },
              {
                step: "3",
                title: "Review structure",
                body: "Summary, insights, risks, and actions tuned to this lens.",
              },
              {
                step: "4",
                title: "Study & share",
                body: "Learn cards, mind maps, and optional public share when saved.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4"
              >
                <span className="text-[10px] font-semibold text-violet-400/80">
                  Step {item.step}
                </span>
                <h3 className="mt-2 text-sm font-medium text-zinc-200">{item.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{item.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-zinc-600">
            Explore format guides:{" "}
            <InternalTextLink href="/summarize-pdf">PDF</InternalTextLink>
            {" · "}
            <InternalTextLink href="/summarize-youtube-video">YouTube</InternalTextLink>
            {" · "}
            <InternalTextLink href="/summarize-powerpoint">PowerPoint</InternalTextLink>
            {" · "}
            <Link href="/pricing" className="text-violet-400/80 hover:text-violet-300">
              Pricing
            </Link>
          </p>
        </div>
      </section>

      <ModeSeoExpansion modeId={modeId} />

      {preview && (
        <section className="border-b border-white/[0.04] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-white">Example outputs</h2>
            <p className="mt-2 text-sm text-zinc-500">{mode.outputStylePreview}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {preview.sampleBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-lg border border-white/[0.06] bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400"
                >
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <h3 className="text-sm font-medium text-violet-200">Learn layer preview</h3>
              <p className="mt-1 text-xs text-zinc-500">{mode.learnEmphasis}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {preview.learnPreview.map((card) => (
                  <li
                    key={card.title}
                    className="rounded-lg border border-violet-500/15 bg-violet-950/15 px-4 py-3"
                  >
                    <span className="text-[9px] font-medium uppercase text-violet-400/80">
                      {card.type}
                    </span>
                    <p className="mt-1 text-sm text-zinc-200">{card.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={`Run ${mode.label} on your next document`}
        description="Upload a PDF, article, video, or deck — pick this mode in the workspace and get structured intelligence plus Learn cards."
        primaryLabel="Open workspace"
        secondaryHref="/modes"
        secondaryLabel="All modes"
      />
    </>
  );
}
