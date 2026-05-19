import type { IntelligenceModeId } from "@/types/modes";

export type ModesNavMenuItem = {
  modeId: IntelligenceModeId;
};

export type ModesNavMenuSection = {
  title: string;
  items: ModesNavMenuItem[];
};

/** Curated header mega-menu — labels resolved from mode registry at render time. */
export const MODES_NAV_MENU_SECTIONS: ModesNavMenuSection[] = [
  {
    title: "Core",
    items: [
      { modeId: "executive-brief" },
      { modeId: "general-summary" },
      { modeId: "deep-dive" },
    ],
  },
  {
    title: "Academic & Study",
    items: [
      { modeId: "the-student" },
      { modeId: "exam-prep" },
      { modeId: "quiz-generator" },
    ],
  },
  {
    title: "Creator & Media",
    items: [
      { modeId: "the-creator" },
      { modeId: "podcast-summary" },
      { modeId: "youtube-intelligence" },
    ],
  },
  {
    title: "Business & Strategy",
    items: [
      { modeId: "swot-analyzer" },
      { modeId: "meeting-notes-ai" },
      { modeId: "decision-mapper" },
    ],
  },
  {
    title: "Documents & Technical",
    items: [
      { modeId: "contract-analyzer" },
      { modeId: "technical-decoder" },
      { modeId: "critical-thinking-mode" },
    ],
  },
];
