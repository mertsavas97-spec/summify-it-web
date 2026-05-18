import type { AnalysisMode } from "@/core/types";

export type AnalysisModeDefinition = {
  id: AnalysisMode;
  name: string;
  description: string;
  proOnly: boolean;
};

export const analysisModes: AnalysisModeDefinition[] = [
  {
    id: "quick",
    name: "Quick",
    description: "Surface-level scan for short documents.",
    proOnly: false,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Balanced depth for most workspace documents.",
    proOnly: false,
  },
  {
    id: "deep",
    name: "Deep",
    description: "Extended reasoning over the knowledge layer.",
    proOnly: true,
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Cross-section synthesis and citation-aware output.",
    proOnly: true,
  },
];

export const defaultAnalysisMode: AnalysisMode = "standard";
