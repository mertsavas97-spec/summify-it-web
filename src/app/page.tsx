import { pageSeo } from "@/lib/page-metadata";
import { howToSummifySchema, softwareApplicationSchema } from "@/lib/schema";
import { SUMMIFY_HOW_TO_STEPS } from "@/data/seo-howto";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { PublicHero } from "@/components/public/PublicHero";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { ProductMockCard } from "@/components/public/ProductMockCard";
import { HomeTrustBar } from "@/components/public/HomeTrustBar";
import { VoiceStudyPromo } from "@/components/marketing/VoiceStudyPromo";
import { HOME_FAQS, RELATED_LINKS } from "@/data/landing-seo";
import { HomePricingPreview } from "@/components/public/HomePricingPreview";
import Link from "next/link";

export const metadata = pageSeo.home;

const formats = [
  { href: "/summarize-pdf", label: "PDF", desc: "PDF to audio lessons" },
  { href: "/summarize-youtube-video", label: "YouTube", desc: "Video to study workflow" },
  { href: "/summarize-powerpoint", label: "PowerPoint", desc: "Deck to study materials" },
  { href: "/upload", label: "Web & text", desc: "Personal learning workspace" },
];

/* Hero headline alternatives (comment-only, do not auto-replace):
   1) Turn any source into an audio lesson that helps you learn and remember.
   2) Transform PDFs, videos, and articles into audio-first study sessions.
   3) Learn faster from any source with teacher-style audio lessons and recall loops.
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

      {/* 1. Hero Section */}
      <PublicHero
        badge="Public beta · Audio-first study"
        title={
          <>
            Turn any PDF, video, or article into your{" "}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
              private study podcast
            </span>
            .
          </>
        }
        description={
          <>
            <span className="block text-base font-medium text-zinc-200">
              Turn PDFs, videos, and articles into private study podcasts.
            </span>
            <span className="mt-3 block">
              Summify creates teacher-style audio lessons, smart study cards, quizzes, and mind maps
              from your source — helping you summarize, listen, learn, and remember without a screen.
            </span>
          </>
        }
        primaryCta={{ href: "/upload", label: "Start Learning Free" }}
        secondaryCta={{ href: "#how-it-works", label: "See how it works" }}
        variant="home"
      >
        <ProductMockCard variant="home" />
      </PublicHero>

      {/* 2. Trust Bar (Moved directly below hero) */}
      <HomeTrustBar />

      {/* 3. Audio Spotlight Section */}
      <section className="border-b border-slate-200/70 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 dark:border-white/[0.04]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Audio lessons that go where you go
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-500">
              Listen while walking, commuting, or exercising. Turn spare moments into focused
              learning.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.4fr]">
            <VoiceStudyPromo unlocked className="!py-8 !px-6" />
            <div className="flex flex-col justify-center gap-4">
              {[
                { label: "Teacher-style explanations", icon: "✦" },
                { label: "Built for focus", icon: "🎯" },
                { label: "Anywhere learning", icon: "🌍" },
                { label: "Remember more", icon: "🧠" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-violet-300/60 bg-violet-100 text-[10px] text-violet-700 dark:border-violet-500/20 dark:bg-violet-950/30 dark:text-violet-200">
                    {b.icon}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-zinc-300">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Supported Sources (Minor strip) */}
      <section className="border-b border-slate-200/70 px-4 py-4 sm:px-6 lg:px-8 dark:border-white/[0.04]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
              Supported sources
            </p>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-[11px] text-slate-600 transition-colors hover:border-violet-400/50 hover:text-slate-900 dark:border-white/[0.06] dark:bg-zinc-950/40 dark:text-zinc-400 dark:hover:border-violet-500/25 dark:hover:text-zinc-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-violet-500/70 dark:bg-white/20 dark:group-hover:bg-violet-400/60" />
                  <span className="font-medium text-slate-800 dark:text-zinc-200/90">{f.label}</span>
                  <span className="hidden text-slate-500 dark:text-zinc-500 sm:inline">· {f.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Learning Loop Section (FeatureGrid) */}
      <FeatureGrid
        variant="loop"
        eyebrow="The Workflow"
        title="A learning workflow, not just a summary tool"
        subtitle="Upload once, then move through summary, audio lesson, study cards, quiz, and memory-friendly review."
        features={[
          {
            title: "1. Understand",
            description: "Extract key ideas and core concepts from your source.",
            icon: "≋",
            accent: "violet",
          },
          {
            title: "2. Learn",
            description: "Deep dive with concept + why-it-matters cards.",
            icon: "▦",
            accent: "cyan",
          },
          {
            title: "3. Test",
            description: "Check your knowledge with auto-generated quizzes.",
            icon: "?",
            accent: "amber",
          },
          {
            title: "4. Listen",
            description: "Play teacher-style audio lessons on the go.",
            icon: "▶",
            accent: "emerald",
          },
          {
            title: "5. Remember",
            description: "Master topics with memory-friendly review habit.",
            icon: "⟡",
            accent: "fuchsia",
          },
        ]}
      />

      {/* 6. ICP / Use Case Cards */}
      <UseCaseSection
        title="Built for how you learn"
        subtitle="Choose a workflow designed for the way you learn."
        cases={[
          {
            title: "For ADHD Students",
            description: "Reduce overwhelm. Turn dense text into clear audio and bite-sized cards.",
          },
          {
            title: "For Researchers",
            description: "Digest papers while you move. Capture insights without the screen.",
          },
          {
            title: "For Med & Law",
            description: "Master complex topics with teacher-style audio and structured review.",
          },
          {
            title: "For Creators",
            description: "Turn videos and articles into audio explainers, summary notes, and reusable study cards.",
          },
          {
            title: "For Professionals",
            description: "Save hours of reading. Get audio briefings plus quiz-ready recall prompts.",
          },
        ]}
      />

      {/* 7. How It Works */}
      <FormatWorkflow
        id="how-it-works"
        title="From reading to memory in 5 steps"
        steps={[
          {
            title: "Upload or paste",
            description: "Add a PDF, YouTube URL, web article, or text.",
          },
          {
            title: "Get your summary",
            description: "Summify extracts key ideas and core concepts from your source.",
          },
          {
            title: "Listen to your lesson",
            description: "Play a teacher-style audio lesson while walking, commuting, or exercising.",
          },
          {
            title: "Review study cards",
            description: "Use smart study cards to lock in definitions, concepts, and explanations.",
          },
          {
            title: "Quiz and remember",
            description: "Test recall with quizzes and return later with memory-friendly review.",
          },
        ]}
      />

      {/* 8. Proof Strip */}
      <section className="border-b border-slate-200/70 px-4 py-8 sm:px-6 lg:px-8 dark:border-white/[0.04]">
        <div className="mx-auto max-w-6xl">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-500">
            <li>Built for students & researchers</li>
            <li>Teacher-style audio lessons</li>
            <li>Private by design</li>
            <li>Try your first lesson free</li>
          </ul>
        </div>
      </section>

      {/* 9. Pricing Preview */}
      <HomePricingPreview />

      {/* 10. FAQ Section */}
      <FAQSection
        title="Common questions about Summify"
        subtitle="Quick answers before you start your first lesson."
        items={HOME_FAQS}
      />

      {/* 11. Final CTA */}
      <CTASection
        title="Ready to turn your reading into real learning?"
        description="Summify is not just summaries — it is a complete learning workflow with audio lessons, study cards, quizzes, and memory-friendly review."
        primaryLabel="Start Learning Free"
        secondaryHref="#how-it-works"
        secondaryLabel="See how it works"
      />

      <RelatedLinksSection title="Explore by format and workflow" links={RELATED_LINKS.home} />
    </>
  );
}
