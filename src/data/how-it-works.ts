export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
};

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Upload",
    description:
      "Drop PDFs, DOCX, or plain text. The web workspace accepts longer files than mobile.",
  },
  {
    step: 2,
    title: "Choose a Smart Template",
    description:
      "Pick Executive, Academic, Document, or Creator mode to shape how your summary is structured.",
  },
  {
    step: 3,
    title: "Get a structured summary",
    description:
      "Review sections, highlights, and action items in a layout tuned for focused reading.",
  },
  {
    step: 4,
    title: "Export or save",
    description:
      "Copy, download, or save to your workspace—ready for meetings, coursework, or content pipelines.",
  },
];
