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
          pageTitle: "Best AI for Studying in 2026 — Turn Notes, PDFs & Videos into Study Systems",
          description:
            "Summify turns your lecture notes, PDFs, and YouTube videos into structured study workflows: learn cards, audio lessons, and podcast-style discussions. Built for students.",
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
        title="Turn Any Study Material Into a Complete Learning System"
        description="Upload lecture notes, research papers, or YouTube lectures. Get AI-generated learn cards, audio lessons you can walk with, and podcast-style breakdowns."
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
        title="Upload → Analyze → Learn Cards → Audio Lesson → Podcast"
        steps={[
          { title: "Upload", description: "Add lecture notes, research papers, or YouTube lectures." },
          { title: "Analyze", description: "Generate structured understanding from complex source material." },
          { title: "Learn Cards", description: "Practice active recall with AI-generated learn cards." },
          { title: "Audio Lesson", description: "Turn key ideas into teacher-style lessons for walk-and-study sessions." },
          { title: "Podcast", description: "Reinforce memory with podcast-style discussions anywhere." },
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
        title="Student use cases"
        features={[
          { title: "Medical students", description: "Convert dense lecture packs into repeatable revision loops." },
          { title: "Law students", description: "Break long case readings into structured concepts and recall cards." },
          { title: "ADHD studying", description: "Switch between text, cards, and audio to keep momentum." },
          { title: "Finals week", description: "Compress multiple sources into one daily study workflow." },
          { title: "Commuting study", description: "Use travel time for audio lessons and podcast-style recaps." },
          { title: "Research papers", description: "Translate technical papers into learn cards and clear audio explanations." },
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
