import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "AI Study Workflow — Upload, Analyze, Learn, Listen";
const DESCRIPTION =
  "The complete AI study workflow: upload any source, get a structured analysis, review with learn cards, and listen with audio lessons or podcast discussions.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/ai-study-workflow" }),
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/ai-study-workflow" },
  };
}

export default function AiStudyWorkflowPage() {
  return (
    <>
      <PublicHero
        badge="Study system"
        title="One Workflow. Every Study Format You Need."
        description="Most study tools give you one output and leave the rest to manual effort. Summify gives you a complete loop from input to retention so you can spend less time organizing and more time learning."
        primaryCta={{ href: "/upload", label: "Start your AI study workflow" }}
        secondaryCta={{ href: "/best-ai-for-studying", label: "See best AI for studying" }}
      />

      <SeoContentSection
        eyebrow="Why systems outperform single outputs"
        title="Summaries are useful, but they are not a full learning process"
        blocks={[
          {
            body: (
              <>
                A single summary can clarify a source, but real academic progress requires multiple passes through the same ideas in different formats. First you need comprehension, then active recall, then reinforcement, then quick checks before exams or presentations. When these steps live in different tools, students lose continuity and spend time exporting, reformatting, and rebuilding context. Summify keeps those stages connected. You upload once, generate structured analysis, review with Learn cards, listen via audio lesson or podcast, then close the loop with quiz-style recall. This is the difference between a one-time answer and a repeatable study workflow.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="UPLOAD → ANALYZE → LEARN CARDS → AUDIO LESSON → PODCAST → QUIZ"
        steps={[
          { title: "UPLOAD", description: "Bring in PDFs, notes, slides, web links, or YouTube lectures." },
          { title: "ANALYZE", description: "Extract structure, key concepts, dependencies, and priorities." },
          { title: "LEARN CARDS", description: "Turn concepts into short active-recall prompts." },
          { title: "AUDIO LESSON", description: "Generate teacher-style narration for low-screen study blocks." },
          { title: "PODCAST", description: "Use two-speaker discussions for conversational reinforcement." },
          { title: "QUIZ", description: "Pressure-test recall with fast question loops before exams." },
        ]}
      />

      <FeatureGrid
        title="Works with every format you study from"
        features={[
          { title: "PDF", description: "Textbooks, papers, and class handouts." },
          { title: "DOCX", description: "Instructor notes and collaborative study docs." },
          { title: "PowerPoint", description: "Lecture slides and training decks." },
          { title: "MP3", description: "Transcript-ready audio content and spoken material." },
          { title: "YouTube", description: "Recorded lectures and educational videos." },
          { title: "Web articles", description: "Current-events reading and topical explainers." },
        ]}
      />

      <UseCaseSection
        title="Explore by study challenge"
        cases={[
          { title: "ADHD studying", description: "Short loops and audio fallback." },
          { title: "Study while walking", description: "Use transit and movement time." },
          { title: "Lecture notes", description: "Convert rough notes into structure." },
          { title: "Research papers", description: "Decode dense academic writing." },
          { title: "Podcast generator", description: "Turn sources into two-speaker review." },
          { title: "Turn notes to podcast", description: "Rapid conversion from notes to audio." },
          { title: "Best AI for studying", description: "Compare workflow-first positioning." },
          { title: "For students", description: "Student-centered use cases and features." },
        ]}
      />

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold text-zinc-100">
            Semantic cluster: explore by study challenge
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InternalTextLink href="/adhd-study-tool">ADHD studying</InternalTextLink>
            <InternalTextLink href="/study-while-walking">Study while walking</InternalTextLink>
            <InternalTextLink href="/lecture-note-summarizer">Lecture notes</InternalTextLink>
            <InternalTextLink href="/research-paper-study-tool">Research papers</InternalTextLink>
            <InternalTextLink href="/study-podcast-generator">Podcast generator</InternalTextLink>
            <InternalTextLink href="/turn-notes-into-podcast">Turn notes to podcast</InternalTextLink>
            <InternalTextLink href="/best-ai-for-studying">Best AI for studying</InternalTextLink>
            <InternalTextLink href="/for-students">For students</InternalTextLink>
          </div>
        </div>
      </section>

      <FeatureGrid
        title="Summarizer vs study system"
        features={[
          {
            title: "Summarizer",
            description: "Paste document → get one summary → stop. Useful for quick orientation, weak for retention planning.",
          },
          {
            title: "Summify workflow",
            description: "Upload → analyze → multiple outputs → learn cards → audio → podcast → retention checks, all connected in one workspace.",
          },
        ]}
      />

      <SeoContentSection
        eyebrow="Internal navigation cluster"
        title="Build a route stack that matches your semester"
        blocks={[
          {
            body: (
              <>
                Start from challenge-specific pages and route back into one core workflow. If attention regulation is the bottleneck, begin at <InternalTextLink href="/adhd-study-tool">ADHD study tool</InternalTextLink>. If your main issue is unused commute time, open <InternalTextLink href="/study-while-walking">study while walking</InternalTextLink>. For content-specific needs, use <InternalTextLink href="/lecture-note-summarizer">lecture note summarizer</InternalTextLink> and <InternalTextLink href="/research-paper-study-tool">research paper study tool</InternalTextLink>. Audio-heavy learners can move through <InternalTextLink href="/study-podcast-generator">study podcast generator</InternalTextLink> and <InternalTextLink href="/turn-notes-into-podcast">turn notes into podcast</InternalTextLink>. The strategic advantage is not any single page; it is the continuity between them.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Start your AI study workflow"
        description="Upload once and move from comprehension to retention without rebuilding your process each time."
        primaryLabel="Open /upload"
      />
    </>
  );
}
