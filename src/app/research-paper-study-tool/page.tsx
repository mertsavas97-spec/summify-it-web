import type { Metadata } from "next";
import { CTASection } from "@/components/public/CTASection";
import { FeatureGrid } from "@/components/public/FeatureGrid";
import { FormatWorkflow } from "@/components/public/FormatWorkflow";
import { InternalTextLink } from "@/components/public/InternalTextLink";
import { PublicHero } from "@/components/public/PublicHero";
import { SeoContentSection } from "@/components/public/SeoContentSection";
import { UseCaseSection } from "@/components/public/UseCaseSection";
import { createPageMetadata } from "@/lib/metadata";

const TITLE = "AI Research Paper Study Tool — Summarize, Learn, and Listen";
const DESCRIPTION =
  "Upload any research paper or academic PDF. Get a structured summary, flashcard-style learn cards, and a podcast discussion of the key findings.";

export function generateMetadata(): Metadata {
  return {
    ...createPageMetadata({ title: TITLE, description: DESCRIPTION, path: "/research-paper-study-tool" }),
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: "/research-paper-study-tool",
    },
  };
}

export default function ResearchPaperStudyToolPage() {
  return (
    <>
      <PublicHero
        badge="Academic workflows"
        title="Research Papers Are Hard. Your Study Tool Shouldn't Be."
        description="Dense methodology, compressed jargon, and layered citations are normal in academic reading. Summify helps you convert paper complexity into a repeatable study system without skipping rigor."
        primaryCta={{ href: "/upload", label: "Upload your research paper" }}
        secondaryCta={{ href: "/for-researchers", label: "Explore researcher workflows" }}
      />

      <SeoContentSection
        eyebrow="Academic friction"
        title="The density problem in research papers"
        blocks={[
          {
            body: (
              <>
                Most research papers are not written for speed of comprehension. You parse the abstract,
                switch to methodology, jump to results, then return to definitions and references just to
                confirm one claim. For students and researchers under deadlines, this context switching is
                expensive. The challenge is not only understanding each section in isolation, but preserving
                the logical thread across thesis, method, evidence, and implications. Summify is designed for
                that bridge: a structured, source-grounded analysis you can review as text, cards, and audio.
              </>
            ),
          },
        ]}
      />

      <FeatureGrid
        title="What Summify extracts from research papers"
        features={[
          { title: "Main thesis", description: "The central claim and argument scope in plain language." },
          { title: "Methodology", description: "Research design, dataset, and analytical approach." },
          { title: "Key findings", description: "Primary outcomes and what changed because of the evidence." },
          { title: "Statistical data", description: "Notable metrics, effect sizes, and significance cues." },
          { title: "Limitations", description: "Known constraints, assumptions, and uncertainty boundaries." },
          { title: "Implications", description: "What the findings mean for practice, policy, or further study." },
        ]}
      />

      <UseCaseSection
        title="Who uses this workflow"
        cases={[
          { title: "PhD students", description: "Faster literature review cycles with structured extraction." },
          { title: "Undergraduates", description: "Clearer source understanding before writing term papers." },
          { title: "Medical students", description: "Clinical study interpretation in exam-ready formats." },
          { title: "Law students", description: "Legal scholarship breakdowns with argument structure preserved." },
          { title: "Business students", description: "Case-study and research synthesis for strategic writing." },
        ]}
      />

      <FormatWorkflow
        title="From 40 pages to study-ready in ~60 seconds"
        steps={[
          { title: "Upload PDF", description: "Add a paper, preprint, or academic reading packet." },
          { title: "Structured analysis", description: "Extract thesis, methods, findings, and limitations." },
          { title: "Learn cards", description: "Generate quick active-recall prompts for retention." },
          { title: "Audio or podcast", description: "Listen to key ideas during commute or walk sessions." },
        ]}
      />

      <SeoContentSection
        eyebrow="Integrity first"
        title="Accelerate understanding, not shortcuts"
        blocks={[
          {
            body: (
              <>
                Summify helps you understand papers faster — it does not write papers for you. Academic
                integrity still requires citation discipline, argument ownership, and independent reasoning.
                The tool is best used for comprehension and review: clarify concepts, surface evidence,
                identify weak spots, and then return to the source text for deeper annotation. Many learners
                pair this route with <InternalTextLink href="/lecture-note-summarizer">lecture-note summarization</InternalTextLink> and the broader <InternalTextLink href="/ai-study-workflow">AI study workflow</InternalTextLink> so coursework and literature review stay in one system.
              </>
            ),
          },
          {
            body: (
              <>
                Strong research habits still depend on direct reading, annotation, and source verification. The
                value of this tool is that it shortens orientation time so your deep-reading sessions focus on
                interpretation instead of navigation. Many students use a two-pass method: first pass in Summify to
                map thesis and method; second pass in the PDF to challenge assumptions, inspect tables, and review
                cited evidence. This approach improves confidence during seminars because you are not memorizing
                isolated facts; you are tracking the logic of the paper. Over multiple modules, that consistency
                compounds into faster literature synthesis and clearer argument building in your own academic work.
              </>
            ),
          },
        ]}
      />

      <CTASection
        title="Upload your research paper"
        description="Turn dense academic reading into structured analysis, recall practice, and listenable review."
        primaryLabel="Start in /upload"
      />
    </>
  );
}
