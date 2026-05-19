import type { HowToStepInput } from "@/lib/schema";

/** Visible homepage workflow — keep in sync with FormatWorkflow on `/`. */
export const SUMMIFY_HOW_TO_STEPS: HowToStepInput[] = [
  {
    name: "Add a source",
    text: "Upload or paste a PDF, PowerPoint deck, YouTube URL, web article, DOCX, or plain text in the Summify workspace.",
  },
  {
    name: "Choose an intelligence mode",
    text: "Pick a lens such as Executive Brief, The Student, or The Creator to shape how the AI analyzes your document.",
  },
  {
    name: "Run AI document analysis",
    text: "Summify extracts text, applies adaptive compaction for long sources, and generates structured summaries and insights.",
  },
  {
    name: "Review Learn cards and mind maps",
    text: "Study with concept and quiz cards, explore interactive mind maps, and save sessions to your dashboard when signed in.",
  },
];
