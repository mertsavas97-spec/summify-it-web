import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "AI Study Podcast Generator — Turn Any Source Into a Podcast Lesson";
const DESCRIPTION =
  "Turn PDFs, YouTube videos, and articles into two-speaker podcast discussions. Study by listening with Summify's AI podcast generator.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/study-podcast-generator" }),
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/study-podcast-generator" },
  };
}

export default function StudyPodcastGeneratorPage() {
  return (
    <>
      <PublicHero
        badge="Podcast study"
        title="Turn Any Study Material Into a Podcast You Actually Want to Listen To"
        description="Podcast-style learning works because conversation carries attention. Summify transforms static study content into two-speaker sessions that are easier to follow, repeat, and remember."
        primaryCta={{ href: "/upload", label: "Generate your first study podcast" }}
        secondaryCta={{ href: "/pdf-to-podcast", label: "See PDF to podcast" }}
      />

      <SeoContentSection
        eyebrow="Why this format works"
        title="Podcasts improve engagement for long or technical material"
        blocks={[
          {
            body: (
              <>
                Students frequently understand a topic during class but lose clarity when returning to raw
                notes. Podcast-style review helps by introducing pacing, contrast, and narrative structure.
                Two speakers can restate difficult concepts, challenge assumptions, and frame examples in
                language that sounds human rather than extracted. That conversational layer improves
                attention span and makes repetition less mentally costly. Summify keeps this grounded in your
                source material, so podcast sessions stay relevant to your syllabus rather than generic trivia.
              </>
            ),
          },
        ]}
      />

      <FormatWorkflow
        title="How the study podcast generator works"
        steps={[
          { title: "Upload source", description: "Add a PDF, YouTube link, article, or mixed course input." },
          { title: "AI extraction", description: "Summify identifies core concepts and supporting detail." },
          { title: "Two-speaker discussion", description: "Hosts discuss ideas naturally with educational framing." },
          { title: "Listen anywhere", description: "Review while commuting, walking, or between classes." },
        ]}
      />

      <FeatureGrid
        title="Deep Dive vs Quick Mode"
        features={[
          { title: "Deep Dive", description: "Full discussion with complete key-point coverage and rich back-and-forth reasoning." },
          { title: "Quick", description: "A focused ~5-minute podcast recap for fast pre-class or pre-exam refresh." },
        ]}
      />

      <FeatureGrid
        title="NotebookLM vs Summify"
        features={[
          { title: "Podcast generation", description: "NotebookLM: ✓  •  Summify: ✓" },
          { title: "Learn cards", description: "NotebookLM: ✗  •  Summify: ✓" },
          { title: "Audio study mode", description: "NotebookLM: ✗  •  Summify: ✓" },
          { title: "YouTube input", description: "NotebookLM: Partial  •  Summify: ✓" },
          { title: "Mobile app", description: "NotebookLM: ✗  •  Summify: ✓" },
        ]}
      />

      <UseCaseSection
        title="What you can turn into a podcast"
        cases={[
          { title: "Lecture PDFs", description: "Convert class documents into daily audio revision." },
          { title: "Research papers", description: "Hear argument, method, and findings in conversational format." },
          { title: "YouTube lectures", description: "From transcript to discussable study session." },
          { title: "Textbook chapters", description: "Reduce heavy reading blocks into replayable lessons." },
          { title: "Case studies", description: "Compare context, decision points, and outcomes quickly." },
          { title: "News articles", description: "Analyze current events with structured educational framing." },
        ]}
      />

      <SeoContentSection
        eyebrow="Study cluster links"
        title="Pair podcast sessions with active recall"
        blocks={[
          {
            body: (
              <>
                Podcast learning performs best when you combine listening with short retrieval drills. Start with
                a generated podcast, then follow with Learn cards and a brief quiz loop. For source-specific
                conversion, visit <InternalTextLink href="/turn-notes-into-podcast">turn notes into podcast</InternalTextLink>.
                For format-first flows, use <InternalTextLink href="/pdf-to-podcast">PDF to podcast</InternalTextLink>.
                If you want teacher-style voice lessons in addition to two-speaker discussions, open
                <InternalTextLink href="/audio-study">audio study mode</InternalTextLink>.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Generate your first study podcast"
        description="Upload any source and turn passive listening time into structured academic reinforcement."
        primaryLabel="Start from /upload"
      />
    </>
  );
}

