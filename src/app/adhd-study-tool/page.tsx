import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE =
  "ADHD-Friendly AI Study Tool — Break Down Lectures Into Digestible Lessons";
const DESCRIPTION =
  "Summify helps ADHD students study smarter: short audio lessons, structured learn cards, and podcast-style breakdowns that keep your focus without overwhelming you.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({
      title: TITLE,
      description: DESCRIPTION,
      path: "/adhd-study-tool",
    }),
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: "/adhd-study-tool",
    },
  };
}

export default function AdhdStudyToolPage() {
  return (
    <>
      <PublicHero
        badge="ADHD-friendly studying"
        title="The AI Study Tool Built for How ADHD Brains Actually Learn"
        description="When focus is inconsistent, study tools should reduce friction instead of adding more. Summify turns dense materials into short, structured outputs that support momentum."
        primaryCta={{ href: "/upload", label: "Start studying with ADHD-friendly AI" }}
        secondaryCta={{ href: "/ai-study-workflow", label: "See the full workflow" }}
      />

      <SeoContentSection
        eyebrow="Why this matters"
        title="Traditional study methods often punish ADHD attention patterns"
        blocks={[
          {
            body: (
              <>
                Many students with ADHD are told to "just review your notes," but that advice
                usually means rereading long pages and hoping memory improves. In practice,
                passive rereading creates fatigue faster than recall. Walls of text blur together,
                sessions run too long, and important ideas get buried. The result is not laziness;
                it is a mismatch between study format and attention style. ADHD-friendly studying
                needs short bursts, clear next steps, variation, and a way to switch modes when
                focus drops.
              </>
            ),
          },
          {
            heading: "Why traditional notes don't work for ADHD",
            body: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Large note blocks are visually overwhelming and hard to re-enter after distraction.</li>
                <li>Passive rereading feels productive but produces weak retention under exam pressure.</li>
                <li>Unstructured notes hide priorities, so students spend energy deciding what matters.</li>
                <li>Single-format workflows fail when attention shifts and no alternative review mode exists.</li>
              </ul>
            ),
          },
          {
            body: (
              <>
                Summify was built around how ADHD brains actually retain information: shorter loops,
                structured breakdowns, active recall, and audio-first fallback. If your reading focus
                drops, you can switch into listening without leaving your study context. Explore
                related paths like <InternalTextLink href="/study-while-walking">study while walking</InternalTextLink>,{" "}
                <InternalTextLink href="/learn-by-listening">learn by listening</InternalTextLink>, and{" "}
                <InternalTextLink href="/audio-study">audio study mode</InternalTextLink>.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="How Summify supports ADHD-friendly learning"
        features={[
          {
            title: "Audio-First Learning",
            description:
              "Listen to your notes instead of staring at a wall of text when visual focus is depleted.",
          },
          {
            title: "Bite-Sized Learn Cards",
            description:
              "Short, focused flashcards replace overwhelming summaries and make quick review sessions realistic.",
          },
          {
            title: "Structured Breakdowns",
            description:
              "Every document becomes organized, scannable, and digestible so restarting after distraction is easier.",
          },
          {
            title: "Podcast-Style Discussions",
            description:
              "Two-speaker explanations keep your brain engaged through conversational pacing and contrast.",
          },
        ]}
      />

      <FormatWorkflow
        title="ADHD-friendly workflow"
        steps={[
          { title: "Upload lecture notes", description: "Drop your source once in the workspace." },
          { title: "Get structured summary", description: "Receive an organized explanation with clear hierarchy." },
          { title: "Review with learn cards", description: "Practice fast active recall in short rounds." },
          { title: "Listen as audio lesson", description: "Keep studying during low-focus or mobile moments." },
        ]}
      />

      <UseCaseSection
        title="Built for real ADHD study scenarios"
        cases={[
          {
            title: "Lecture-heavy weeks",
            description: "Convert multiple classes into one repeatable daily review rhythm.",
          },
          {
            title: "Task switching days",
            description: "Move from cards to audio quickly without losing context.",
          },
          {
            title: "Evening low-energy review",
            description: "Use audio and podcast-style explanations instead of forcing extra screen time.",
          },
        ]}
      />

      <SeoContentSection
        eyebrow="Implementation guidance"
        title="How to use this page in a real weekly study plan"
        blocks={[
          {
            body: (
              <>
                A practical ADHD study plan usually works best when each session has a narrow objective and a
                visible finish line. Instead of scheduling a vague two-hour block, define micro-sessions such as
                “review ten Learn cards,” “listen to one audio lesson while walking,” or “revisit one weak concept
                and summarize it in your own words.” This prevents perfection loops where students spend most of
                their time organizing notes and very little time retrieving information. Summify supports this by
                preserving one source of truth across text and audio outputs, so you can pause, switch modalities,
                and resume without rebuilding your context.
              </>
            ),
          },
          {
            body: (
              <>
                To strengthen retention, pair this page with <InternalTextLink href="/ai-study-workflow">the full AI study workflow</InternalTextLink>
                and keep a weekly cycle: upload on lecture day, review cards midweek, run audio or podcast
                reinforcement during low-focus windows, and quiz before class discussion. Over time this reduces
                cognitive overhead because each step is predictable. Predictability is often undervalued for ADHD,
                but it is exactly what helps convert intention into consistent execution.
              </>
            ),
          },
          {
            body: (
              <>
                One practical technique is to pre-commit to modality switches before the session starts.
                For example: begin with eight minutes of Learn cards, then if attention decays, switch to
                one audio lesson while walking, then return for a two-minute written recap. This removes
                the emotional friction of deciding whether to continue or quit. The session still counts as
                focused study, even though the format changes. ADHD learners often perform better with this
                approach because effort stays directed toward understanding, not negotiating with the task.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Start studying with ADHD-friendly AI"
        description="Upload notes, keep structure, and switch between text and audio without resetting your workflow."
        primaryLabel="Open /upload"
      />
    </>
  );
}
