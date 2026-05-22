import { InternalTextLink } from "@/components/public/InternalTextLink";
import type { FaqItem } from "@/data/faqs";
import type { RelatedLinkItem } from "@/components/public/RelatedLinksSection";
import type { FormatLandingConfig } from "@/data/format-landings/types";

export const AUDIO_STUDY_RELATED: RelatedLinkItem[] = [
  { href: "/upload", label: "Open workspace", description: "Generate audio lessons from analyses." },
  { href: "/summarize-pdf", label: "PDF summarizer", description: "Turn papers into study workflows." },
  { href: "/for-students", label: "AI study notes", description: "Summary → Learn → Quiz → listen." },
  { href: "/learn-by-listening", label: "Learn by listening", description: "Passive study workflows." },
  { href: "/blog", label: "Audio study blog", description: "Guides on voice learning with AI." },
];

export const AUDIO_STUDY_FAQS: FaqItem[] = [
  {
    q: "What is Audio Study Mode?",
    a: "Audio Study Mode turns your Summify analysis into a teacher-style spoken lesson — structured sections, reflection questions, and natural voice audio on Pro plans.",
  },
  {
    q: "Can I convert a PDF into an audio lesson?",
    a: "Yes. Summarize your PDF in the workspace, complete Learn cards, then generate an audio study session from the same analysis.",
  },
  {
    q: "Is Audio Study available on the free plan?",
    a: "Audio Study Mode is a Pro, Scholar, and Team feature. Free users can still summarize documents and use Learn cards and quizzes.",
  },
  {
    q: "Does Audio Study work for non-English documents?",
    a: "Summify reads sources in any language and produces English learning outputs — including audio lesson scripts for listening.",
  },
];

export function audioStudyWorkflow(): FormatLandingConfig["workflow"] {
  return {
    title: "From document to audio lesson",
    steps: [
      {
        title: "Analyze your source",
        description: "Upload a PDF, video, deck, or article and run an intelligence mode.",
      },
      {
        title: "Learn & quiz",
        description: "Review Learn cards and optional quiz to anchor key ideas.",
      },
      {
        title: "Generate audio study",
        description: "Create a teacher-style script and listen with natural voice audio.",
      },
      {
        title: "Review on the go",
        description: "Replay, seek, and regenerate lessons without rereading the full PDF.",
      },
    ],
  };
}

export function audioStudyIntroBlock(): FormatLandingConfig["seoContent"]["blocks"][number] {
  return {
    body: (
      <>
        Summify is evolving from a document summarizer into an{" "}
        <strong>AI study companion</strong>: summarize, learn, practice, and{" "}
        <InternalTextLink href="/learn-by-listening">listen</InternalTextLink>. Audio Study
        Mode adds teacher-style voice lessons so you can study while walking, commuting, or
        resting your eyes — without losing source grounding from your original document.
      </>
    ),
  };
}
