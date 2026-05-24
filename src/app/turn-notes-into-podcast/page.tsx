import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "Turn Your Notes Into a Podcast — AI Study Podcast From Any Document";
const DESCRIPTION =
  "Upload lecture notes, research papers, or any PDF. Summify turns them into a natural two-speaker podcast discussion in minutes.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/turn-notes-into-podcast" }),
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/turn-notes-into-podcast" },
  };
}

export default function TurnNotesIntoPodcastPage() {
  return (
    <>
      <PublicHero
        badge="Social study workflow"
        title="Your Notes, Your Podcast, Your Study Session"
        description="POV: your 80-page lecture PDF becomes a podcast you listen to on your morning walk. Summify turns dense files into a natural two-speaker discussion you can replay anytime."
        primaryCta={{ href: "/upload", label: "Turn your notes into a podcast now" }}
        secondaryCta={{ href: "/study-podcast-generator", label: "See podcast generator" }}
      />

      <FormatWorkflow
        title="Step-by-step podcast workflow"
        steps={[
          { title: "Step 1: Upload your notes", description: "Use PDF, DOCX, TXT, class slides, or a YouTube URL." },
          { title: "Step 2: AI analysis", description: "Summify extracts structure and key ideas in seconds." },
          { title: "Step 3: Two-speaker discussion", description: "AI hosts discuss the material naturally and clearly." },
          { title: "Step 4: Listen anywhere", description: "Use commute, walking, or workout blocks for revision." },
        ]}
      />

      <FeatureGrid
        title="From these formats"
        features={[
          { title: "Lecture notes", description: "Class summaries with clearer concept flow." },
          { title: "Research papers", description: "Thesis, methods, and findings in conversational form." },
          { title: "Textbook chapters", description: "Dense chapter reading turned into listenable segments." },
          { title: "YouTube videos", description: "Lecture transcripts converted into structured dialogue." },
          { title: "Web articles", description: "Current-events or topic briefs ready for audio review." },
          { title: "Class slides", description: "PPTX content reframed with context and explanation." },
        ]}
      />

      <SeoContentSection
        eyebrow="Why this helps"
        title="Podcast format improves study continuity"
        blocks={[
          {
            body: (
              <>
                Conversational audio supports retention because it introduces rhythm, contrast, and restatement.
                A single block summary can be accurate but mentally flat; a dialogue can revisit the same concept
                through different angles without feeling repetitive. Podcast review also removes the requirement for
                constant screen access, making it easier to keep a daily habit during transitions. Students use this
                to reinforce difficult units between deep study sessions, then return to cards and quizzes for active
                recall. If your goal is moving through high-volume sources quickly, podcast conversion is often the
                difference between abandoning material and actually revisiting it.
              </>
            ),
          },
          {
            heading: "Student examples",
            body: (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">“I stopped skipping review days because I can listen on my commute and still keep up before tutorials.” — Year 2 Biology student</p>
                <p className="text-sm text-zinc-300">“Turning legal readings into podcast recaps made issue spotting much faster for seminar prep.” — Law student</p>
                <p className="text-sm text-zinc-300">“I use chapter podcasts during workouts, then do short recall cards at night. Retention is noticeably better.” — Medical student</p>
              </div>
            ),
          },
          {
            body: (
              <>
                Build this with adjacent routes: compare options on <InternalTextLink href="/study-podcast-generator">study podcast generator</InternalTextLink>,
                transform academic readings through <InternalTextLink href="/pdf-to-podcast">PDF to podcast</InternalTextLink>,
                and combine mobile review sessions with <InternalTextLink href="/study-while-walking">study while walking</InternalTextLink>.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Turn your notes into a podcast now"
        description="Upload once, generate instantly, and keep your study loop active during time that used to be lost."
        primaryLabel="Open /upload"
      />
    </>
  );
}

