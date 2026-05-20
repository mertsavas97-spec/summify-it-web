/**
 * Phase Learn 2 — deterministic mode/persona learn strategies.
 */

import type { LearnCardPattern } from "@/types/adaptive-learn";
import type { CognitionDomain } from "@/types/cognition";
import type { LearnCandidateSource, LearnCardKind } from "./types";

/** Strategy pattern keys: LearnCardPattern + mode-specific buckets. */
export type ModeStrategyPattern = LearnCardPattern | string;

export type ModeLearnPromptStyle =
  | "active_recall"
  | "argument_reconstruction"
  | "decision_recall"
  | "creative_angle"
  | "clause_recall"
  | "mechanism_recall"
  | "balanced";

export type ModeLearnStrategy = {
  id: string;
  label: string;
  preferredPatterns: ModeStrategyPattern[];
  blockedPatterns: ModeStrategyPattern[];
  maxPerPattern: number;
  difficultyCurve: { low: number; medium: number; high: number };
  promptStyle: ModeLearnPromptStyle;
  fallbackPriorities: ModeStrategyPattern[];
  cardInstructions: string;
  practiceInstructions: string;
  /** Target counts for an 8-card practice set (soft targets). */
  targetDistribution: Record<string, number>;
  blockedKinds?: LearnCardKind[];
  blockedSources?: LearnCandidateSource[];
  kindBoosts?: Partial<Record<LearnCardKind, number>>;
};

export type ModeLearnStrategyInput = {
  modeId?: string | null;
  structureFamily?: string | null;
  domain?: CognitionDomain | string | null;
  personaId?: string | null;
  /** Legacy TextAnalysisMode pipeline id (executive, academic, …). */
  pipelineMode?: string | null;
};

const STUDENT_MODE_IDS = new Set([
  "the-student",
  "exam-prep",
  "flashcard-builder",
  "quiz-generator",
  "concept-explainer",
  "deep-dive",
  "smart-notes",
]);

const RESEARCHER_MODE_IDS = new Set(["the-researcher", "deep-dive"]);

const EXECUTIVE_MODE_IDS = new Set([
  "executive-brief",
  "the-executive",
  "swot-analyzer",
  "market-analyst",
  "startup-advisor",
  "meeting-notes-ai",
  "action-items",
  "decision-mapper",
  "timeline-builder",
  "key-points",
  "general-summary",
]);

const CREATOR_MODE_IDS = new Set([
  "the-creator",
  "the-journalist",
  "script-breakdown",
  "podcast-summary",
  "youtube-intelligence",
]);

const LEGAL_MODE_IDS = new Set(["contract-analyzer", "contract-summary"]);

const TECHNICAL_MODE_IDS = new Set(["technical-decoder"]);

function baseStudent(): ModeLearnStrategy {
  return {
    id: "student",
    label: "Student",
    preferredPatterns: [
      "concept",
      "terminology",
      "fact_recall",
      "why_it_matters",
      "cause_effect_chain",
      "timeline_chain",
      "historical_anchor",
      "mechanism_breakdown",
      "symbol_interpretation",
      "quiz_application",
      "memory_hook",
      "misconception_trap",
    ],
    blockedPatterns: [
      "decision",
      "tradeoff",
      "metric_significance",
      "owner_followup",
      "positioning_gap",
      "hook",
      "content_opportunity",
    ],
    maxPerPattern: 2,
    difficultyCurve: { low: 0.35, medium: 0.45, high: 0.2 },
    promptStyle: "active_recall",
    fallbackPriorities: ["fact_recall", "terminology", "cause_effect_chain", "quiz_application"],
    cardInstructions:
      "Active recall, short checkable answers, why-questions, and source-grounded concepts.",
    practiceInstructions: "Prefer why/cause questions and checkable quiz cards; avoid executive action framing.",
    targetDistribution: {
      concept: 2,
      fact_recall: 1,
      cause_effect_chain: 1,
      why_it_matters: 1,
      timeline_chain: 1,
      memory_hook: 1,
      quiz_application: 1,
    },
    blockedSources: ["action"],
    kindBoosts: { concept: 0.14, quiz: 0.12, why_it_matters: 0.1, memory_hook: 0.08 },
  };
}

