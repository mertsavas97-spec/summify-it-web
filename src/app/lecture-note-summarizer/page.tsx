import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "AI Lecture Note Summarizer — Structured Study Summaries in Seconds";
const DESCRIPTION =
  "Paste or upload your lecture notes. Summify extracts key concepts, generates learn cards, and creates an audio lesson you can review anywhere.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/lecture-note-summarizer" }),
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/lecture-note-summarizer" },
  };
}

export default function LectureNoteSummarizerPage() {
  return (
    <>
      <PublicHero
        badge="Lecture note summarizer"
        title="From Messy Lecture Notes to Structured Study System"
        description="Capturing notes in class is only step one. Summify closes the learning gap by turning rough lecture text into a complete revision workflow with recall and audio reinforcement."
        primaryCta={{ href: "/upload", label: "Summarize your lecture notes" }}
        secondaryCta={{ href: "/ai-study-workflow", label: "See the full study workflow" }}
      />

      <SeoContentSection
        eyebrow="The real bottleneck"
        title="Most students collect notes but never convert them into a study process"
        blocks={[
          {
            body: (
              <>
                Lecture notes are often incomplete, inconsistent, and rushed. Some lines are detailed,
                others are fragments, and important explanations may be split across slides, spoken
                examples, and side comments. That makes review expensive: students first decode their own
                notes, then figure out what matters, then design recall practice manually. Traditional
                summarizers reduce text length, but they rarely create a system you can reuse across a
                semester. Summify is designed to solve that second problem: not just "what does this say," but
                "how do I learn this efficiently over time?"
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="Subject examples"
        features={[
          { title: "Biology", description: "Extract mechanisms, processes, and key terms." },
          { title: "Law", description: "Identify case holdings, rules, and exceptions." },
          { title: "Economics", description: "Clarify models, theories, and data points." },
          { title: "History", description: "Organize events, causes, and consequences." },
          { title: "Medicine", description: "Structure symptoms, diagnoses, and treatments." },
          { title: "Computer Science", description: "Break down algorithms and system concepts." },
        ]}
      />

      <FormatWorkflow
        title="Lecture-note workflow"
        steps={[
          { title: "Upload notes", description: "Add lecture text, PDF exports, or mixed class material." },
          { title: "Extract key concepts", description: "Summify detects structure, themes, and priority ideas." },
          { title: "Generate learn cards", description: "Create short active-recall prompts for repeat sessions." },
          { title: "Create audio lesson", description: "Turn difficult sections into listenable explanations." },
          { title: "Quiz yourself", description: "Use fast review loops before class or exam blocks." },
        ]}
      />

      <FeatureGrid
        title="What makes Summify different from a basic summarizer"
        features={[
          {
            title: "Basic summarizer",
            description: "Paste notes, get one paragraph summary, then manually build the rest of your revision workflow.",
          },
          {
            title: "Summify study system",
            description: "Summary + learn cards + audio lesson + podcast discussion + quiz-ready outputs in one workspace.",
          },
        ]}
      />

      <SeoContentSection
        eyebrow="Build continuity"
        title="Use one system across the entire term"
        blocks={[
          {
            body: (
              <>
                Consistency matters more than intensity in long semesters. Students who keep one workflow
                from lecture capture through review usually retain more with less stress because each step
                feeds the next. Many pair this route with <InternalTextLink href="/research-paper-study-tool">research paper study workflows</InternalTextLink> for reading-heavy modules, then compare approaches on <InternalTextLink href="/best-ai-for-studying">best AI for studying</InternalTextLink>. If you want a complete pipeline view, start with <InternalTextLink href="/ai-study-workflow">the AI study workflow</InternalTextLink>.
              </>
            ),
          },
          {
            body: (
              <>
                Another advantage of structured lecture-note workflows is reduced pre-study friction. On hard days,
                students often lose momentum before real learning starts because they cannot decide where to begin.
                A consistent pipeline solves that decision tax: open yesterday’s source, review today’s cards,
                listen to one recap, then run a short quiz loop. Over a semester, those small repeated cycles
                outperform occasional marathon sessions because they keep concepts active in memory and expose
                weak areas earlier. This is especially valuable in cumulative courses where week three topics reappear
                in week nine assessments. Instead of rebuilding your system each time, Summify lets you re-enter
                quickly with familiar outputs and predictable next actions.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Summarize your lecture notes"
        description="Upload class material once and generate structured outputs you can actually review and remember."
        primaryLabel="Go to /upload"
      />
    </>
  );
}
