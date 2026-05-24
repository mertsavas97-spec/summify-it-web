import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "Study While Walking — Turn Lecture Notes Into Audio Lessons With AI";
const DESCRIPTION =
  "Upload your PDFs or lecture notes and get a teacher-style audio lesson you can listen to on your walk, commute, or workout.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/study-while-walking" }),
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/study-while-walking" },
  };
}

export default function StudyWhileWalkingPage() {
  return (
    <>
      <PublicHero
        badge="Audio-first study"
        title="Turn Your Dead Time Into Study Time"
        description="Most students already have daily minutes that disappear in transit or routine movement. Summify converts those minutes into focused audio revision sessions grounded in your own class materials."
        primaryCta={{ href: "/upload", label: "Turn your notes into an audio lesson" }}
        secondaryCta={{ href: "/audio-study", label: "Explore Audio Study" }}
      />

      <SeoContentSection
        eyebrow="Why walking study works"
        title="Your schedule already has hidden study blocks"
        blocks={[
          {
            body: (
              <>
                Many learners think they need an extra two-hour block to make progress, but in reality
                they often have 2–4 hours per day spread across commuting, walking between classes,
                gym warm-ups, errands, and transitions. That time usually becomes low-value scrolling,
                not because students are unmotivated, but because study materials are trapped in
                screen-heavy formats. Summify helps you reformat those materials into structured
                lessons that can be heard anywhere.
              </>
            ),
          },
          {
            heading: "The science behind audio learning",
            body: (
              <>
                Audio learning aligns with dual-coding theory by pairing conceptual language with a
                second delivery channel, which improves retrieval cues later. Physical movement can
                also lower restlessness and support sustained attention for many students, especially
                when the cognitive load of reading is too high. Passive moments are not a replacement
                for active recall, but they become powerful reinforcement when used between focused
                sessions. For ADHD-focused approaches, see <InternalTextLink href="/adhd-study-tool">ADHD study workflows</InternalTextLink> and <InternalTextLink href="/learn-by-listening">learn-by-listening strategies</InternalTextLink>.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="How it works in 3 steps"
        steps={[
          { title: "Upload your source", description: "Add lecture notes, a PDF, or a YouTube lecture link." },
          { title: "Generate the lesson", description: "Summify analyzes structure and creates an audio-first explanation." },
          { title: "Listen while moving", description: "Use walk, commute, or workout time for consistent review." },
        ]}
      />

      <UseCaseSection
        title="What students are turning into audio lessons"
        cases={[
          { title: "Biology lecture notes", description: "Processes, pathways, and vocab in clear sequence." },
          { title: "Law case summaries", description: "Facts, holdings, and rule application in spoken format." },
          { title: "Economics chapters", description: "Models and assumptions explained with practical framing." },
          { title: "History research papers", description: "Events, causality, and significance for exam recall." },
          { title: "YouTube lecture recordings", description: "Transcript to structured recap without note chaos." },
          { title: "Medical study guides", description: "Symptoms, mechanisms, and treatment logic on repeat." },
        ]}
      />

      <FeatureGrid
        title="Time calculator"
        features={[
          {
            title: "30 minutes/day",
            description: "~182.5 hours of review time per year when consistently converted into audio study.",
          },
          {
            title: "45 minutes/day",
            description: "~273.75 hours of reinforcement from moments that previously produced no retention.",
          },
          {
            title: "60 minutes/day",
            description: "~365 hours, equivalent to multiple full-semester review cycles without extra desk time.",
          },
        ]}
      />

      <SeoContentSection
        eyebrow="Execution strategy"
        title="How to make walking study sessions actually useful"
        blocks={[
          {
            body: (
              <>
                Audio study is most effective when each session has a narrow learning target. Before you start
                walking, pick one theme: maybe glycolysis steps, a legal test framework, or a chapter’s central
                model. After listening, do a quick retrieval check from memory: list three points you remember,
                then confirm against your notes later. This turns passive listening into active encoding rather
                than background noise. Students who repeat this pattern across the week usually see better recall
                in tutorials because ideas have been revisited in multiple contexts.
              </>
            ),
          },
          {
            body: (
              <>
                You can also stack session types: podcast-style overview on Monday, shorter teacher-style recap
                on Wednesday, then quiz-ready recall before Friday class. That sequence balances comprehension
                and retrieval with minimal setup overhead. If your coursework includes heavy PDFs, combine this
                route with <InternalTextLink href="/study-podcast-generator">study podcast generation</InternalTextLink> and
                <InternalTextLink href="/learn-by-listening">learn-by-listening workflows</InternalTextLink> so movement time
                becomes a reliable extension of your desk study, not a separate disconnected habit.
              </>
            ),
          },
        ]}
      />

      <SeoContentSection
        eyebrow="Build the cluster"
        title="Pair walking review with structured outputs"
        blocks={[
          {
            body: (
              <>
                Walking-based study performs best when audio follows a structured source analysis. That means
                generating core concepts first, then listening for reinforcement, then returning to short
                recall drills. This is why many students combine this page with the <InternalTextLink href="/study-podcast-generator">study podcast generator</InternalTextLink> for conversational review and <InternalTextLink href="/audio-study">audio study mode</InternalTextLink> for teacher-style lessons.
              </>
            ),
          },
          {
            body: (
              <>
                Another high-impact pattern is to align walking sessions with course rhythm rather than random playback.
                For example, if your Wednesday seminar covers one framework, listen to that framework during Tuesday
                commute blocks. Then on Thursday, replay only the sections you missed during class discussion. This
                creates a feedback loop where audio review is not generic motivation content; it is targeted rehearsal
                for actual assessment contexts. Over several weeks, students report lower pre-exam anxiety because they
                have already encountered core ideas repeatedly in real-life settings, not only during late-night cram sessions.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Turn your notes into an audio lesson"
        description="Convert existing PDFs, note files, and lecture links into daily walk-ready revision sessions."
        primaryLabel="Start from /upload"
      />
    </>
  );
}