const STUDENT_HISTORICAL: ModeLearnStrategy = {
  ...baseStudent(),
  id: "student_historical",
  label: "Student · Historical",
  preferredPatterns: [
    "timeline_chain",
    "cause_effect_chain",
    "historical_anchor",
    "figure_significance",
    "event_linkage",
    "fact_recall",
    "terminology",
    "why_it_matters",
    "quiz_application",
    "memory_hook",
  ],
  targetDistribution: {
    concept: 1,
    fact_recall: 1,
    cause_effect_chain: 2,
    timeline_chain: 1,
    figure_significance: 1,
    memory_hook: 1,
    quiz_application: 1,
  },
  fallbackPriorities: ["historical_anchor", "cause_effect_chain", "figure_significance", "timeline_chain"],
};

const STUDENT_SCIENTIFIC: ModeLearnStrategy = {
  ...baseStudent(),
  id: "student_scientific",
  label: "Student · Scientific",
  preferredPatterns: [
    "mechanism_breakdown",
    "terminology",
    "process_sequence",
    "fact_recall",
    "misconception_trap",
    "quiz_application",
    "concept",
    "system_interaction",
  ],
  targetDistribution: {
    concept: 2,
    mechanism_breakdown: 2,
    fact_recall: 1,
    misconception_trap: 1,
    quiz_application: 2,
  },
  fallbackPriorities: ["mechanism_breakdown", "terminology", "quiz_application", "fact_recall"],
};

const STUDENT_LITERARY: ModeLearnStrategy = {
  ...baseStudent(),
  id: "student_literary",
  label: "Student · Literary",
  preferredPatterns: [
    "thematic_link",
    "symbol_interpretation",
    "character_psychology",
    "narrative_tension",
    "motif_recurrence",
    "why_it_matters",
    "concept",
    "quiz_application",
  ],
  targetDistribution: {
    concept: 1,
    thematic_link: 2,
    symbol_interpretation: 1,
    character_psychology: 1,
    why_it_matters: 1,
    quiz_application: 1,
    memory_hook: 1,
  },
  fallbackPriorities: ["thematic_link", "symbol_interpretation", "character_psychology", "why_it_matters"],
};

const RESEARCHER_STRATEGY: ModeLearnStrategy = {
  id: "researcher",
  label: "Researcher",
  preferredPatterns: [
    "claim",
    "evidence",
    "methodology",
    "limitation",
    "contradiction",
    "implication",
    "compare",
    "source_question",
    "concept",
    "terminology",
    "misconception_trap",
    "system_interaction",
  ],
  blockedPatterns: ["hook", "memory_hook", "content_opportunity", "owner_followup", "quiz_application"],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.2, medium: 0.45, high: 0.35 },
  promptStyle: "argument_reconstruction",
  fallbackPriorities: ["claim", "evidence", "limitation", "implication"],
  cardInstructions:
    "Argument reconstruction, evidence mapping, assumptions, and limitations — not study flashcards.",
  practiceInstructions: "Compare claims, identify evidence, and surface limitations from the source.",
  targetDistribution: {
    claim: 2,
    evidence: 2,
    methodology: 1,
    limitation: 1,
    contradiction: 1,
    implication: 1,
  },
  blockedKinds: ["memory_hook"],
  blockedSources: ["action"],
  kindBoosts: { concept: 0.12, misconception: 0.1, connection: 0.1, why_it_matters: 0.08 },
};

const EXECUTIVE_STRATEGY: ModeLearnStrategy = {
  id: "executive",
  label: "Executive / Business",
  preferredPatterns: [
    "decision",
    "risk_opportunity",
    "tradeoff",
    "metric_significance",
    "decision_consequence",
    "why_it_matters",
    "concept",
    "owner_followup",
    "positioning_gap",
    "assumption",
  ],
  blockedPatterns: [
    "quiz_application",
    "fact_recall",
    "symbol_interpretation",
    "character_psychology",
    "misconception_trap",
  ],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.15, medium: 0.5, high: 0.35 },
  promptStyle: "decision_recall",
  fallbackPriorities: ["decision", "risk_opportunity", "tradeoff", "why_it_matters"],
  cardInstructions: "Decisions, risks, tradeoffs, metrics, and next actions — not school-style trivia.",
  practiceInstructions: "What matters next? Recall decisions, risks, and tradeoffs grounded in the source.",
  targetDistribution: {
    decision: 2,
    risk_opportunity: 2,
    tradeoff: 1,
    metric_significance: 1,
    decision_consequence: 1,
    assumption: 1,
  },
  blockedKinds: ["quiz", "misconception"],
  blockedSources: ["summary"],
  kindBoosts: { why_it_matters: 0.16, concept: 0.1, connection: 0.08 },
};

