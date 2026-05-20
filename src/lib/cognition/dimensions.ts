import type {
  CognitiveDimension,
  CognitionDocumentProfile,
  PersonaBrain,
  ResolvedCognitiveDimensions,
} from "@/types/cognition";

const ALL_DIMENSIONS: CognitiveDimension[] = [
  "key_concepts",
  "causal_chain",
  "chronology",
  "definitions",
  "formulas",
  "mechanisms",
  "methodology",
  "evidence_quality",
  "limitations",
  "risks",
  "obligations",
  "stakeholders",
  "decisions",
  "action_items",
  "narrative_structure",
  "characters",
  "themes",
  "symbolism",
  "creator_hooks",
  "content_angles",
  "audience_takeaways",
  "technical_architecture",
  "implementation_steps",
  "metrics",
  "tradeoffs",
  "review_questions",
  "memory_hooks",
];

const DOMAIN_PRIMARY: Partial<Record<CognitionDocumentProfile["domain"], CognitiveDimension[]>> = {
  academic: ["key_concepts", "definitions", "review_questions", "memory_hooks"],
  scientific: ["definitions", "mechanisms", "formulas", "methodology", "evidence_quality"],
  historical: ["chronology", "causal_chain", "key_concepts", "stakeholders"],
  literary: ["characters", "themes", "symbolism", "narrative_structure"],
  business: ["decisions", "metrics", "tradeoffs", "stakeholders", "risks"],
  technical: ["technical_architecture", "implementation_steps", "definitions", "mechanisms"],
  legal_document: ["obligations", "risks", "definitions", "stakeholders"],
  policy: ["obligations", "definitions", "risks", "limitations"],
  financial: ["metrics", "risks", "definitions", "tradeoffs"],
  media_transcript: ["narrative_structure", "creator_hooks", "audience_takeaways", "key_concepts"],
  educational: ["key_concepts", "definitions", "review_questions", "memory_hooks"],
  news: ["chronology", "key_concepts", "stakeholders", "evidence_quality"],
  creative: ["themes", "narrative_structure", "content_angles", "creator_hooks"],
};

const FAMILY_PRIMARY: Partial<Record<PersonaBrain["family"], CognitiveDimension[]>> = {
  learning: ["definitions", "key_concepts", "review_questions", "memory_hooks"],
  research: ["evidence_quality", "methodology", "limitations", "key_concepts"],
  business: ["decisions", "risks", "metrics", "action_items"],
  creative: ["creator_hooks", "content_angles", "narrative_structure"],
  media: ["creator_hooks", "audience_takeaways", "narrative_structure"],
  legal_document: ["obligations", "risks", "definitions", "action_items"],
  policy: ["obligations", "definitions", "risks", "limitations"],
  productivity: ["action_items", "decisions", "chronology"],
  technical: ["technical_architecture", "implementation_steps", "definitions"],
};

const PAIR_BOOST: Array<{
  when: (p: PersonaBrain, d: CognitionDocumentProfile) => boolean;
  add: CognitiveDimension[];
  rationale: string;
}> = [
  {
    when: (p, d) => p.id === "the-student" && d.domain === "historical",
    add: ["chronology", "causal_chain", "review_questions"],
    rationale: "Student + historical → timeline and causality for study",
  },
  {
    when: (p, d) => p.id === "the-student" && d.domain === "scientific",
    add: ["definitions", "mechanisms", "formulas"],
    rationale: "Student + scientific → mechanisms and notation",
  },
  {
    when: (p, d) => p.id === "the-student" && d.domain === "literary",
    add: ["characters", "themes", "symbolism"],
    rationale: "Student + literary → narrative elements",
  },
  {
    when: (p, d) => p.id === "the-creator" && d.domain === "media_transcript",
    add: ["creator_hooks", "content_angles", "audience_takeaways"],
    rationale: "Creator + transcript → repurposing angles",
  },
  {
    when: (p, d) => p.family === "business" && d.domain === "business",
    add: ["decisions", "metrics", "tradeoffs"],
    rationale: "Executive/business lens on business documents",
  },
  {
    when: (p, d) => p.id === "contract-analyzer" || d.domain === "legal_document",
    add: ["obligations", "risks", "definitions"],
    rationale: "Contract/policy informational summary",
  },
];

function unique(list: CognitiveDimension[]): CognitiveDimension[] {
  return [...new Set(list)];
}

export function resolveCognitiveDimensions(
  personaBrain: PersonaBrain,
  documentProfile: CognitionDocumentProfile,
): ResolvedCognitiveDimensions {
  const primary = unique([
    ...(DOMAIN_PRIMARY[documentProfile.domain] ?? ["key_concepts"]),
    ...(FAMILY_PRIMARY[personaBrain.family] ?? []),
  ]).slice(0, 8);

  const secondary: CognitiveDimension[] = [];
  const rationales: string[] = [
    `Domain ${documentProfile.domain} + persona ${personaBrain.id} (${personaBrain.family}).`,
  ];

  for (const rule of PAIR_BOOST) {
    if (rule.when(personaBrain, documentProfile)) {
      for (const dim of rule.add) {
        if (!primary.includes(dim)) secondary.push(dim);
      }
      rationales.push(rule.rationale);
    }
  }

  const mergedPrimary = unique([...primary, ...secondary.splice(0, 2)]);
  const secondaryFinal = unique([
    ...secondary,
    "limitations",
    "memory_hooks",
  ]).filter((d) => !mergedPrimary.includes(d)).slice(0, 5);

  const suppressed = ALL_DIMENSIONS.filter(
    (d) => !mergedPrimary.includes(d) && !secondaryFinal.includes(d),
  ).slice(0, 12);

  if (documentProfile.domain === "legal_document" || documentProfile.domain === "policy") {
    rationales.push("Regulated-document framing: informational summary only.");
  }

  return {
    primaryDimensions: mergedPrimary,
    secondaryDimensions: secondaryFinal,
    suppressedDimensions: suppressed,
    rationale: rationales.join(" "),
  };
}
