import type {
  AdaptiveLearnCardType,
  CognitionDocumentProfile,
  LearnCardBiasResult,
  PersonaBrain,
  ResolvedCognitiveDimensions,
} from "@/types/cognition";

const DOMAIN_PREFERRED: Partial<
  Record<CognitionDocumentProfile["domain"], AdaptiveLearnCardType[]>
> = {
  historical: ["chronology", "cause_effect", "fact", "memory_hook", "review_question"],
  scientific: ["definition", "mechanism", "formula", "method", "review_question"],
  literary: ["character", "theme", "symbol", "cause_effect"],
  legal_document: ["obligation", "risk", "definition", "action"],
  policy: ["obligation", "definition", "risk"],
  business: ["metric", "tradeoff", "action", "risk"],
  financial: ["metric", "fact", "risk", "definition"],
  media_transcript: ["creator_hook", "fact", "chronology", "memory_hook"],
  educational: ["definition", "review_question", "memory_hook", "fact"],
  academic: ["definition", "review_question", "cause_effect", "memory_hook"],
  creative: ["creator_hook", "theme", "character"],
};

const STUDY_PERSONA_MEDIA_PREFERRED: AdaptiveLearnCardType[] = [
  "definition",
  "formula",
  "mechanism",
  "review_question",
  "memory_hook",
  "fact",
];

const DOMAIN_AVOIDED: Partial<
  Record<CognitionDocumentProfile["domain"], AdaptiveLearnCardType[]>
> = {
  legal_document: ["creator_hook", "theme"],
  policy: ["creator_hook", "symbol"],
  scientific: ["creator_hook", "character"],
  historical: ["implementation", "metric"],
  educational: ["creator_hook", "metric"],
  academic: ["creator_hook", "metric"],
};

function isLearningPersona(personaBrain: PersonaBrain): boolean {
  return (
    personaBrain.family === "learning" ||
    personaBrain.id === "the-student" ||
    personaBrain.id === "exam-prep"
  );
}

function mapAdaptiveToProviderGuidance(preferred: AdaptiveLearnCardType[]): string {
  const hints: string[] = [];
  const has = (t: AdaptiveLearnCardType) => preferred.includes(t);

  if (
    has("definition") ||
    has("fact") ||
    has("mechanism") ||
    has("formula") ||
    has("method") ||
    has("evidence")
  ) {
    hints.push("concept");
  }
  if (
    has("obligation") ||
    has("risk") ||
    has("action") ||
    has("tradeoff") ||
    has("metric") ||
    has("cause_effect")
  ) {
    hints.push("why");
  }
  if (
    has("memory_hook") ||
    has("creator_hook") ||
    has("character") ||
    has("theme") ||
    has("symbol") ||
    has("chronology")
  ) {
    hints.push("memory_hook");
  }
  if (has("review_question") || has("fact")) {
    hints.push("quiz");
  }

  const unique = [...new Set(hints)];
  return unique.length > 0
    ? `Emphasize learnCards types: ${unique.join(", ")} (same JSON schema).`
    : "Use concept, why, memory_hook, and quiz as appropriate.";
}

export function resolveLearnCardBias(
  personaBrain: PersonaBrain,
  documentProfile: CognitionDocumentProfile,
  dimensions: ResolvedCognitiveDimensions,
): LearnCardBiasResult {
  const domainPreferred =
    isLearningPersona(personaBrain) && documentProfile.domain === "media_transcript"
      ? STUDY_PERSONA_MEDIA_PREFERRED
      : (DOMAIN_PREFERRED[documentProfile.domain] ?? []);

  const preferred = [
    ...personaBrain.learnCardBias.map((s) => s as AdaptiveLearnCardType),
    ...domainPreferred,
  ];

  if (dimensions.primaryDimensions.includes("chronology")) preferred.push("chronology");
  if (dimensions.primaryDimensions.includes("obligations")) preferred.push("obligation");
  // Creator hooks only when not on a Study persona (lecture YouTube must not skew creator).
  if (
    dimensions.primaryDimensions.includes("creator_hooks") &&
    !isLearningPersona(personaBrain)
  ) {
    preferred.push("creator_hook");
  }

  const preferredUnique = [...new Set(preferred)].slice(0, 10);
  const avoided = [
    ...new Set([
      ...(DOMAIN_AVOIDED[documentProfile.domain] ?? []),
      ...(isLearningPersona(personaBrain) ? (["creator_hook", "metric"] as AdaptiveLearnCardType[]) : []),
    ]),
  ];

  const maxDensity: LearnCardBiasResult["maxDensity"] =
    documentProfile.density === "dense" || personaBrain.depthPreference === "deep"
      ? "rich"
      : documentProfile.density === "sparse"
        ? "light"
        : "standard";

  return {
    preferredCardTypes: preferredUnique,
    avoidedCardTypes: avoided,
    maxDensity,
    rationale: `Persona ${personaBrain.id} × ${documentProfile.domain} → ${preferredUnique.slice(0, 5).join(", ")}.`,
    providerTypeEmphasis: mapAdaptiveToProviderGuidance(preferredUnique),
  };
}