const CREATOR_STRATEGY: ModeLearnStrategy = {
  id: "creator",
  label: "Creator / Media",
  preferredPatterns: [
    "hook",
    "angle",
    "audience_insight",
    "story_beat",
    "quote",
    "content_opportunity",
    "narrative_tension",
    "memory_hook",
    "connection",
    "concept",
  ],
  blockedPatterns: [
    "methodology",
    "limitation",
    "clause",
    "obligation",
    "misconception_trap",
    "quiz_application",
  ],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.3, medium: 0.45, high: 0.25 },
  promptStyle: "creative_angle",
  fallbackPriorities: ["hook", "angle", "story_beat", "memory_hook"],
  cardInstructions: "Hooks, angles, beats, and repurposable moments — not legalistic or academic cards.",
  practiceInstructions: "What is the reusable angle, strongest hook, or clip-worthy moment?",
  targetDistribution: {
    hook: 2,
    angle: 2,
    audience_insight: 1,
    story_beat: 1,
    quote: 1,
    content_opportunity: 1,
  },
  kindBoosts: { memory_hook: 0.14, connection: 0.12, concept: 0.06 },
};

const LEGAL_STRATEGY: ModeLearnStrategy = {
  id: "legal",
  label: "Legal / Contract",
  preferredPatterns: [
    "clause",
    "obligation",
    "deadline",
    "risk_opportunity",
    "exception",
    "party",
    "condition",
    "action_required",
    "concept",
    "terminology",
  ],
  blockedPatterns: ["hook", "memory_hook", "content_opportunity", "quiz_application", "symbol_interpretation"],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.25, medium: 0.55, high: 0.2 },
  promptStyle: "clause_recall",
  fallbackPriorities: ["obligation", "clause", "deadline", "risk_opportunity"],
  cardInstructions:
    "Source-grounded clauses, obligations, parties, and conditions — not legal advice or creative hooks.",
  practiceInstructions: "Recall obligations, parties, conditions, deadlines, and risks stated in the text.",
  targetDistribution: {
    obligation: 2,
    clause: 2,
    deadline: 1,
    risk_opportunity: 1,
    exception: 1,
    party: 1,
  },
  blockedKinds: ["memory_hook", "connection"],
  kindBoosts: { concept: 0.14, why_it_matters: 0.1, misconception: 0.06 },
};

const TECHNICAL_STRATEGY: ModeLearnStrategy = {
  id: "technical",
  label: "Technical / Developer",
  preferredPatterns: [
    "concept",
    "mechanism_breakdown",
    "dependency_chain",
    "workflow_sequence",
    "API_behavior",
    "failure_mode",
    "configuration",
    "debugging_path",
    "architecture_decomposition",
    "system_interaction",
  ],
  blockedPatterns: ["hook", "content_opportunity", "decision", "owner_followup", "symbol_interpretation"],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.25, medium: 0.5, high: 0.25 },
  promptStyle: "mechanism_recall",
  fallbackPriorities: ["mechanism_breakdown", "concept", "workflow_sequence", "failure_mode"],
  cardInstructions: "Mechanisms, dependencies, workflows, and failure modes — not motivational fluff.",
  practiceInstructions: "How does it work? What breaks? What configuration or dependency matters?",
  targetDistribution: {
    concept: 2,
    mechanism_breakdown: 2,
    dependency_chain: 1,
    failure_mode: 1,
    configuration: 1,
    debugging_path: 1,
  },
  blockedKinds: ["memory_hook"],
  blockedSources: ["action"],
  kindBoosts: { concept: 0.14, quiz: 0.08 },
};

