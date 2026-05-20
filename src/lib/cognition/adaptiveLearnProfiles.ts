import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import type {
  AdaptiveLearnGroup,
  AdaptiveLearnProfile,
  LearnCardPattern,
} from "@/types/adaptive-learn";
import type { CognitionDomain } from "@/types/cognition";

function group(
  id: string,
  title: string,
  purpose: string,
  cardTypes: AdaptiveLearnGroup["cardTypes"],
  sequencing: AdaptiveLearnGroup["sequencing"],
  maxCards: number,
  priority: AdaptiveLearnGroup["priority"],
): AdaptiveLearnGroup {
  return { id, title, purpose, cardTypes, sequencing, maxCards, priority };
}

function historicalStudentProfile(
  personaId: string,
  domain: CognitionDomain,
): AdaptiveLearnProfile {
  const patterns: LearnCardPattern[] = [
    "timeline_chain",
    "cause_effect_chain",
    "event_linkage",
    "figure_significance",
    "historical_anchor",
    "fact_recall",
    "quiz_application",
  ];
  return {
    profileId: "learn_historical_student_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Chronology, causality, and figure/event memory for historical study",
    cognitiveStyle: "chronological",
    preferredCardPatterns: patterns,
    memoryStrategy: "timeline_anchors",
    sequencingStrategy: "chronological",
    groupingStrategy: "adaptive_groups",
    reviewStrategy: "connection_drill",
    difficultyModel: "heuristic_v1",
    groups: [
      group(
        "timeline_recall",
        "Timeline Recall",
        "Ordered events, eras, and transitions",
        ["memory_hook", "concept", "quiz"],
        "chronological",
        3,
        "primary",
      ),
      group(
        "key_figures",
        "Key Figures",
        "Actors, roles, and significance",
        ["concept", "why_it_matters"],
        "foundational_first",
        2,
        "primary",
      ),
      group(
        "causes_consequences",
        "Causes & Consequences",
        "Causal chains grounded in the source",
        ["connection", "why_it_matters", "concept"],
        "foundational_first",
        3,
        "primary",
      ),
      group(
        "historical_transitions",
        "Historical Transitions",
        "Turning points and phase shifts",
        ["memory_hook", "connection"],
        "chronological",
        2,
        "secondary",
      ),
    ],
    rationale: "Student + historical — timeline and causality over generic summary flashcards.",
  };
}

function scientificStudentProfile(
  personaId: string,
  domain: CognitionDomain,
): AdaptiveLearnProfile {
  return {
    profileId: "learn_scientific_student_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Mechanisms, processes, terminology, and systems thinking",
    cognitiveStyle: "mechanistic",
    preferredCardPatterns: [
      "process_sequence",
      "mechanism_breakdown",
      "terminology",
      "system_interaction",
      "misconception_trap",
      "quiz_application",
    ],
    memoryStrategy: "process_steps",
    sequencingStrategy: "foundational_first",
    groupingStrategy: "adaptive_groups",
    reviewStrategy: "quiz_heavy",
    difficultyModel: "heuristic_v1",
    groups: [
      group(
        "core_concepts",
        "Core Concepts",
        "Definitions and central ideas",
        ["concept", "memory_hook"],
        "foundational_first",
        3,
        "primary",
      ),
      group(
        "mechanisms",
        "Mechanisms",
        "How processes work step by step",
        ["concept", "connection", "why_it_matters"],
        "foundational_first",
        3,
        "primary",
      ),
      group(
        "systems",
        "Systems",
        "Interactions between parts",
        ["connection", "concept"],
        "architecture_top_down",
        2,
        "secondary",
      ),
      group(
        "practice_questions",
        "Practice Questions",
        "Application and recall checks",
        ["quiz"],
        "signal_priority",
        2,
        "primary",
      ),
    ],
    rationale: "Student + scientific — mechanisms and systems, not executive filler.",
  };
}

function literaryStudentProfile(
  personaId: string,
  domain: CognitionDomain,
): AdaptiveLearnProfile {
  return {
    profileId: "learn_literary_student_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Interpretation, symbolism, character psychology, and narrative awareness",
    cognitiveStyle: "interpretive",
    preferredCardPatterns: [
      "symbol_interpretation",
      "motif_recurrence",
      "character_psychology",
      "narrative_tension",
      "thematic_link",
      "quiz_application",
    ],
    memoryStrategy: "symbol_motif",
    sequencingStrategy: "theme_then_detail",
    groupingStrategy: "adaptive_groups",
    reviewStrategy: "mixed",
    difficultyModel: "heuristic_v1",
    groups: [
      group(
        "themes_motifs",
        "Themes & Motifs",
        "Recurring ideas and patterns",
        ["concept", "memory_hook"],
        "theme_then_detail",
        3,
        "primary",
      ),
      group(
        "character_dynamics",
        "Character Dynamics",
        "Agents, voice, and psychology",
        ["concept", "why_it_matters", "connection"],
        "theme_then_detail",
        2,
        "primary",
      ),
      group(
        "symbolism",
        "Symbolism",
        "Symbols grounded in the text",
        ["memory_hook", "concept"],
        "theme_then_detail",
        2,
        "secondary",
      ),
      group(
        "interpretation_questions",
        "Interpretation Questions",
        "Discussion and essay prompts",
        ["quiz", "why_it_matters"],
        "signal_priority",
        2,
        "primary",
      ),
    ],
    rationale: "Student + literary — themes and interpretation, not risk/action trivia.",
  };
}

