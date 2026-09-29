/**
 * Reusable launch copy for Product Hunt, Uneed, Futurepedia, and similar listings.
 * Platform-agnostic — avoid hardcoding Product Hunt branding in product UI.
 */

export type LaunchTagline = {
  id: string;
  text: string;
  /** Optional angle label for internal selection (e.g. "knowledge", "speed"). */
  angle?: string;
};

export type LaunchFaqItem = {
  question: string;
  answer: string;
};

export type LaunchKit = {
  productName: string;
  taglines: LaunchTagline[];
  shortDescription: string;
  longDescription: string;
  makerStory: string;
  features: string[];
  faqs: LaunchFaqItem[];
  cta: {
    headline: string;
    body: string;
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
  };
  /** Optional media paths or URLs for launch decks. */
  media?: {
    logoPath?: string;
    gallery?: string[];
    demoVideoUrl?: string;
  };
};

export const SUMMIFY_LAUNCH_KIT: LaunchKit = {
  productName: "Summify",
  taglines: [
    {
      id: "primary",
      text: "Turn PDFs, decks, and videos into structured intelligence you can actually remember.",
      angle: "knowledge",
    },
    {
      id: "modes",
      text: "AI document intelligence with modes, mind maps, and spaced review — not just another summary.",
      angle: "differentiation",
    },
    {
      id: "beta",
      text: "Analyze sources on the Free plan, then unlock audio lessons and every lens on Pro.",
      angle: "launch",
    },
  ],
  shortDescription:
    "Summify is a premium AI knowledge workspace that turns PDFs, PowerPoint decks, YouTube videos, web articles, and more into structured summaries, Learn cards, mind maps, and memory review — with intelligence modes built for how you actually work.",
  longDescription: `Summify helps students, creators, researchers, and teams move from raw documents to actionable understanding.

Upload a PDF, paste a YouTube link, drop a deck, or pull in a web article. Pick an intelligence mode — Executive Brief, The Student, Contract Analyzer, and more — and get a structured analysis: key insights, risks, action items, and Learn cards designed for retention.

Unlike one-size-fits-all summarizers, Summify is built as a workspace: save analyses, review with spaced repetition, export to Markdown or JSON, generate mind maps from your results, and share read-only links without exposing private files.

Summify is live at summify.app. The Free plan covers daily summaries; Pro adds audio lessons, podcasts, and every lens.`,
  makerStory: `We built Summify because most AI summarizers stop at a wall of text. Real learning and real decisions need structure: what matters, what to do next, and what to revisit later.

Summify combines document intelligence modes, Learn cards, mind maps, and a lightweight memory system so your sources become something you can use — not something you read once and forget.

We're shipping in public and keeping the experience premium: no spammy growth hacks, no training on your private uploads for model improvement, and share pages that respect privacy (structured output only, never raw files).`,
  features: [
    "Multi-format ingestion: PDF, PPTX, YouTube, web articles, DOCX, TXT, MP3",
    "6 core intelligence lenses for executives, students, creators, contracts, and exam prep",
    "Learn cards and spaced memory review built into the workspace",
    "Mind maps generated from analysis — no extra AI call required",
    "Export to Markdown, TXT, JSON, and print-friendly layouts",
    "Privacy-safe public share links (structured output only)",
    "Free plan for daily summaries, Pro for the full workflow",
  ],
  faqs: [
    {
      question: "Is Summify free?",
      answer:
        "The Free plan includes 5 analyses a day, Learn cards, and quizzes. Pro adds unlimited audio lessons, podcasts, and every lens.",
    },
    {
      question: "What file types are supported?",
      answer:
        "PDF, PowerPoint, YouTube URLs, web articles, DOCX, plain text, and MP3/audio workflows. More formats are on the roadmap.",
    },
    {
      question: "Do you train models on my uploads?",
      answer:
        "No. Your private uploads are processed to deliver your analysis and are not used to train third-party foundation models. Shared links expose only structured summaries and Learn cards — never raw files.",
    },
    {
      question: "How is Summify different from ChatPDF or generic summarizers?",
      answer:
        "Summify is a knowledge workspace: intelligence modes, Learn cards, mind maps, memory review, and export/share — not a single chat thread over one PDF.",
    },
  ],
  cta: {
    headline: "Try Summify",
    body: "Upload your first source in under a minute. No credit card required for core analysis.",
    primaryLabel: "Open workspace",
    primaryUrl: "https://www.summify.app/upload",
    secondaryLabel: "View pricing preview",
    secondaryUrl: "https://www.summify.app/pricing",
  },
  media: {
    logoPath: "/brand/summify-mark.svg",
    gallery: ["/og-default.png"],
  },
};

/** Pick a tagline by id, falling back to the first entry. */
export function getLaunchTagline(id?: string): string {
  const kit = SUMMIFY_LAUNCH_KIT;
  if (!id) return kit.taglines[0]?.text ?? kit.shortDescription;
  return kit.taglines.find((t) => t.id === id)?.text ?? kit.taglines[0]?.text ?? "";
}

/** Plain-text block suitable for directory paste fields. */
export function formatLaunchFeatureList(features: string[] = SUMMIFY_LAUNCH_KIT.features): string {
  return features.map((f) => `• ${f}`).join("\n");
}

/** Combined long-form copy for launch forms with character limits. */
export function getLaunchLongForm(maxChars?: number): string {
  const { longDescription, makerStory } = SUMMIFY_LAUNCH_KIT;
  const combined = `${longDescription}\n\n---\n\n${makerStory}`;
  if (!maxChars || combined.length <= maxChars) return combined;
  return `${combined.slice(0, maxChars - 1)}…`;
}