const GENERAL_STRATEGY: ModeLearnStrategy = {
  id: "general",
  label: "General",
  preferredPatterns: ["concept", "fact_recall", "why_it_matters", "terminology", "quiz_application"],
  blockedPatterns: ["misconception_trap"],
  maxPerPattern: 2,
  difficultyCurve: { low: 0.3, medium: 0.5, high: 0.2 },
  promptStyle: "balanced",
  fallbackPriorities: ["concept", "fact_recall", "why_it_matters"],
  cardInstructions: "Balanced recall-oriented cards grounded in the source.",
  practiceInstructions: "Explain concepts and recall source-specific takeaways.",
  targetDistribution: {
    concept: 2,
    fact_recall: 1,
    why_it_matters: 2,
    quiz_application: 1,
    terminology: 1,
  },
};

function normalizeModeId(modeId?: string | null): string {
  return (modeId ?? "").trim().toLowerCase();
}

function isHistoricalContext(input: ModeLearnStrategyInput): boolean {
  const sf = (input.structureFamily ?? "").toLowerCase();
  const domain = (input.domain ?? "").toLowerCase();
  return (
    sf.includes("historical") ||
    sf.includes("history") ||
    domain === "historical" ||
    sf.startsWith("learn_historical")
  );
}

function isScientificContext(input: ModeLearnStrategyInput): boolean {
  const sf = (input.structureFamily ?? "").toLowerCase();
  const domain = (input.domain ?? "").toLowerCase();
  return (
    sf.includes("scientific") ||
    sf.includes("science") ||
    domain === "scientific" ||
    sf.startsWith("learn_scientific") ||
    sf.includes("technical_doc")
  );
}

function isLiteraryContext(input: ModeLearnStrategyInput): boolean {
  const sf = (input.structureFamily ?? "").toLowerCase();
  const domain = (input.domain ?? "").toLowerCase();
  return sf.includes("literary") || domain === "literary" || sf.startsWith("learn_literary");
}

function isStudentContext(input: ModeLearnStrategyInput): boolean {
  const modeId = normalizeModeId(input.modeId);
  const pipeline = (input.pipelineMode ?? "").toLowerCase();
  const sf = (input.structureFamily ?? "").toLowerCase();
  return (
    STUDENT_MODE_IDS.has(modeId) ||
    pipeline === "academic" ||
    sf.startsWith("student_") ||
    (input.personaId ?? "").includes("student")
  );
}

/**
 * Resolve the active learn strategy for a mode/persona/domain context.
 */
export function getModeLearnStrategy(input: ModeLearnStrategyInput): ModeLearnStrategy {
  const modeId = normalizeModeId(input.modeId);
  const sf = (input.structureFamily ?? "").toLowerCase();

  if (sf.includes("legal") || LEGAL_MODE_IDS.has(modeId) || modeId === "contract-summary") {
    return LEGAL_STRATEGY;
  }

  if (TECHNICAL_MODE_IDS.has(modeId) || sf.startsWith("learn_technical") || sf.includes("technical")) {
    return TECHNICAL_STRATEGY;
  }

  if (CREATOR_MODE_IDS.has(modeId) || (input.pipelineMode ?? "") === "creator") {
    return CREATOR_STRATEGY;
  }

  if (RESEARCHER_MODE_IDS.has(modeId) && !isStudentContext(input)) {
    return RESEARCHER_STRATEGY;
  }

  if (EXECUTIVE_MODE_IDS.has(modeId) || (input.pipelineMode ?? "") === "executive") {
    return EXECUTIVE_STRATEGY;
  }

  if (isStudentContext(input)) {
    if (isHistoricalContext(input)) return STUDENT_HISTORICAL;
    if (isScientificContext(input)) return STUDENT_SCIENTIFIC;
    if (isLiteraryContext(input)) return STUDENT_LITERARY;
    return baseStudent();
  }

  if (RESEARCHER_MODE_IDS.has(modeId)) return RESEARCHER_STRATEGY;

  return GENERAL_STRATEGY;
}