function technicalDeveloperProfile(
  personaId: string,
  domain: CognitionDomain,
): AdaptiveLearnProfile {
  return {
    profileId: "learn_technical_developer_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Architecture, workflows, and implementation reasoning",
    cognitiveStyle: "systems",
    preferredCardPatterns: [
      "dependency_chain",
      "architecture_decomposition",
      "workflow_sequence",
      "debugging_path",
      "terminology",
      "quiz_application",
    ],
    memoryStrategy: "architecture_map",
    sequencingStrategy: "architecture_top_down",
    groupingStrategy: "adaptive_groups",
    reviewStrategy: "connection_drill",
    difficultyModel: "heuristic_v1",
    groups: [
      group(
        "architecture",
        "Architecture",
        "System shape and major components",
        ["concept", "connection"],
        "architecture_top_down",
        3,
        "primary",
      ),
      group(
        "components",
        "Components",
        "Parts, modules, and responsibilities",
        ["concept", "why_it_matters"],
        "foundational_first",
        2,
        "primary",
      ),
      group(
        "workflows",
        "Workflows",
        "Sequences and data flow",
        ["connection", "memory_hook"],
        "chronological",
        2,
        "primary",
      ),
      group(
        "failure_points",
        "Failure Points",
        "Failure modes from the source only",
        ["misconception", "why_it_matters"],
        "signal_priority",
        2,
        "secondary",
      ),
    ],
    rationale: "Technical lens — architecture and workflows over generic recap.",
  };
}

function businessExecutiveProfile(
  personaId: string,
  domain: CognitionDomain,
): AdaptiveLearnProfile {
  return {
    profileId: "learn_business_executive_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Strategic signals, metrics, tradeoffs, and decision consequences",
    cognitiveStyle: "strategic",
    preferredCardPatterns: [
      "tradeoff",
      "metric_significance",
      "risk_opportunity",
      "decision_consequence",
      "fact_recall",
    ],
    memoryStrategy: "metric_tradeoff",
    sequencingStrategy: "signal_priority",
    groupingStrategy: "adaptive_groups",
    reviewStrategy: "spaced_recall",
    difficultyModel: "heuristic_v1",
    groups: [
      group(
        "strategic_signals",
        "Strategic Signals",
        "Directional claims and stakes",
        ["why_it_matters", "concept"],
        "signal_priority",
        3,
        "primary",
      ),
      group(
        "metrics",
        "Metrics",
        "Numbers and KPIs from the source",
        ["concept", "memory_hook"],
        "foundational_first",
        2,
        "primary",
      ),
      group(
        "risks_constraints",
        "Risks & Constraints",
        "Downside and limits stated in the doc",
        ["why_it_matters", "misconception"],
        "signal_priority",
        2,
        "secondary",
      ),
      group(
        "opportunities",
        "Opportunities",
        "Upside and openings implied by the text",
        ["why_it_matters", "connection"],
        "signal_priority",
        2,
        "secondary",
      ),
    ],
    rationale: "Executive + business — decisions and metrics, not study-drill tone.",
  };
}

function generalLearnProfile(personaId: string, domain: CognitionDomain): AdaptiveLearnProfile {
  return {
    profileId: "learn_general_v1",
    personaId,
    documentDomain: domain,
    learningGoal: "Balanced recall across concepts, links, and quizzes",
    cognitiveStyle: "balanced",
    preferredCardPatterns: ["fact_recall", "thematic_link", "quiz_application"],
    memoryStrategy: "mixed_recall",
    sequencingStrategy: "foundational_first",
    groupingStrategy: "flat",
    reviewStrategy: "mixed",
    difficultyModel: "heuristic_v1",
    groups: [],
    rationale: "Default learn profile when no specialized family matched.",
  };
}

/**
 * Resolve deterministic learn profile from persona adaptive plan (Phase 11D).
 */
export function buildAdaptiveLearnProfile(plan: PersonaAdaptivePlan): AdaptiveLearnProfile {
  const { structureFamily, personaId, documentDomain: domain } = plan;

  switch (structureFamily) {
    case "student_historical":
      return historicalStudentProfile(personaId, domain);
    case "student_scientific":
      return scientificStudentProfile(personaId, domain);
    case "student_literary":
      return literaryStudentProfile(personaId, domain);
    case "technical":
      return technicalDeveloperProfile(personaId, domain);
    case "executive_business":
      return businessExecutiveProfile(personaId, domain);
    default:
      return generalLearnProfile(personaId, domain);
  }
}
