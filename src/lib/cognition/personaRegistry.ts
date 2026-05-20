import { INTELLIGENCE_MODES } from "@/config/modes";
import type { IntelligenceModeId } from "@/types/modes";
import type { PersonaBrain, PersonaFamily } from "@/types/cognition";

const GENERAL_BRAIN: PersonaBrain = {
  id: "general",
  family: "general",
  goals: ["Clarify what the source says", "Surface the most useful takeaways"],
  priorities: ["Accuracy", "Grounding", "Readable structure"],
  reasoningStyle: "Balanced synthesis without over-interpreting",
  preferredOutputs: ["summary", "keyInsights", "risksOrWarnings"],
  learnCardBias: ["definition", "fact", "memory_hook"],
  depthPreference: "standard",
  riskSensitivity: "medium",
  actionOrientation: "low",
  tone: "Clear and neutral",
};

const FAMILY_BASE: Record<PersonaFamily, Omit<PersonaBrain, "id">> = {
  general: {
    family: "general",
    goals: ["Summarize faithfully", "Highlight signal over noise"],
    priorities: ["Grounding", "Clarity"],
    reasoningStyle: "Neutral document intelligence",
    preferredOutputs: ["summary", "keyInsights"],
    learnCardBias: ["definition", "fact"],
    depthPreference: "standard",
    riskSensitivity: "medium",
    actionOrientation: "low",
    tone: "Neutral and precise",
  },
  learning: {
    family: "learning",
    goals: ["Make ideas teachable", "Support recall and review"],
    priorities: ["Definitions", "Concept links", "Study questions"],
    reasoningStyle: "Pedagogical — explain, define, quiz",
    preferredOutputs: ["keyInsights", "learnCards", "summary"],
    learnCardBias: ["definition", "review_question", "memory_hook", "cause_effect"],
    depthPreference: "standard",
    riskSensitivity: "low",
    actionOrientation: "low",
    tone: "Supportive and study-oriented",
  },
  research: {
    family: "research",
    goals: ["Map claims and evidence", "Surface limitations"],
    priorities: ["Thesis", "Method", "Evidence quality"],
    reasoningStyle: "Critical and evidence-aware",
    preferredOutputs: ["keyInsights", "risksOrWarnings", "summary"],
    learnCardBias: ["evidence", "method", "limitations"],
    depthPreference: "deep",
    riskSensitivity: "medium",
    actionOrientation: "low",
    tone: "Analytical and precise",
  },
  business: {
    family: "business",
    goals: ["Support decisions", "Clarify stakes and tradeoffs"],
    priorities: ["Decisions", "Metrics", "Risks", "Next steps"],
    reasoningStyle: "Strategic and outcome-oriented",
    preferredOutputs: ["keyInsights", "actionItems", "risksOrWarnings"],
    learnCardBias: ["metric", "tradeoff", "action", "risk"],
    depthPreference: "brief",
    riskSensitivity: "high",
    actionOrientation: "high",
    tone: "Executive and direct",
  },
  creative: {
    family: "creative",
    goals: ["Find narrative and audience value", "Surface repurposable angles"],
    priorities: ["Hooks", "Beats", "Tension", "Angles"],
    reasoningStyle: "Narrative and audience-aware",
    preferredOutputs: ["keyInsights", "summary", "learnCards"],
    learnCardBias: ["creator_hook", "theme", "character"],
    depthPreference: "standard",
    riskSensitivity: "low",
    actionOrientation: "medium",
    tone: "Vivid and editorial",
  },
  technical: {
    family: "technical",
    goals: ["Explain systems and dependencies", "Define technical terms"],
    priorities: ["Architecture", "Mechanisms", "Implementation"],
    reasoningStyle: "Structured technical explanation",
    preferredOutputs: ["keyInsights", "summary"],
    learnCardBias: ["definition", "mechanism", "implementation"],
    depthPreference: "deep",
    riskSensitivity: "medium",
    actionOrientation: "medium",
    tone: "Precise and plain-language",
  },
  legal_document: {
    family: "legal_document",
    goals: ["Summarize document content only", "Flag clauses and obligations to review"],
    priorities: ["Obligations", "Definitions", "Risk signals"],
    reasoningStyle: "Clause-oriented informational summary — not advice",
    preferredOutputs: ["keyInsights", "risksOrWarnings", "actionItems"],
    learnCardBias: ["obligation", "risk", "definition"],
    depthPreference: "deep",
    riskSensitivity: "high",
    actionOrientation: "low",
    tone: "Formal and informational",
  },
  policy: {
    family: "policy",
    goals: ["Summarize rules and scope", "Highlight compliance-relevant points"],
    priorities: ["Scope", "Requirements", "Exceptions"],
    reasoningStyle: "Policy-structure mapping — informational only",
    preferredOutputs: ["summary", "keyInsights", "risksOrWarnings"],
    learnCardBias: ["obligation", "definition", "risk"],
    depthPreference: "standard",
    riskSensitivity: "high",
    actionOrientation: "low",
    tone: "Neutral and regulatory-aware",
  },
  media: {
    family: "media",
    goals: ["Extract spoken narrative and moments", "Surface audience value"],
    priorities: ["Thesis", "Beats", "Quotes/moments", "Takeaways"],
    reasoningStyle: "Transcript-native editorial intelligence",
    preferredOutputs: ["keyInsights", "summary", "learnCards"],
    learnCardBias: ["creator_hook", "chronology", "fact"],
    depthPreference: "standard",
    riskSensitivity: "low",
    actionOrientation: "medium",
    tone: "Editorial and energetic",
  },
  productivity: {
    family: "productivity",
    goals: ["Extract actions and decisions", "Reduce ambiguity"],
    priorities: ["Action items", "Owners", "Deadlines", "Open questions"],
    reasoningStyle: "Operational extraction",
    preferredOutputs: ["actionItems", "keyInsights"],
    learnCardBias: ["action", "fact", "cause_effect"],
    depthPreference: "brief",
    riskSensitivity: "medium",
    actionOrientation: "high",
    tone: "Practical and concise",
  },
};

