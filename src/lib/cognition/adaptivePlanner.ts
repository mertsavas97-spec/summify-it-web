import type {
  AdaptiveAnalysisSection,
  LearnCandidateSourceSection,
  PersonaAdaptivePlan,
} from "@/types/adaptive-analysis";
import type {
  CognitionDocumentProfile,
  CognitionSourceKind,
  CognitiveDimension,
  LearnCardBiasResult,
  PersonaBrain,
  ResolvedCognitiveDimensions,
} from "@/types/cognition";

export type BuildAdaptivePlanInput = {
  personaBrain: PersonaBrain;
  documentProfile: CognitionDocumentProfile;
  dimensions: ResolvedCognitiveDimensions;
  learnCardBias: LearnCardBiasResult;
  modeId: string;
  sourceKind: CognitionSourceKind;
};

function section(
  id: string,
  title: string,
  purpose: string,
  dimension: CognitiveDimension | "mixed",
  priority: "primary" | "secondary",
  outputHint: string,
  maxItems: number,
  renderAs: AdaptiveAnalysisSection["renderAs"],
): AdaptiveAnalysisSection {
  return { id, title, purpose, dimension, priority, outputHint, maxItems, renderAs };
}

/** Phase 11C — student learn cards must not synthesize from risks/actions lists. */
const STUDENT_LEARN_SOURCES_ALLOWED: LearnCandidateSourceSection[] = [
  "ai_card",
  "insight",
  "summary",
  "synthesized",
];

const BLOCK_RISK_ACTION_LEARN_SOURCES: LearnCandidateSourceSection[] = ["risk", "action"];

function formatAdaptationLabel(personaId: string, domain: CognitionDocumentProfile["domain"]): string {
  const persona =
    personaId === "the-student"
      ? "Student"
      : personaId === "the-creator"
        ? "Creator"
        : personaId === "contract-analyzer"
          ? "Contract Summary"
          : personaId === "executive-brief" || personaId === "the-executive"
            ? "Executive"
            : personaId === "technical-decoder"
              ? "Technical"
              : personaId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const domainLabel = domain
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return `${persona} · ${domainLabel}`;
}

function studentHistoricalPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "student_historical_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "student_historical",
    primaryGoal: "Build chronology-aware study understanding",
    sections: [
      section(
        "historical_context",
        "Historical Context",
        "Situate the topic in time, place, and stakes",
        "chronology",
        "primary",
        "Open summary with period, actors, and central tension from the source",
        3,
        "summary",
      ),
      section(
        "timeline",
        "Timeline / Sequence",
        "Ordered events or phases",
        "chronology",
        "primary",
        "Use keyInsights for dated steps; include years/eras when present",
        6,
        "timeline",
      ),
      section(
        "causes_effects",
        "Causes & Consequences",
        "Causal chains supported by the text",
        "causal_chain",
        "primary",
        "keyInsights bullets with cause → effect language",
        5,
        "bullets",
      ),
      section(
        "key_terms",
        "Key Terms / Figures",
        "Definitions and named actors",
        "definitions",
        "secondary",
        "Glossary-style bullets; proper nouns preserved",
        6,
        "glossary",
      ),
      section(
        "review_questions",
        "Review Questions",
        "Active recall prompts",
        "review_questions",
        "primary",
        "Place study questions in actionItems OR as quiz learnCards — not generic tasks",
        5,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: ["risks", "actions"],
    learnCardStrategy: {
      summary:
        "Prefer chronology, cause_effect, fact, memory_hook, review_question. No generic Myth cards.",
      preferredAdaptiveTypes: [
        "chronology",
        "cause_effect",
        "fact",
        "definition",
        "memory_hook",
        "review_question",
      ],
      avoidedAdaptiveTypes: ["risk", "action", "metric", "tradeoff"],
      providerTypeEmphasis:
        "learnCards: use concept for terms/facts, memory_hook for timelines, quiz for review questions. Avoid misconception unless the source states a clear false belief.",
      titleStyle: "Short editorial titles (e.g. 'Treaty of Westphalia Stakes') — never 'Myth:' or 'Why it matters' generics.",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: true,
    },
    toneGuidance: "Study notes for history — concrete dates, actors, and causal links.",
    safetyGuidance: input.documentProfile.domain === "legal_document" ? "Informational only." : "",
    rationale: "Student lens on historical material — timeline and recall over business risks/actions.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
    allowedLearnSourceSections: STUDENT_LEARN_SOURCES_ALLOWED,
    blockedLearnSourceSections: BLOCK_RISK_ACTION_LEARN_SOURCES,
    uiSectionLabels: {
      summary: "Historical Context",
      keyInsights: "Timeline · Key Figures · Causes & Consequences",
      risks: "Source limitations",
      actions: "Review questions",
    },
  };
}

function studentScientificPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "student_scientific_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "student_scientific",
    primaryGoal: "Explain concepts, mechanisms, and study-ready recall",
    sections: [
      section(
        "core_concepts",
        "Core Concepts",
        "Central ideas and definitions",
        "definitions",
        "primary",
        "summary paragraphs name each core concept with source wording",
        4,
        "study_notes",
      ),
      section(
        "mechanisms",
        "Mechanisms / Process",
        "How processes work step by step",
        "mechanisms",
        "primary",
        "keyInsights as mechanism bullets",
        5,
        "bullets",
      ),
      section(
        "key_terms",
        "Key Terms",
        "Vocabulary and notation",
        "definitions",
        "primary",
        "Glossary bullets in keyInsights",
        6,
        "glossary",
      ),
      section(
        "confusions",
        "Common Confusions",
        "Likely misunderstandings the source clarifies",
        "limitations",
        "secondary",
        "Only if supported; otherwise omit — never generic 'approach critically'",
        3,
        "insight_cards",
      ),
      section(
        "practice_questions",
        "Practice Questions",
        "Drill and application",
        "review_questions",
        "primary",
        "quiz learnCards and/or actionItems as practice prompts only",
        5,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: ["actions", "risks"],
    learnCardStrategy: {
      summary: "Prefer definition, mechanism, formula, method, quiz. Avoid myth unless explicit false belief.",
      preferredAdaptiveTypes: ["definition", "mechanism", "formula", "method", "review_question", "fact"],
      avoidedAdaptiveTypes: ["action", "creator_hook", "metric"],
      providerTypeEmphasis:
        "learnCards: concept for definitions/mechanisms, quiz for practice, memory_hook for formulas/rules. Rarely misconception.",
      titleStyle: "Precise term-based titles — e.g. 'Osmosis Gradient', not 'Importance of…'",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: true,
    },
    toneGuidance: "Clear science-study tone — precise terms, processes, and checks.",
    safetyGuidance: "",
    rationale: "Student + scientific/technical — concepts and mechanisms, not business filler.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
    allowedLearnSourceSections: STUDENT_LEARN_SOURCES_ALLOWED,
    blockedLearnSourceSections: BLOCK_RISK_ACTION_LEARN_SOURCES,
    uiSectionLabels: {
      summary: "Core Concepts",
      keyInsights: "Mechanisms · Key Systems · Processes",
      risks: "Clarifications",
      actions: "Practice questions",
    },
  };
}

function studentLiteraryPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "student_literary_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "student_literary",
    primaryGoal: "Interpret narrative, theme, and literary craft",
    sections: [
      section(
        "narrative_overview",
        "Narrative Overview",
        "Plot arc or argument of the work",
        "narrative_structure",
        "primary",
        "summary as narrative overview — not executive recap",
        3,
        "summary",
      ),
      section(
        "themes",
        "Themes",
        "Recurring ideas",
        "themes",
        "primary",
        "Thematic keyInsights",
        5,
        "bullets",
      ),
      section(
        "characters_voice",
        "Characters / Voice",
        "Agents, perspective, tone",
        "characters",
        "primary",
        "Character-focused bullets",
        5,
        "insight_cards",
      ),
      section(
        "symbolism",
        "Symbolism / Motifs",
        "Symbols and motifs grounded in text",
        "symbolism",
        "secondary",
        "Only symbols evidenced in source",
        4,
        "bullets",
      ),
      section(
        "interpretation_questions",
        "Interpretation Questions",
        "Discussion and essay prompts",
        "review_questions",
        "primary",
        "quiz cards or actionItems as interpretation prompts",
        4,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: ["risks", "actions"],
    learnCardStrategy: {
      summary: "Prefer theme, character, symbol, interpretation_question. No risk/action cards.",
      preferredAdaptiveTypes: ["theme", "character", "symbol", "review_question", "fact", "memory_hook"],
      avoidedAdaptiveTypes: ["risk", "action", "metric", "obligation"],
      providerTypeEmphasis:
        "learnCards: concept for themes/terms, memory_hook for motifs/quotes, quiz for interpretation. Avoid misconception unless a stated myth.",
      titleStyle: "Literary editorial titles — e.g. 'Isolation as Motif', not generic Why/Myth.",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: true,
    },
    toneGuidance: "Literary analysis for study — grounded interpretation, not plot spoiler fluff.",
    safetyGuidance: "",
    rationale: "Student + literary/creative — themes and interpretation, not generic risks.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
    allowedLearnSourceSections: STUDENT_LEARN_SOURCES_ALLOWED,
    blockedLearnSourceSections: BLOCK_RISK_ACTION_LEARN_SOURCES,
    uiSectionLabels: {
      summary: "Themes & Motifs",
      keyInsights: "Symbolism · Narrative Voice · Interpretation",
      risks: "Reading caveats",
      actions: "Discussion questions",
    },
  };
}

function creatorMediaPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "creator_media_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "creator_media",
    primaryGoal: "Extract hooks, angles, and repurposable content beats",
    sections: [
      section(
        "premise",
        "Content Premise",
        "What the piece is about in one sharp frame",
        "narrative_structure",
        "primary",
        "summary as premise — direct statements, no 'the video discusses'",
        2,
        "summary",
      ),
      section(
        "hooks",
        "Strong Hooks",
        "Scroll-stopping angles",
        "creator_hooks",
        "primary",
        "keyInsights lead with hooks; timestamps if present",
        6,
        "insight_cards",
      ),
      section(
        "audience_takeaways",
        "Audience Takeaways",
        "What viewers/readers should feel or learn",
        "audience_takeaways",
        "primary",
        "Bullets with audience-specific language",
        5,
        "bullets",
      ),
      section(
        "repurpose_angles",
        "Repurposable Angles",
        "Thread, clip, carousel ideas tied to beats",
        "content_angles",
        "primary",
        "actionItems as content ideas, not chores",
        5,
        "numbered",
      ),
      section(
        "clip_ideas",
        "Clip / Post Ideas",
        "Specific moments or posts",
        "creator_hooks",
        "secondary",
        "Short actionable post concepts in actionItems",
        5,
        "action_list",
      ),
    ],
    suppressedDefaultSections: ["risks"],
    learnCardStrategy: {
      summary: "Prefer hook, angle, audience_takeaway, repurpose prompts.",
      preferredAdaptiveTypes: ["creator_hook", "fact", "memory_hook", "theme"],
      avoidedAdaptiveTypes: ["obligation", "formula", "methodology"],
      providerTypeEmphasis:
        "learnCards: memory_hook for hooks, concept for pillars, why for audience angle, quiz for 'which hook fits'.",
      titleStyle: "Hook-style titles from source phrases — never generic marketing platitudes.",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: false,
    },
    toneGuidance: "Creator brief — energetic, specific, repurposing-focused.",
    safetyGuidance: "",
    rationale: "Creator + media — hooks and angles; suppress academic methodology and generic risks.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
  };
}

function executiveBusinessPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "executive_business_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "executive_business",
    primaryGoal: "Support decisions with metrics, risks, and next steps",
    sections: [
      section(
        "snapshot",
        "Executive Snapshot",
        "Top-line situation",
        "decisions",
        "primary",
        "summary as executive snapshot",
        2,
        "summary",
      ),
      section(
        "decision_signals",
        "Decision Signals",
        "Choices and implications",
        "decisions",
        "primary",
        "keyInsights",
        6,
        "bullets",
      ),
      section(
        "risks_constraints",
        "Risks / Constraints",
        "Source-grounded risks only",
        "risks",
        "primary",
        "risksOrWarnings — only if document mentions risk/limitation",
        5,
        "risk_list",
      ),
      section(
        "opportunities",
        "Opportunities",
        "Upside or openings stated in source",
        "metrics",
        "secondary",
        "keyInsights bullets",
        4,
        "bullets",
      ),
      section(
        "next_actions",
        "Next Actions",
        "Concrete follow-ups with owners/dates when present",
        "action_items",
        "primary",
        "actionItems",
        5,
        "action_list",
      ),
      section(
        "metrics",
        "Metrics",
        "Numbers and KPIs from source",
        "metrics",
        "secondary",
        "keyInsights or summary",
        4,
        "table_like",
      ),
    ],
    suppressedDefaultSections: [],
    learnCardStrategy: {
      summary: "Prefer metric, tradeoff, action, risk where relevant.",
      preferredAdaptiveTypes: ["metric", "tradeoff", "action", "risk", "fact"],
      avoidedAdaptiveTypes: ["symbol", "character"],
      providerTypeEmphasis: "learnCards: concept for metrics/models, why for tradeoffs, memory_hook for rules of thumb.",
      titleStyle: "Decision-oriented titles with numbers when available.",
      suppressMisconceptionUnlessExplicit: false,
      suppressRiskActionSynthesis: false,
    },
    toneGuidance: "Executive — decisive, metric-aware, source-grounded.",
    safetyGuidance:
      documentProfile.domain === "financial"
        ? "Financial content: informational overview only — not investment advice."
        : "",
    rationale: "Executive/business — full decision stack with relevant risks and actions.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
  };
}

function legalDocumentPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "legal_document_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "legal_document",
    primaryGoal: "Informational clause overview and verification prompts",
    sections: [
      section(
        "overview",
        "Plain-language Overview",
        "What the document is",
        "key_concepts",
        "primary",
        "summary — neutral, no legal advice",
        2,
        "summary",
      ),
      section(
        "parties",
        "Parties / Stakeholders",
        "Who is involved",
        "stakeholders",
        "primary",
        "keyInsights",
        4,
        "bullets",
      ),
      section(
        "obligations",
        "Obligations",
        "Duties stated in text",
        "obligations",
        "primary",
        "keyInsights and actionItems as 'review points' only",
        6,
        "numbered",
      ),
      section(
        "watchpoints",
        "Risks / Watchpoints",
        "Liabilities or flags in the document",
        "risks",
        "primary",
        "risksOrWarnings — document-stated only",
        5,
        "risk_list",
      ),
      section(
        "dates_conditions",
        "Dates / Conditions",
        "Deadlines and triggers",
        "chronology",
        "secondary",
        "keyInsights with dates",
        4,
        "timeline",
      ),
      section(
        "verify",
        "Questions to Verify",
        "What a reader should double-check",
        "review_questions",
        "primary",
        "actionItems as verification questions, not advice",
        4,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: [],
    learnCardStrategy: {
      summary: "Prefer obligation, risk, definition, verification_question.",
      preferredAdaptiveTypes: ["obligation", "risk", "definition", "fact", "review_question"],
      avoidedAdaptiveTypes: ["creator_hook", "theme"],
      providerTypeEmphasis:
        "learnCards: concept for defined terms, why for obligation importance, quiz for 'spot the clause'.",
      titleStyle: "Clause/term titles — e.g. 'Termination Notice Period'.",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: false,
    },
    toneGuidance: "Formal informational summary — not legal advice.",
    safetyGuidance:
      "LEGAL DOCUMENT CATEGORY ONLY: summarize text; do not recommend actions or interpret law. Suggest professional review for decisions.",
    rationale: "Contract/policy mode — obligations and verification, informational framing.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
  };
}

function technicalPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind } = input;
  return {
    planId: "technical_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "technical",
    primaryGoal: "Explain systems, dependencies, and implementation reality",
    sections: [
      section(
        "system_overview",
        "System Overview",
        "What the system does",
        "technical_architecture",
        "primary",
        "summary overview",
        2,
        "summary",
      ),
      section(
        "architecture",
        "Architecture / Components",
        "Major parts and relationships",
        "technical_architecture",
        "primary",
        "keyInsights",
        6,
        "concept_map_seed",
      ),
      section(
        "implementation",
        "Implementation Steps",
        "How to build or operate",
        "implementation_steps",
        "primary",
        "numbered keyInsights or actionItems",
        5,
        "numbered",
      ),
      section(
        "tradeoffs",
        "Dependencies / Tradeoffs",
        "Constraints and choices",
        "tradeoffs",
        "secondary",
        "keyInsights",
        4,
        "bullets",
      ),
      section(
        "failure_points",
        "Debug / Failure Points",
        "Failure modes mentioned in source",
        "risks",
        "secondary",
        "risksOrWarnings only if source mentions failures",
        4,
        "risk_list",
      ),
      section(
        "review_questions",
        "Review Questions",
        "Checks for understanding",
        "review_questions",
        "secondary",
        "quiz learnCards",
        4,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: ["actions"],
    learnCardStrategy: {
      summary: "Prefer definition, mechanism, implementation, tradeoff, quiz.",
      preferredAdaptiveTypes: ["definition", "mechanism", "implementation", "fact", "review_question"],
      avoidedAdaptiveTypes: ["theme", "character", "creator_hook"],
      providerTypeEmphasis: "learnCards: concept for components, quiz for checks, memory_hook for invariants.",
      titleStyle: "Technical noun phrases from the doc.",
      suppressMisconceptionUnlessExplicit: true,
      suppressRiskActionSynthesis: true,
    },
    toneGuidance: "Technical clarity — components, flows, and constraints.",
    safetyGuidance: "",
    rationale: "Technical/developer lens — architecture and implementation.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
    blockedLearnSourceSections: BLOCK_RISK_ACTION_LEARN_SOURCES,
    uiSectionLabels: {
      summary: "Technical Architecture",
      keyInsights: "Key Mechanisms · Workflow Logic",
      risks: "Dependencies · Failure Points",
      actions: "Core Terminology",
    },
  };
}

function generalFallbackPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, sourceKind, learnCardBias } = input;
  return {
    planId: "general_fallback_v1",
    personaId: personaBrain.id,
    documentDomain: documentProfile.domain,
    sourceKind,
    profileConfidence: documentProfile.confidence,
    structureFamily: "general_fallback",
    primaryGoal: "Balanced grounded summary",
    sections: [
      section(
        "summary",
        "Summary",
        "Core content",
        "key_concepts",
        "primary",
        "summary field",
        3,
        "summary",
      ),
      section(
        "insights",
        "Key Insights",
        "High-signal bullets",
        "key_concepts",
        "primary",
        "keyInsights",
        6,
        "bullets",
      ),
      section(
        "details",
        "Important Details",
        "Supporting facts",
        "definitions",
        "secondary",
        "keyInsights",
        4,
        "bullets",
      ),
      section(
        "followups",
        "Questions / Follow-ups",
        "Open questions or checks",
        "review_questions",
        "secondary",
        "actionItems as follow-up questions if useful",
        3,
        "review_prompts",
      ),
    ],
    suppressedDefaultSections: [],
    learnCardStrategy: {
      summary: learnCardBias.rationale,
      preferredAdaptiveTypes: learnCardBias.preferredCardTypes,
      avoidedAdaptiveTypes: learnCardBias.avoidedCardTypes,
      providerTypeEmphasis: learnCardBias.providerTypeEmphasis,
      titleStyle: "Source-grounded editorial titles.",
      suppressMisconceptionUnlessExplicit: false,
      suppressRiskActionSynthesis: false,
    },
    toneGuidance: personaBrain.tone,
    safetyGuidance: "",
    rationale: "Default plan when no specialized rule matched.",
    adaptationLabel: formatAdaptationLabel(personaBrain.id, documentProfile.domain),
  };
}

function isStudentPersona(modeId: string, brain: PersonaBrain): boolean {
  return (
    brain.family === "learning" ||
    modeId === "the-student" ||
    modeId === "exam-prep" ||
    modeId === "flashcard-builder" ||
    modeId === "quiz-generator" ||
    modeId === "concept-explainer" ||
    modeId === "smart-notes"
  );
}

