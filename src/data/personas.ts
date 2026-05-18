import type { AnalysisPersona } from "@/core/types";

export type PersonaDefinition = {
  id: AnalysisPersona;
  name: string;
  code: string;
  tagline: string;
  description: string;
  highlights: string[];
  outputSections: string[];
};

export const personas: PersonaDefinition[] = [
  {
    id: "executive",
    name: "The Executive",
    code: "EXEC",
    tagline: "Decisions, risks, and next steps",
    description:
      "Distill board decks, strategy memos, and investor updates into action-oriented briefs.",
    highlights: ["Key decisions", "Risk register", "90-day priorities"],
    outputSections: ["Executive overview", "Key decisions", "Risks", "Next steps"],
  },
  {
    id: "academic",
    name: "The Academic",
    code: "ACAD",
    tagline: "Arguments, methods, and citations",
    description:
      "Navigate dense papers and research PDFs with structured claims and evidence mapping.",
    highlights: ["Thesis summary", "Methodology", "Open questions"],
    outputSections: ["Thesis", "Methodology", "Findings", "Open questions"],
  },
  {
    id: "legal",
    name: "The Legal Reader",
    code: "LEGL",
    tagline: "Clauses, obligations, and timelines",
    description:
      "Break down contracts and policy documents without losing critical legal nuance.",
    highlights: ["Party obligations", "Key dates", "Defined terms"],
    outputSections: ["Parties", "Obligations", "Key dates", "Defined terms"],
  },
  {
    id: "creator",
    name: "The Creator",
    code: "CR8R",
    tagline: "Hooks, beats, and repurposable angles",
    description:
      "Turn long-form content into outlines ready for newsletters, scripts, and social threads.",
    highlights: ["Narrative arc", "Pull quotes", "Content angles"],
    outputSections: ["Narrative arc", "Pull quotes", "Content angles", "Hooks"],
  },
];

export function getPersonaById(id: AnalysisPersona): PersonaDefinition {
  const persona = personas.find((p) => p.id === id);
  if (!persona) throw new Error(`Unknown persona: ${id}`);
  return persona;
}

/** UI-facing alias — maps to persona definitions. */
export const smartTemplates = personas.map(
  ({ id, name, code, tagline, description, highlights }) => ({
    id,
    name,
    code,
    tagline,
    description,
    highlights,
  }),
);

export type SmartTemplate = (typeof smartTemplates)[number];
