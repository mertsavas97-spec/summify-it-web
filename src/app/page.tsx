import { pageSeo } from "@/lib/page-metadata";
import { howToSummifySchema, softwareApplicationSchema } from "@/lib/schema";
import { SUMMIFY_HOW_TO_STEPS } from "@/data/seo-howto";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { PublicHero } from "@/components/public/PublicHero";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { HomeTrustBar } from "@/components/public/HomeTrustBar";
import { HOME_FAQS, RELATED_LINKS } from "@/data/landing-seo";
import { HomePricingPreview } from "@/components/public/HomePricingPreview";
import { SummarizeFormatGrid } from "@/components/public/SummarizeFormatGrid";
import Link from "next/link";

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

      <PublicHero
        badge="Public beta · Free AI summarizer"
        title={
          <>
            Free AI summarizer for{" "}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
              PDFs, decks & videos
            </span>
            .
          </>
        }
        description="Upload a PDF, PowerPoint, YouTube link, or article — get a structured AI summary and key insights in seconds. Optional flashcards and quiz when you want to study further."
        primaryCta={{ href: "/upload", label: "Summarize for free" }}
        secondaryCta={{ href: "#how-it-works", label: "See how it works" }}
        variant="home"
      >
        <ProductMockCard variant="home" />
      </PublicHero>

      <HomeTrustBar />

      <SummarizeFormatGrid />

      <section className="border-b border-slate-200/70 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:border-white/[0.04]">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              After the summary, keep going
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
              Most summarizers stop at text. Summify can continue into flashcards, a quiz, and
              optional audio — so the summary becomes something you can actually retain.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Flashcards",
                body: "Turn key insights into Learn cards you can review one by one.",
              },
              {
                title: "Quiz",
                body: "Check recall with an auto-generated quiz from the same source.",
              },
              {
                title: "Optional audio",
                body: "Listen to a teacher-style lesson when you want hands-free review.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/[0.06] dark:bg-zinc-950/40"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-slate-500 dark:text-zinc-500">
            Prefer a dedicated format page?{" "}
            <Link
              href="/for-students"
              className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
            >
              For students
            </Link>
            {" · "}
            <Link
              href="/audio-study"
              className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
            >
              Audio study
            </Link>
          </p>
        </div>
      </section>

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
            description: "Structured overview and key insights, tuned by intelligence mode.",
          },
          {
            title: "Study if you want",
            description: "Open flashcards and quiz — or generate optional audio later.",
          },
        ]}
      />

      <HomePricingPreview />

      <FAQSection
        title="Common questions about Summify"
        subtitle="Quick answers before your first AI summary."
        items={HOME_FAQS}
      />

      <CTASection
        title="Ready to summarize?"
        description="Try Summify free — structured AI summaries for PDFs, decks, videos, and articles. Flashcards and quiz when you need them."
        primaryLabel="Summarize for free"
        secondaryHref="#how-it-works"
        secondaryLabel="See how it works"
      />

      <RelatedLinksSection title="Explore by format and workflow" links={RELATED_LINKS.home} />
    </>
  );
}