function isCreatorPersona(modeId: string, brain: PersonaBrain): boolean {
  return (
    brain.family === "creative" ||
    brain.family === "media" ||
    modeId === "the-creator" ||
    modeId === "the-journalist" ||
    modeId === "podcast-summary" ||
    modeId === "youtube-intelligence" ||
    modeId === "script-breakdown"
  );
}

function isExecutivePersona(modeId: string, brain: PersonaBrain): boolean {
  return (
    brain.family === "business" ||
    brain.family === "productivity" ||
    modeId === "executive-brief" ||
    modeId === "the-executive" ||
    modeId === "swot-analyzer" ||
    modeId === "market-analyst" ||
    modeId === "startup-advisor" ||
    modeId === "meeting-notes-ai" ||
    modeId === "action-items" ||
    modeId === "decision-mapper"
  );
}

/**
 * Deterministic persona-aware structure plan (Phase 11B). No extra LLM call.
 */
export function buildAdaptiveAnalysisPlan(input: BuildAdaptivePlanInput): PersonaAdaptivePlan {
  const { personaBrain, documentProfile, modeId } = input;
  const domain = documentProfile.domain;

  if (isStudentPersona(modeId, personaBrain)) {
    if (domain === "historical") return studentHistoricalPlan(input);
    if (domain === "scientific" || domain === "technical" || domain === "educational") {
      return studentScientificPlan(input);
    }
    if (domain === "literary" || domain === "creative") return studentLiteraryPlan(input);
  }

  if (isCreatorPersona(modeId, personaBrain) && (domain === "media_transcript" || domain === "creative")) {
    return creatorMediaPlan(input);
  }

  if (
    isExecutivePersona(modeId, personaBrain) &&
    (domain === "business" || domain === "financial" || domain === "news")
  ) {
    return executiveBusinessPlan(input);
  }

  if (
    modeId === "contract-analyzer" ||
    modeId === "policy-interpreter" ||
    domain === "legal_document" ||
    domain === "policy"
  ) {
    return legalDocumentPlan(input);
  }

  if (
    modeId === "technical-decoder" ||
    (personaBrain.family === "technical" && domain === "technical")
  ) {
    return technicalPlan(input);
  }

  if (domain === "media_transcript" && isCreatorPersona(modeId, personaBrain)) {
    return creatorMediaPlan(input);
  }

  return generalFallbackPlan(input);
}

/** Merge plan-specific learn routing into 11A bias. */
const VALID_ADAPTIVE_TYPES = new Set([
  "definition",
  "fact",
  "cause_effect",
  "chronology",
  "formula",
  "mechanism",
  "method",
  "evidence",
  "risk",
  "obligation",
  "action",
  "character",
  "theme",
  "symbol",
  "metric",
  "tradeoff",
  "implementation",
  "creator_hook",
  "review_question",
  "memory_hook",
]);

function filterAdaptiveTypes(types: string[]): LearnCardBiasResult["preferredCardTypes"] {
  return types.filter((t): t is LearnCardBiasResult["preferredCardTypes"][number] =>
    VALID_ADAPTIVE_TYPES.has(t),
  );
}

export function applyPlanToLearnCardBias(
  bias: LearnCardBiasResult,
  plan: PersonaAdaptivePlan,
): LearnCardBiasResult {
  const preferred = filterAdaptiveTypes([
    ...plan.learnCardStrategy.preferredAdaptiveTypes,
    ...bias.preferredCardTypes,
  ]);
  const avoided = filterAdaptiveTypes([
    ...plan.learnCardStrategy.avoidedAdaptiveTypes,
    ...bias.avoidedCardTypes,
  ]);

  return {
    ...bias,
    preferredCardTypes: [...new Set(preferred)].slice(0, 12),
    avoidedCardTypes: [...new Set(avoided)],
    providerTypeEmphasis: plan.learnCardStrategy.providerTypeEmphasis,
    rationale: `${plan.learnCardStrategy.summary} ${bias.rationale}`,
  };
}