/** Per-mode family mapping (registry layer — separate from UI marketing copy). */
const MODE_FAMILY: Record<IntelligenceModeId, PersonaFamily> = {
  "general-summary": "general",
  "key-points": "general",
  "executive-brief": "business",
  "deep-dive": "research",
  "the-student": "learning",
  "the-researcher": "research",
  "exam-prep": "learning",
  "flashcard-builder": "learning",
  "quiz-generator": "learning",
  "concept-explainer": "learning",
  "the-executive": "business",
  "swot-analyzer": "business",
  "market-analyst": "business",
  "startup-advisor": "business",
  "meeting-notes-ai": "productivity",
  "the-journalist": "media",
  "the-creator": "creative",
  "script-breakdown": "creative",
  "podcast-summary": "media",
  "youtube-intelligence": "media",
  "action-items": "productivity",
  "smart-notes": "learning",
  "decision-mapper": "business",
  "timeline-builder": "productivity",
  "contract-analyzer": "legal_document",
  "technical-decoder": "technical",
  "policy-interpreter": "policy",
  "narrative-explorer": "creative",
  "critical-thinking-mode": "research",
};

const MODE_OVERRIDES: Partial<Record<IntelligenceModeId, Partial<PersonaBrain>>> = {
  "the-student": {
    goals: ["Build study-ready understanding", "Support exams and recall"],
    reasoningStyle: "Student lens — concepts, definitions, review prompts",
    learnCardBias: ["definition", "review_question", "memory_hook", "cause_effect"],
  },
  "the-researcher": {
    goals: ["Trace arguments and evidence", "Note contradictions"],
    learnCardBias: ["evidence", "method", "limitations", "fact"],
  },
  "the-creator": {
    learnCardBias: ["creator_hook", "content_angles", "audience_takeaways"],
    actionOrientation: "high",
  },
  "contract-analyzer": {
    goals: ["Informational clause summary only", "Highlight review points"],
    riskSensitivity: "high",
    tone: "Informational — not legal advice",
  },
  "policy-interpreter": {
    family: "policy",
    goals: ["Summarize policy text", "Clarify scope and requirements"],
  },
  "timeline-builder": {
    learnCardBias: ["chronology", "cause_effect", "fact"],
  },
  "narrative-explorer": {
    learnCardBias: ["theme", "character", "symbol", "narrative_structure"],
  },
  "technical-decoder": {
    family: "technical",
    learnCardBias: ["definition", "mechanism", "implementation"],
  },
  "exam-prep": {
    learnCardBias: ["review_question", "fact", "definition"],
    depthPreference: "standard",
  },
  "critical-thinking-mode": {
    learnCardBias: ["evidence", "limitations", "cause_effect"],
    riskSensitivity: "high",
  },
};

function mergeBrain(modeId: IntelligenceModeId, family: PersonaFamily): PersonaBrain {
  const base = FAMILY_BASE[family];
  const override = MODE_OVERRIDES[modeId] ?? {};
  return {
    ...GENERAL_BRAIN,
    ...base,
    ...override,
    id: modeId,
    family: override.family ?? family,
    goals: override.goals ?? base.goals,
    priorities: override.priorities ?? base.priorities,
    learnCardBias: override.learnCardBias ?? base.learnCardBias,
  };
}

const REGISTRY = new Map<IntelligenceModeId, PersonaBrain>();

for (const mode of INTELLIGENCE_MODES) {
  const family = MODE_FAMILY[mode.id] ?? "general";
  REGISTRY.set(mode.id, mergeBrain(mode.id, family));
}

export function getPersonaBrain(modeId: string): PersonaBrain {
  const brain = REGISTRY.get(modeId as IntelligenceModeId);
  if (brain) return brain;
  return { ...GENERAL_BRAIN, id: modeId };
}

export function listPersonaBrains(): PersonaBrain[] {
  return Array.from(REGISTRY.values());
}
