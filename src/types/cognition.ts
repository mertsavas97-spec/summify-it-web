/**
 * Cognitive foundation types (Phase 11A).
 * Separate from server/intelligence DocumentProfile (heuristic prepass).
 */

export type CognitionDomain =
  | "general"
  | "academic"
  | "scientific"
  | "historical"
  | "literary"
  | "business"
  | "technical"
  | "legal_document"
  | "policy"
  | "financial"
  | "media_transcript"
  | "educational"
  | "news"
  | "creative"
  | "other";

export type CognitionComplexity = "low" | "medium" | "high";
export type CognitionDensity = "sparse" | "moderate" | "dense";
export type CognitionConfidence = "low" | "medium" | "high";

export type CognitionSourceKind =
  | "text"
  | "file"
  | "url"
  | "youtube"
  | "presentation"
  | "unknown";

export type CognitionPrimaryStructure =
  | "narrative"
  | "argument"
  | "reference"
  | "procedural"
  | "tabular"
  | "dialogue"
  | "slides"
  | "mixed"
  | "unknown";

export type CognitionLearningStyle =
  | "conceptual"
  | "procedural"
  | "narrative"
  | "evaluative"
  | "reference"
  | "mixed";

export type CognitionRequiredThinking =
  | "summarize"
  | "explain"
  | "compare"
  | "evaluate"
  | "extract_facts"
  | "map_structure"
  | "identify_obligations"
  | "surface_risks"
  | "mixed";

/** Adaptive document profile used by persona + dimension resolvers. */
export type CognitionDocumentProfile = {
  domain: CognitionDomain;
  subType: string;
  complexity: CognitionComplexity;
  density: CognitionDensity;
  sourceKind: CognitionSourceKind;
  primaryStructure: CognitionPrimaryStructure;
  learningStyle: CognitionLearningStyle;
  requiredThinking: CognitionRequiredThinking;
  confidence: CognitionConfidence;
};

export type PersonaFamily =
  | "general"
  | "learning"
  | "research"
  | "business"
  | "creative"
  | "technical"
  | "legal_document"
  | "policy"
  | "media"
  | "productivity";

export type PersonaBrain = {
  id: string;
  family: PersonaFamily;
  goals: string[];
  priorities: string[];
  reasoningStyle: string;
  preferredOutputs: string[];
  learnCardBias: string[];
  depthPreference: "brief" | "standard" | "deep";
  riskSensitivity: "low" | "medium" | "high";
  actionOrientation: "low" | "medium" | "high";
  tone: string;
};

export type CognitiveDimension =
  | "key_concepts"
  | "causal_chain"
  | "chronology"
  | "definitions"
  | "formulas"
  | "mechanisms"
  | "methodology"
  | "evidence_quality"
  | "limitations"
  | "risks"
  | "obligations"
  | "stakeholders"
  | "decisions"
  | "action_items"
  | "narrative_structure"
  | "characters"
  | "themes"
  | "symbolism"
  | "creator_hooks"
  | "content_angles"
  | "audience_takeaways"
  | "technical_architecture"
  | "implementation_steps"
  | "metrics"
  | "tradeoffs"
  | "review_questions"
  | "memory_hooks";

export type ResolvedCognitiveDimensions = {
  primaryDimensions: CognitiveDimension[];
  secondaryDimensions: CognitiveDimension[];
  suppressedDimensions: CognitiveDimension[];
  rationale: string;
};

export type AdaptiveLearnCardType =
  | "definition"
  | "fact"
  | "cause_effect"
  | "chronology"
  | "formula"
  | "mechanism"
  | "method"
  | "evidence"
  | "risk"
  | "obligation"
  | "action"
  | "character"
  | "theme"
  | "symbol"
  | "metric"
  | "tradeoff"
  | "implementation"
  | "creator_hook"
  | "review_question"
  | "memory_hook";

export type LearnCardBiasResult = {
  preferredCardTypes: AdaptiveLearnCardType[];
  avoidedCardTypes: AdaptiveLearnCardType[];
  maxDensity: "light" | "standard" | "rich";
  rationale: string;
  /** Maps adaptive bias → existing JSON learn card types for prompt guidance. */
  providerTypeEmphasis: string;
};

export type CognitionContext = {
  documentProfile: CognitionDocumentProfile;
  personaBrain: PersonaBrain;
  dimensions: ResolvedCognitiveDimensions;
  learnCardBias: LearnCardBiasResult;
  promptBlock: string;
  debugSummary: string;
};
