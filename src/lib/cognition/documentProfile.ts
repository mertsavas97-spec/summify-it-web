import type {
  CognitionComplexity,
  CognitionConfidence,
  CognitionDensity,
  CognitionDocumentProfile,
  CognitionDomain,
  CognitionLearningStyle,
  CognitionPrimaryStructure,
  CognitionRequiredThinking,
  CognitionSourceKind,
} from "@/types/cognition";
import type { IntelligenceModeId } from "@/types/modes";

export type ClassifyDocumentProfileInput = {
  sourceKind?: CognitionSourceKind;
  title?: string;
  textSnippet: string;
  modeId?: IntelligenceModeId;
  heuristicTypeGuess?: string;
  complexityHint?: CognitionComplexity;
};

const DOMAIN_KEYWORDS: Record<CognitionDomain, RegExp[]> = {
  general: [],
  academic: [
    /\b(lecture|syllabus|course|assignment|exam|chapter|textbook)\b/i,
    /\b(thesis|dissertation|seminar)\b/i,
  ],
  scientific: [
    /\b(hypothesis|methodology|experiment|dataset|peer[- ]review|abstract)\b/i,
    /\b(molecule|cell|genome|clinical trial|p[- ]value)\b/i,
  ],
  historical: [
    /\b(century|dynasty|empire|revolution|treaty|archaeolog)\b/i,
    /\b(world war|cold war|colonial)\b/i,
  ],
  literary: [
    /\b(protagonist|metaphor|stanza|narrator|symbolism|chapter)\b/i,
    /\b(novel|poem|playwright|literary)\b/i,
  ],
  business: [
    /\b(revenue|margin|go-to-market|stakeholder|okr|kpi|roadmap)\b/i,
    /\b(quarterly|board|investor|strategy)\b/i,
  ],
  technical: [
    /\b(api|kubernetes|database|function|algorithm|deploy|repository)\b/i,
    /\b(architecture|stack|latency|throughput)\b/i,
  ],
  legal_document: [
    /\b(whereas|hereby|indemnif|liability|jurisdiction|arbitration)\b/i,
    /\b(agreement|contract|party|clause|termination)\b/i,
  ],
  policy: [
    /\b(pursuant|regulation|compliance|statute|ordinance|policy)\b/i,
    /\b(gdpr|hipaa|sec filing)\b/i,
  ],
  financial: [
    /\b(ebitda|balance sheet|dividend|portfolio|sec 10-k|fiscal)\b/i,
    /\b(interest rate|bond|equity|valuation)\b/i,
  ],
  media_transcript: [
    /\b(transcript|timestamp|episode|host|guest|subscribe)\b/i,
    /\b(\[\d{1,2}:\d{2}\])\b/,
  ],
  educational: [
    /\b(lesson|learning objective|curriculum|module|quiz)\b/i,
    /\b(instructor|student|worksheet)\b/i,
  ],
  news: [
    /\b(breaking|reported|according to sources|correspondent)\b/i,
    /\b(journalist|headline|press release)\b/i,
  ],
  creative: [
    /\b(storyboard|creative brief|campaign|brand voice)\b/i,
  ],
  other: [],
};

function scoreDomains(text: string, title: string): Map<CognitionDomain, number> {
  const haystack = `${title}\n${text}`.toLowerCase();
  const scores = new Map<CognitionDomain, number>();

  for (const [domain, patterns] of Object.entries(DOMAIN_KEYWORDS) as [
    CognitionDomain,
    RegExp[],
  ][]) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(haystack)) score += 1;
    }
    if (score > 0) scores.set(domain, score);
  }

  return scores;
}

function mapHeuristicTypeToDomain(guess?: string): CognitionDomain | null {
  if (!guess || guess === "unknown") return null;
  const map: Record<string, CognitionDomain> = {
    presentation_deck: "business",
    pitch_deck: "business",
    lecture_deck: "educational",
    report_deck: "business",
    marketing_deck: "business",
    strategy_deck: "business",
    business_report: "business",
    research_paper: "scientific",
    legal_contract: "legal_document",
    policy_document: "policy",
    meeting_notes: "business",
    educational_material: "educational",
    article: "news",
    creator_brief: "creative",
    video_transcript: "media_transcript",
    podcast_transcript: "media_transcript",
    lecture_transcript: "educational",
    interview_transcript: "media_transcript",
    tutorial_transcript: "educational",
  };
  return map[guess] ?? null;
}

function inferSourceKind(
  sourceKind?: CognitionSourceKind,
): CognitionSourceKind {
  return sourceKind ?? "unknown";
}