/** Map a card/candidate to a strategy pattern bucket for ranking and diversity. */
export function resolveCardStrategyPattern(card: {
  type?: string;
  kind?: LearnCardKind;
  title: string;
  content: string;
  learnPattern?: LearnCardPattern;
  source?: string;
}): ModeStrategyPattern {
  if (card.learnPattern) return card.learnPattern;

  const rawKind = card.kind ?? card.type ?? "concept";
  const kind = rawKind === "why" ? "why_it_matters" : (rawKind as LearnCardKind);
  const text = `${card.title} ${card.content}`.toLowerCase();

  if (kind === "quiz") return "quiz_application";
  if (kind === "memory_hook") {
    if (/hook|angle|beat|clip|repurpos/i.test(text)) return "hook";
    return "memory_hook";
  }
  if (kind === "misconception") return "misconception_trap";
  if (kind === "connection") {
    if (/cause|effect|because|therefore|led to/i.test(text)) return "cause_effect_chain";
    if (/versus|vs\.|compared|contrast/i.test(text)) return "compare";
    return "connection";
  }

  if (/\b(clause|section|article)\s+\d/i.test(text) || /\bobligation\b/i.test(text)) {
    return /\bobligation\b/i.test(text) ? "obligation" : "clause";
  }
  if (/\bdeadline\b|\bdue date\b|\bby\s+\d{1,2}\//i.test(text)) return "deadline";
  if (/\bparty\b|\bparties\b|\bvendor\b|\blicensor\b/i.test(text)) return "party";
  if (/\bexception\b|\bunless\b|\bexcluding\b/i.test(text)) return "exception";

  if (/\bdecision\b|\boption\b|\brecommend/i.test(text)) return "decision";
  if (/\brisk\b|\bthreat\b|\bdownside\b/i.test(text)) return "risk_opportunity";
  if (/\btrade[- ]?off\b|\bversus\b/i.test(text)) return "tradeoff";
  if (/\bmetric\b|\bkpi\b|\b%\b|\brevenue\b/i.test(text)) return "metric_significance";
  if (/\bfollow[- ]?up\b|\bowner\b|\bnext step\b/i.test(text)) return "owner_followup";

  if (/\bhook\b|\bopening\b|\bheadline\b/i.test(text)) return "hook";
  if (/\bangle\b|\bframing\b|\baudience\b/i.test(text)) return "angle";
  if (/\bbeat\b|\bact\b|\bscene\b/i.test(text)) return "story_beat";
  if (/[""][^""]{8,60}[""]/.test(card.content)) return "quote";

  if (/\bevidence\b|\bcitation\b|\bstudy\b|\bdata\b/i.test(text)) return "evidence";
  if (/\bmethod\b|\bmethodology\b|\bsample\b/i.test(text)) return "methodology";
  if (/\blimitation\b|\bcaveat\b|\buncertain/i.test(text)) return "limitation";
  if (/\bcontradict\b|\bconflict\b|\bhowever\b/i.test(text)) return "contradiction";
  if (/\bclaim\b|\bargues\b|\bassert/i.test(text)) return "claim";

  if (/\bmechanism\b|\bhow it works\b|\bprocess\b/i.test(text)) return "mechanism_breakdown";
  if (/\bdependenc\b|\brequires\b|\bintegrat/i.test(text)) return "dependency_chain";
  if (/\bconfig\b|\bsetting\b|\bparameter\b/i.test(text)) return "configuration";
  if (/\berror\b|\bfail\b|\bbug\b/i.test(text)) return "failure_mode";
  if (/\bapi\b|\bendpoint\b/i.test(text)) return "API_behavior";
  if (/\bdebug\b|\btroubleshoot/i.test(text)) return "debugging_path";

  if (/\b\d{3,4}\b/.test(text) && /\b(century|era|period|war|movement)\b/i.test(text)) {
    return "timeline_chain";
  }
  if (/\barchitect\b|\bbuilding\b|\bfigure\b/i.test(text)) return "figure_significance";
  if (/\btheme\b|\bmotif\b|\bnarrator\b/i.test(text)) return "thematic_link";
  if (/\bsymbol\b|\bimagery\b/i.test(text)) return "symbol_interpretation";

  if (kind === "why_it_matters") return "why_it_matters";
  if (/\bwhy\b/i.test(card.title)) return "why_it_matters";

  return kind === "concept" ? "concept" : "fact_recall";
}

export function patternPreferenceBoost(
  pattern: ModeStrategyPattern,
  strategy: ModeLearnStrategy,
): number {
  const prefIndex = strategy.preferredPatterns.indexOf(pattern);
  if (prefIndex >= 0) return 0.18 - Math.min(0.12, prefIndex * 0.015);
  if (strategy.blockedPatterns.includes(pattern)) return -0.35;
  return 0;
}
