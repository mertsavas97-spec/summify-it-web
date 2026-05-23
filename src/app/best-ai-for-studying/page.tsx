import { JsonLd } from "@/components/seo/JsonLd";
import { CTASection } from "@/components/public/CTASection";
import { FAQSection } from "@/components/public/FAQSection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { PublicHero } from "@/components/public/PublicHero";
import { RelatedLinksSection } from "@/components/public/RelatedLinksSection";
import { SeoBreadcrumbs } from "@/components/public/SeoBreadcrumbs";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { pageSeo } from "@/lib/page-metadata";
import { seoLandingPageJsonLd } from "@/lib/schema";

export const metadata = pageSeo.bestAiForStudying;

const FAQS = [
  { q: "Who is this built for?", a: "Students, self-learners, and creators who need structure, not random chat outputs." },
  { q: "Can this support ADHD-friendly study flow?", a: "Yes. You can split long sources into manageable outputs and switch to audio-first review when focus drops." },
  { q: "What makes it different from generic assistants?", a: "Summify is workflow-oriented: extraction, structured analysis, recall cards, and optional audio lessons in one loop." },
];

export default function BestAiForStudyingPage() {
  return (
    <>
      <JsonLd
        data={seoLandingPageJsonLd({
          path: "/best-ai-for-studying",
          pageTitle: "Best AI for Studying",
          description:
            "A focused AI study workspace for active recall, ADHD-friendly workflows, and learn-while-walking audio lessons.",
          faqs: FAQS,
        })}
      />
      <SeoBreadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Best AI for Studying", href: "/best-ai-for-studying" },
        ]}
      />
      <PublicHero
        badge="AI study workspace"
        title="The best AI for studying is a system, not a chatbot"
        description="Build a repeatable learning loop: summarize, structure, practice, and listen. Summify is designed for sustained focus and revision rhythm."
        primaryCta={{ href: "/upload", label: "Start your study workspace" }}
        secondaryCta={{ href: "/ai-note-tool", label: "Explore AI note workflow" }}
      />
      <SeoContentSection
        eyebrow="Study systems over single prompts"
        title="Why students use Summify"
        blocks={[
          { body: "Instead of asking a model from scratch every time, students can keep context in a workspace and return to the same material through summaries, cards, and audio sessions." },
          { heading: "Emotional productivity", body: "When studying feels heavy, switching from text to listening can preserve momentum. Summify supports that shift without breaking the learning thread." },
        ]}
      />
      <FormatWorkflow
        title="ADHD-friendly workflow example"
        steps={[
          { title: "Capture source", description: "Upload PDF notes or paste a lecture URL." },
          { title: "Extract structure", description: "Generate concise, organized understanding." },
          { title: "Active recall", description: "Review Learn cards with short sessions." },
          { title: "Walk-and-listen", description: "Use audio outputs while commuting or walking." },
        ]}
      />
      <FeatureGrid
        title="Lightweight comparison"
        features={[
          { title: "Generic AI chat", description: "Good for quick questions, weak for long-term study continuity." },
          { title: "Summify study workspace", description: "Built for revision loops, structured notes, and audio-first studying." },
          { title: "Outcome", description: "Lower cognitive overhead and clearer study flow." },
        ]}
      />
      <FeatureGrid
        title="Study workflow examples"
        features={[
          { title: "Exam prep week", description: "One source per day → summary + cards + evening audio recap." },
          { title: "Lecture consolidation", description: "YouTube lecture + handout PDF merged into one revision structure." },
          { title: "Concept reinforcement", description: "Revisit weak concepts through shorter audio lessons." },
        ]}
      />
      <FAQSection items={FAQS} />
      <RelatedLinksSection
        links={[
          { href: "/pdf-summarizer", label: "PDF summarizer", description: "Process long readings with structure." },
          { href: "/pdf-to-podcast", label: "PDF to podcast", description: "Convert reading into listening sessions." },
          { href: "/youtube-video-summarizer", label: "YouTube summarizer", description: "Capture educational video insights." },
        ]}
      />
      <CTASection title="Build your study system in one workspace" description="From deep reading to audio review, keep one calm workflow." primaryLabel="Open Summify" />
    </>
  );
}

