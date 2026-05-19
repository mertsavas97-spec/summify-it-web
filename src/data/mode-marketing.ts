import type { IntelligenceModeId } from "@/types/modes";

export type ModeMarketingPreview = {
  sampleBullets: string[];
  learnPreview: { type: string; title: string }[];
};

export const MODE_MARKETING_PREVIEWS: Partial<
  Record<IntelligenceModeId, ModeMarketingPreview>
> = {
  "executive-brief": {
    sampleBullets: [
      "Decision summary with tradeoffs and owners",
      "Top risks and mitigations in plain language",
      "90-day implications and next actions",
    ],
    learnPreview: [
      { type: "Why", title: "Why this decision matters now" },
      { type: "Concept", title: "Core strategic tension" },
    ],
  },
  "the-student": {
    sampleBullets: [
      "Concept definitions tied to the source",
      "Study questions and recall hooks",
      "Misconception checks for exam prep",
    ],
    learnPreview: [
      { type: "Concept", title: "Key term from the lecture" },
      { type: "Quiz", title: "Quick check: cause vs effect" },
    ],
  },
  "the-creator": {
    sampleBullets: [
      "Opening hooks and emotional angles",
      "Repurposable beats for social clips",
      "Audience tension and payoff moments",
    ],
    learnPreview: [
      { type: "Hook", title: "Scroll-stopping opener" },
      { type: "Link", title: "Connect to prior episode theme" },
    ],
  },
  "contract-analyzer": {
    sampleBullets: [
      "Party obligations and key dates",
      "Clause summary and ambiguous terms",
      "Informational overview with points to review",
    ],
    learnPreview: [
      { type: "Concept", title: "Termination trigger" },
      { type: "Myth", title: "Common misread of liability cap" },
    ],
  },
};

export function getModeMarketingPreview(
  id: IntelligenceModeId,
): ModeMarketingPreview | undefined {
  return MODE_MARKETING_PREVIEWS[id];
}