function inferStructure(
  domain: CognitionDomain,
  sourceKind: CognitionSourceKind,
  text: string,
): CognitionPrimaryStructure {
  if (sourceKind === "presentation") return "slides";
  if (sourceKind === "youtube") return "dialogue";
  if (domain === "legal_document" || domain === "policy") return "reference";
  if (domain === "historical") return "narrative";
  if (domain === "scientific" || domain === "academic") return "argument";
  if (/\b(step \d|first,|second,|then\b)/i.test(text)) return "procedural";
  if (domain === "business") return "mixed";
  return "mixed";
}

function inferDensity(charCount: number): CognitionDensity {
  if (charCount < 2_500) return "sparse";
  if (charCount < 12_000) return "moderate";
  return "dense";
}

function inferComplexity(
  hint?: CognitionComplexity,
  density?: CognitionDensity,
): CognitionComplexity {
  if (hint) return hint;
  if (density === "dense") return "high";
  if (density === "sparse") return "low";
  return "medium";
}

function inferLearningStyle(domain: CognitionDomain): CognitionLearningStyle {
  switch (domain) {
    case "scientific":
    case "academic":
    case "educational":
      return "conceptual";
    case "technical":
      return "procedural";
    case "historical":
    case "literary":
    case "creative":
    case "media_transcript":
      return "narrative";
    case "legal_document":
    case "policy":
    case "financial":
    case "business":
      return "evaluative";
    case "news":
      return "reference";
    default:
      return "mixed";
  }
}

function inferRequiredThinking(
  domain: CognitionDomain,
  modeId?: IntelligenceModeId,
): CognitionRequiredThinking {
  if (modeId === "contract-analyzer" || modeId === "policy-interpreter") {
    return "identify_obligations";
  }
  if (modeId === "timeline-builder") return "map_structure";
  if (domain === "legal_document" || domain === "policy") return "identify_obligations";
  if (domain === "business" || domain === "financial") return "evaluate";
  if (domain === "scientific" || domain === "academic") return "explain";
  if (domain === "historical") return "map_structure";
  return "summarize";
}

function inferSubType(domain: CognitionDomain, title: string, guess?: string): string {
  if (guess && guess !== "unknown") return guess.replace(/_/g, " ");
  if (title.trim()) return title.trim().slice(0, 80);
  return domain === "general" ? "unspecified" : domain.replace(/_/g, " ");
}

function modeDomainHint(modeId?: IntelligenceModeId): CognitionDomain | null {
  if (!modeId) return null;
  if (modeId === "contract-analyzer" || modeId === "technical-decoder") return "legal_document";
  if (modeId === "policy-interpreter") return "policy";
  if (
    modeId === "the-student" ||
    modeId === "exam-prep" ||
    modeId === "flashcard-builder" ||
    modeId === "quiz-generator" ||
    modeId === "concept-explainer"
  ) {
    return "academic";
  }
  if (
    modeId === "the-creator" ||
    modeId === "the-journalist" ||
    modeId === "podcast-summary" ||
    modeId === "youtube-intelligence" ||
    modeId === "script-breakdown"
  ) {
    return "media_transcript";
  }
  if (modeId === "narrative-explorer") return "literary";
  if (modeId === "timeline-builder") return "historical";
  return null;
}

/**
 * Deterministic document profiler (no extra LLM call).
 */
export function classifyDocumentProfile(
  input: ClassifyDocumentProfileInput,
): CognitionDocumentProfile {
  const snippet = input.textSnippet.slice(0, 8_000);
  const title = input.title?.trim() ?? "";
  const sourceKind = inferSourceKind(input.sourceKind);
  const scores = scoreDomains(snippet, title);

  const heuristicDomain = mapHeuristicTypeToDomain(input.heuristicTypeGuess);
  const modeHint = modeDomainHint(input.modeId);

  if (sourceKind === "youtube") {
    scores.set("media_transcript", (scores.get("media_transcript") ?? 0) + 3);
  }
  if (sourceKind === "presentation") {
    scores.set("business", (scores.get("business") ?? 0) + 2);
  }
  if (heuristicDomain) {
    scores.set(heuristicDomain, (scores.get(heuristicDomain) ?? 0) + 2);
  }
  if (modeHint) {
    scores.set(modeHint, (scores.get(modeHint) ?? 0) + 1);
  }

  let domain: CognitionDomain = "general";
  let best = 0;
  for (const [d, s] of scores) {
    if (s > best) {
      best = s;
      domain = d;
    }
  }

  const density = inferDensity(snippet.length);
  const complexity = inferComplexity(input.complexityHint, density);
  let confidence: CognitionConfidence = "medium";
  if (best >= 3) confidence = "high";
  else if (best <= 0) confidence = "low";

  return {
    domain,
    subType: inferSubType(domain, title, input.heuristicTypeGuess),
    complexity,
    density,
    sourceKind,
    primaryStructure: inferStructure(domain, sourceKind, snippet),
    learningStyle: inferLearningStyle(domain),
    requiredThinking: inferRequiredThinking(domain, input.modeId),
    confidence,
  };
}
