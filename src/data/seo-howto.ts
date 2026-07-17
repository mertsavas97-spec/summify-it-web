import type { HowToStepInput } from "@/lib/schema";

/** Visible homepage workflow — keep in sync with FormatWorkflow on `/`. */
export const SUMMIFY_HOW_TO_STEPS: HowToStepInput[] = [
  {
    name: "Upload or paste",
    text: "Add a PDF, PowerPoint, YouTube URL, web article, or text in the Summify AI summarizer workspace.",
  },
  {
    name: "Get your AI summary",
    text: "Summify generates a structured overview and key insights, tuned by the intelligence mode you choose.",
  },
  {
    name: "Study if you want",
    text: "Open flashcards and a quiz from the same source — or generate optional audio for hands-free review.",
  },
];
