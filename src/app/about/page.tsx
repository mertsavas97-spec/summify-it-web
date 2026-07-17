import { pageSeo } from "@/lib/page-metadata";
import { TrustPageLayout } from "@/components/public/TrustPageLayout";

export const metadata = pageSeo.about;

export default function AboutPage() {
  return (
    <TrustPageLayout
      eyebrow="About"
      title="AI summarizer with a built-in study workspace"
      lead="Summify summarizes PDFs, PowerPoint, YouTube, and articles into structured insights — then flashcards, quizzes, and optional audio so summaries become lasting understanding."
    >
      <section>
        <h2 className="text-base font-semibold text-zinc-200">What we are building</h2>
        <p className="mt-2">
          Most summarizers flatten everything into generic bullets. Summify is an AI summarizer
          workspace: upload a PDF, deck, YouTube link, or article, choose an intelligence lens, and
          get outputs shaped for executives, students, creators, or contract review — plus a Learn
          layer for flashcards and quizzes.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">Public beta</h2>
        <p className="mt-2">
          We are in public beta. Four intelligence modes are live today; Pro Intelligence modes
          are visible as previews while we expand coverage. The workspace is free during beta —
          no accounts or checkout required.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-200">How we work</h2>
        <p className="mt-2">
          Analysis runs through production-grade AI providers with fallback, token-aware compaction,
          and deterministic Learn card generation. We focus on clarity, structure, and trust — not
          hype dashboards.
        </p>
      </section>
    </TrustPageLayout>
  );
}
