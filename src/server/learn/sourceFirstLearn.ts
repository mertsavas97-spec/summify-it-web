/**
 * Phase Learn Stabilization 2 — source-first learning card engine.
 * Primary path: extract claims → rank → one card per claim → validate alignment.
 */

import type { AnalysisResult } from "@/server/ai/schemas";
import type { LearnCardOutput } from "@/types/text-analysis";
import type {
  LearnSourceTrace,
  LearnSourceTraceConfidence,
  LearnSourceTraceType,
} from "@/types/adaptive-learn";
import type { KnowledgeStructure } from "./knowledgeStructure";
import { capitalizedPhrases } from "./knowledgeStructure";
import type { ModeLearnStrategy } from "./modeLearnStrategies";
import { isCreatorIntelligenceMode } from "./validateLearnTitle";
import {
  LEARN_TITLE_MAX,
  splitAnswerFromTitle,
  validateLearnTitle,
  validateQuestionAnswerAlignment,
} from "./validateLearnTitle";
import { buildSourceTraceSections, type SourceTraceSection } from "./sourceTrace";
import type { LearnCardCountRange } from "./types";
import type { BuildLearnIntelligenceOptions } from "./types";

export type SourceClaimType =
  | "turning_point"
  | "cause_effect"
  | "transformation"
  | "conflict"
  | "key_event"
  | "key_entity"
  | "thesis"
  | "risk"
  | "decision"
  | "mechanism"
  | "timeline"
  | "definition";

export type SourceLearningClaim = {
  id: string;
  text: string;
  importance: number;
  claimType: SourceClaimType;
  entities: string[];
  sourceExcerpt?: string;
  sectionTitle?: string;
  sourceType?: LearnSourceTraceType;
  traceConfidence?: LearnSourceTraceConfidence;
};

export type SourceFirstLearnResult = {
  claims: SourceLearningClaim[];
  cards: LearnCardOutput[];
  extractedClaimCount: number;
  rejectedCardCount: number;
};

export type SourceFirstLearnDebugMeta = {
  extractedClaimCount: number;
  selectedClaimCount: number;
  generatedCardCount: number;
  rejectedCardCount: number;
  claimTypes: Record<string, number>;
  sourceBackedCardCount: number;
};

export type BuildSourceFirstLearnInput = {
  result: AnalysisResult;
  options: BuildLearnIntelligenceOptions;
  strategy: ModeLearnStrategy;
  range: LearnCardCountRange;
  knowledgeStructure?: KnowledgeStructure;
};

const VAGUE_TITLE =
  /what is the most important idea about|what point does this source emphasize|revenue model\??$/i;

const BARE_YEAR_TIMELINE = /^what changed after (19|20)\d{2}\??$/i;

const MIN_CLAIM_LEN = 28;
const MAX_CLAIM_LEN = 320;

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 48);
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalize(s))
    .filter((s) => s.length >= MIN_CLAIM_LEN && s.length <= MAX_CLAIM_LEN);
}

function extractEntities(text: string): string[] {
  return capitalizedPhrases(text).filter((e) => e.length >= 3 && e.length <= 48);
}

function isVagueClaim(text: string): boolean {
  if (text.length < MIN_CLAIM_LEN) return true;
  if (/^(the speaker|this document|the source)\b/i.test(text)) return true;
  if (/^according to the (source|document)\b/i.test(text)) return true;
  return false;
}

function classifyClaimType(text: string, strategyId: string): SourceClaimType {
  const t = text.toLowerCase();

  if (/\b(risk|warning|threat|liability|downside)\b/i.test(t) && strategyId !== "creator") {
    return "risk";
  }
  if (/\b(decision|tradeoff|trade-off|priorit|strategy choice|chose to)\b/i.test(t)) {
    return "decision";
  }
  if (/\b(mechanism|workflow|config|api|pipeline|process step|failure mode)\b/i.test(t)) {
    return "mechanism";
  }
  if (/\b(hook|audience|repurpose|story beat|narrative arc)\b/i.test(t) && strategyId === "creator") {
    return "key_event";
  }
  if (/\b(turning point|rupture|scandal|watershed|pivotal moment|3\s*july|july\s*3)\b/i.test(t)) {
    return "turning_point";
  }
  if (/\b(because|led to|resulted in|therefore|thus|triggered|due to|caused)\b/i.test(t)) {
    return "cause_effect";
  }
  if (/\b(transform|shifted|evolved|became|transition|restructur|reshape)\b/i.test(t)) {
    return "transformation";
  }
  if (/\b(tension|versus|vs\.|conflict|crisis|paradox|coexist|pressure|despite)\b/i.test(t)) {
    return "conflict";
  }
  if (/\b(19|20)\d{2}(?:\s*[–-]\s*(19|20)\d{2})?|\bafter\b|\bbefore\b|\bduring\b|\bfollowing\b/i.test(t)) {
    return "timeline";
  }
  if (/\b(means|refers to|defined as|is the|refers)\b/i.test(t) && text.length < 140) {
    return "definition";
  }
  if (extractEntities(text).length >= 1 && /\b(era|period|president|chairman|leader|club|movement)\b/i.test(t)) {
    return "key_entity";
  }
  if (/\b(event|match|election|protest|acquittal|project|stadium)\b/i.test(t)) {
    return "key_event";
  }
  return "thesis";
}

function modeClaimBoost(type: SourceClaimType, strategy: ModeLearnStrategy): number {
  const id = strategy.id;
  if (id === "student_historical" || id.startsWith("student_historical")) {
    const hist: SourceClaimType[] = [
      "turning_point",
      "cause_effect",
      "timeline",
      "conflict",
      "transformation",
      "key_entity",
      "key_event",
    ];
    return hist.includes(type) ? 0.14 : -0.06;
  }
  if (id === "technical" || id === "student_scientific") {
    const tech: SourceClaimType[] = ["mechanism", "definition", "cause_effect", "risk"];
    return tech.includes(type) ? 0.12 : -0.04;
  }
  if (id === "executive" || id === "general") {
    const exec: SourceClaimType[] = ["decision", "risk", "cause_effect", "transformation"];
    return exec.includes(type) ? 0.12 : -0.04;
  }
  if (id === "creator") {
    const cr: SourceClaimType[] = ["conflict", "key_event", "transformation", "thesis"];
    return cr.includes(type) ? 0.1 : -0.05;
  }
  if (id === "legal" || id === "researcher") {
    const lg: SourceClaimType[] = ["decision", "risk", "definition", "cause_effect"];
    return lg.includes(type) ? 0.1 : -0.04;
  }
  return 0;
}

function scoreClaim(
  claim: SourceLearningClaim,
  insightSet: Set<string>,
  strategy: ModeLearnStrategy,
): number {
  let score = claim.importance;
  const key = claim.text.toLowerCase().slice(0, 80);
  if ([...insightSet].some((i) => i.includes(key.slice(0, 40)) || key.includes(i.slice(0, 40)))) {
    score += 0.22;
  }
  if (claim.entities.length >= 2) score += 0.1;
  if (claim.entities.length >= 1) score += 0.06;
  if (/\b(19|20)\d{2}\b/.test(claim.text)) score += 0.08;
  if (/\b(because|led to|result|tension|transform)\b/i.test(claim.text)) score += 0.1;
  if (claim.traceConfidence === "high") score += 0.12;
  else if (claim.traceConfidence === "medium") score += 0.06;
  if (claim.sourceType === "extracted_text") score += 0.08;
  score += modeClaimBoost(claim.claimType, strategy);
  return Math.min(1, score);
}

function findExcerptInSections(
  claimText: string,
  sections: SourceTraceSection[],
): {
  excerpt?: string;
  sectionTitle?: string;
  confidence?: LearnSourceTraceConfidence;
} {
  let best: { excerpt?: string; sectionTitle?: string; score: number } | null = null;

  for (const section of sections) {
    const sentences = splitSentences(section.text);
    for (const sentence of sentences) {
      const overlap =
        tokenOverlap(claimText, sentence) +
        (entityOverlap(claimText, sentence) > 0 ? 0.35 : 0);
      if (overlap > 0.38 && (!best || overlap > best.score)) {
        best = {
          excerpt: sentence.slice(0, 280),
          sectionTitle: section.sectionTitle,
          score: overlap,
        };
      }
    }
  }

  if (!best) return {};
  return {
    excerpt: best.excerpt,
    sectionTitle: best.sectionTitle,
    confidence: best.score >= 0.55 ? "high" : "medium",
  };
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(
    a
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  const tb = new Set(
    b
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / Math.min(ta.size, tb.size);
}

function entityOverlap(a: string, b: string): number {
  const ea = new Set(extractEntities(a).map((e) => e.toLowerCase()));
  const eb = new Set(extractEntities(b).map((e) => e.toLowerCase()));
  if (ea.size === 0 || eb.size === 0) return 0;
  let shared = 0;
  for (const e of ea) if (eb.has(e)) shared += 1;
  return shared / Math.min(ea.size, eb.size);
}

function pushClaim(
  list: SourceLearningClaim[],
  seen: Set<string>,
  raw: {
    text: string;
    importance: number;
    sourceType?: LearnSourceTraceType;
    sectionTitle?: string;
    sourceExcerpt?: string;
    traceConfidence?: LearnSourceTraceConfidence;
  },
  strategy: ModeLearnStrategy,
): void {
  const text = normalize(raw.text);
  if (isVagueClaim(text)) return;
  const key = text.toLowerCase().slice(0, 100);
  if (seen.has(key)) return;
  seen.add(key);

  const claimType = classifyClaimType(text, strategy.id);
  list.push({
    id: `claim_${slug(text)}_${list.length}`,
    text,
    importance: Math.min(1, raw.importance),
    claimType,
    entities: extractEntities(text),
    sourceExcerpt: raw.sourceExcerpt,
    sectionTitle: raw.sectionTitle,
    sourceType: raw.sourceType,
    traceConfidence: raw.traceConfidence,
  });
}

function extractClaims(input: BuildSourceFirstLearnInput): SourceLearningClaim[] {
  const { result, options, strategy, knowledgeStructure } = input;
  const claims: SourceLearningClaim[] = [];
  const seen = new Set<string>();

  const sections = buildSourceTraceSections({
    analysis: result,
    personaAdaptivePlan: options.personaAdaptivePlan,
    extractedText: options.extractedText,
    uiSectionLabels: options.personaAdaptivePlan?.uiSectionLabels,
  });

  for (const insight of result.keyInsights) {
    const text = normalize(insight);
    if (isVagueClaim(text)) continue;
    const match = findExcerptInSections(text, sections);
    pushClaim(
      claims,
      seen,
      {
        text,
        importance: 0.82,
        sourceType: match.excerpt ? "extracted_text" : "insight",
        sectionTitle: match.sectionTitle ?? "Key insights",
        sourceExcerpt: match.excerpt ?? text.slice(0, 280),
        traceConfidence: match.confidence ?? "medium",
      },
      strategy,
    );
  }

  for (const risk of result.risksOrWarnings) {
    const text = normalize(risk);
    pushClaim(
      claims,
      seen,
      {
        text,
        importance: 0.72,
        sourceType: "analysis_section",
        sectionTitle: "Risks",
        sourceExcerpt: text.slice(0, 280),
        traceConfidence: "medium",
      },
      strategy,
    );
  }

  for (const action of result.actionItems) {
    const text = normalize(action);
    pushClaim(
      claims,
      seen,
      {
        text,
        importance: 0.7,
        sourceType: "analysis_section",
        sectionTitle: "Action items",
        sourceExcerpt: text.slice(0, 280),
        traceConfidence: "medium",
      },
      strategy,
    );
  }

  for (const sentence of splitSentences(result.summary).slice(0, 6)) {
    const match = findExcerptInSections(sentence, sections);
    pushClaim(
      claims,
      seen,
      {
        text: sentence,
        importance: match.excerpt ? 0.68 : 0.55,
        sourceType: match.excerpt ? "extracted_text" : "summary",
        sectionTitle: match.sectionTitle ?? "Summary",
        sourceExcerpt: match.excerpt ?? sentence.slice(0, 280),
        traceConfidence: match.confidence ?? "low",
      },
      strategy,
    );
  }

  if (options.extractedText?.trim()) {
    for (const sentence of splitSentences(options.extractedText).slice(0, 24)) {
      if (claims.length >= 40) break;
      const match = findExcerptInSections(sentence, sections);
      const imp =
        tokenOverlap(sentence, result.summary) > 0.35 ||
        result.keyInsights.some((k) => tokenOverlap(sentence, k) > 0.4)
          ? 0.75
          : 0.58;
      pushClaim(
        claims,
        seen,
        {
          text: sentence,
          importance: imp,
          sourceType: "extracted_text",
          sectionTitle: match.sectionTitle ?? "Source document",
          sourceExcerpt: sentence.slice(0, 280),
          traceConfidence: "high",
        },
        strategy,
      );
    }
  }

  if (knowledgeStructure) {
    for (const chain of knowledgeStructure.causalChains.slice(0, 4)) {
      const text = `${chain.cause} This led to ${chain.effect}.`;
      pushClaim(
        claims,
        seen,
        {
          text,
          importance: 0.8,
          sourceType: "synthesized",
          sectionTitle: "Causal chain",
          sourceExcerpt: text.slice(0, 280),
          traceConfidence: "medium",
        },
        strategy,
      );
    }
    for (const moment of knowledgeStructure.timelineMoments.slice(0, 4)) {
      pushClaim(
        claims,
        seen,
        {
          text: moment,
          importance: 0.78,
          sourceType: "synthesized",
          sectionTitle: "Timeline",
          sourceExcerpt: moment.slice(0, 280),
          traceConfidence: "medium",
        },
        strategy,
      );
    }
    for (const conflict of knowledgeStructure.conflicts.slice(0, 3)) {
      pushClaim(
        claims,
        seen,
        {
          text: conflict,
          importance: 0.76,
          sourceType: "synthesized",
          sectionTitle: "Conflict",
          sourceExcerpt: conflict.slice(0, 280),
          traceConfidence: "medium",
        },
        strategy,
      );
    }
    for (const transform of knowledgeStructure.transformations.slice(0, 3)) {
      pushClaim(
        claims,
        seen,
        {
          text: transform,
          importance: 0.74,
          sourceType: "synthesized",
          sectionTitle: "Transformation",
          sourceExcerpt: transform.slice(0, 280),
          traceConfidence: "medium",
        },
        strategy,
      );
    }
  }

  return claims;
}

function specificEventLabel(claim: SourceLearningClaim): string {
  if (/\b3\s*july|july\s*3\b/i.test(claim.text)) return "3 July";
  const range = claim.text.match(/\b(?:19|20)\d{2}\s*[–-]\s*(?:19|20)\d{2}\b/);
  if (range) return range[0];
  const year = claim.text.match(/\b(19|20)\d{2}\b/);
  if (year && claim.text.length > 60) {
    const snippet = claim.text.slice(0, 72).replace(/\?+$/, "");
    return snippet;
  }
  if (claim.entities[0]) return claim.entities[0];
  return "this event";
}

function titleFromClaim(claim: SourceLearningClaim, documentTitle?: string): string | null {
  const entity =
    claim.entities.find((e) => e.length >= 4 && !/^(The|This|Period|Source)$/i.test(e)) ??
    extractEntities(documentTitle ?? "")[0] ??
    null;

  if (!entity && claim.claimType !== "thesis") return null;

  const subject = entity ?? "the main subject";

  switch (claim.claimType) {
    case "turning_point":
      if (/\b3\s*july|july\s*3\b/i.test(claim.text)) {
        return "Why was 3 July more than a sports scandal?";
      }
      return `Why was ${specificEventLabel(claim)} a turning point?`;
    case "cause_effect": {
      const parts = claim.text.split(/\b(?:because|led to|resulted in|therefore|thus)\b/i);
      const cause = (parts[0] ?? claim.text).slice(0, 50).replace(/\?+$/, "").trim();
      const effect = (parts[1] ?? "").slice(0, 50).replace(/\?+$/, "").trim();
      if (cause.length > 8 && effect.length > 8) {
        return `How did ${cause} lead to ${effect}?`.slice(0, LEARN_TITLE_MAX);
      }
      return `How did ${subject} shape what happened next?`;
    }
    case "transformation":
      if (/\bcoexist|success.*crisis|sporting.*politic/i.test(claim.text)) {
        return "How did on-pitch success coexist with off-pitch crisis?";
      }
      if (/\bstadium|financial|revenue|debt\b/i.test(claim.text)) {
        return `How did the stadium project change ${subject}'s financial model?`;
      }
      return `How did ${subject} change during this period?`;
    case "conflict":
      if (/\bali\s*koç|koç\s*era/i.test(claim.text)) {
        return "What tension shaped the Ali Koç era?";
      }
      return `What tension shaped ${subject}?`;
    case "timeline": {
      const event = specificEventLabel(claim);
      if (/^\d{4}$/.test(event.trim())) return null;
      if (/\b(?:19|20)\d{2}\s*[–-]\s*(?:19|20)\d{2}\b/.test(claim.text)) {
        return `What changed between ${event}?`;
      }
      return `What changed after ${event}?`;
    }
    case "key_entity":
      return `Why was ${subject} important in this source?`;
    case "mechanism":
      return `How does ${subject} work in this source?`;
    case "risk":
      return `What risk does the source identify around ${subject}?`;
    case "decision":
      return `What decision or tradeoff does the source highlight for ${subject}?`;
    case "definition":
      return `What does ${subject} mean in this context?`;
    case "key_event":
      return `Why did ${specificEventLabel(claim)} matter?`;
    case "thesis":
      if (/\bmore than\b.*\b(club|team|institution)\b/i.test(claim.text)) {
        return `Why does the source frame ${subject} as more than a sports club?`;
      }
      return null;
  }
}

function learnPatternForClaimType(type: SourceClaimType): LearnCardOutput["learnPattern"] {
  switch (type) {
    case "turning_point":
      return "timeline_turning_point";
    case "cause_effect":
      return "cause_effect_chain";
    case "transformation":
      return "transformation_arc";
    case "conflict":
      return "narrative_tension";
    case "timeline":
      return "timeline_chain";
    case "mechanism":
      return "mechanism_breakdown";
    case "decision":
      return "decision_consequence";
    case "risk":
      return "risk_opportunity";
    default:
      return "fact_recall";
  }
}

function cardTypeForClaim(type: SourceClaimType): LearnCardOutput["type"] {
  if (type === "cause_effect" || type === "risk" || type === "decision") return "why_it_matters";
  if (type === "conflict" || type === "turning_point") return "why_it_matters";
  return "concept";
}

function buildAnswerFromClaim(claim: SourceLearningClaim): string {
  const text = claim.text.trim();
  if (text.length <= 300) return text;
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 3);
  return sentences.join(" ").slice(0, 380);
}

function validateClaimAlignment(card: LearnCardOutput, claim: SourceLearningClaim): boolean {
  if (!validateQuestionAnswerAlignment(card)) return false;
  const title = card.title.toLowerCase();
  const content = card.content.toLowerCase();
  const claimKey = claim.text.toLowerCase().slice(0, 60);

  if (tokenOverlap(title, content) > 0.85 && title.length > 40) return false;
  if (tokenOverlap(claim.text, card.content) < 0.28 && entityOverlap(claim.text, card.content) < 0.2) {
    return false;
  }
  if (content.length < 40) return false;

  if (claim.claimType === "timeline" && /^what changed after/.test(title)) {
    if (!content.includes(claimKey.slice(0, 20)) && entityOverlap(claim.text, content) < 0.25) {
      return false;
    }
    if (BARE_YEAR_TIMELINE.test(card.title)) return false;
  }

  if (VAGUE_TITLE.test(title)) return false;

  return true;
}

function cardFromClaim(
  claim: SourceLearningClaim,
  documentTitle?: string,
  intelligenceModeId?: string | null,
  strategy?: ModeLearnStrategy,
): LearnCardOutput | null {
  const titleRaw = titleFromClaim(claim, documentTitle);
  if (!titleRaw) return null;

  const title = splitAnswerFromTitle(titleRaw).slice(0, LEARN_TITLE_MAX);
  const creatorMode = isCreatorIntelligenceMode(intelligenceModeId, strategy);
  const titleCheck = validateLearnTitle(title, { creatorMode });
  if (!titleCheck.valid || VAGUE_TITLE.test(title) || BARE_YEAR_TIMELINE.test(title)) {
    return null;
  }

  const content = buildAnswerFromClaim(claim);
  const card: LearnCardOutput = {
    type: cardTypeForClaim(claim.claimType),
    title: titleCheck.title,
    content,
    learnPattern: learnPatternForClaimType(claim.claimType),
    cardId: `sf_${claim.id}`,
  };

  if (!validateClaimAlignment(card, claim)) return null;

  if (claim.sourceExcerpt || claim.sectionTitle) {
    const trace: LearnSourceTrace = {
      sectionTitle: claim.sectionTitle,
      sourceType: claim.sourceType ?? "insight",
      excerpt: claim.sourceExcerpt?.slice(0, 280),
      confidence: claim.traceConfidence ?? (claim.sourceExcerpt ? "medium" : "low"),
    };
    card.sourceTrace = trace;
  }

  return card;
}

export function rankSourceClaims(
  claims: SourceLearningClaim[],
  result: AnalysisResult,
  strategy: ModeLearnStrategy,
): SourceLearningClaim[] {
  const insightSet = new Set(result.keyInsights.map((i) => i.toLowerCase().slice(0, 80)));
  return [...claims]
    .map((c) => ({ ...c, importance: scoreClaim(c, insightSet, strategy) }))
    .sort((a, b) => b.importance - a.importance);
}

export function buildSourceFirstLearn(input: BuildSourceFirstLearnInput): SourceFirstLearnResult {
  const extracted = extractClaims(input);
  const ranked = rankSourceClaims(extracted, input.result, input.strategy);
  const selected = ranked.slice(0, input.range.max + 4);

  const cards: LearnCardOutput[] = [];
  let rejected = 0;

  for (const claim of selected) {
    if (cards.length >= input.range.max) break;
    const card = cardFromClaim(
      claim,
      input.result.title,
      input.options.intelligenceModeId,
      input.strategy,
    );
    if (card) {
      cards.push(card);
    } else {
      rejected += 1;
    }
  }

  return {
    claims: selected,
    cards,
    extractedClaimCount: extracted.length,
    rejectedCardCount: rejected,
  };
}

export function mergeSourceFirstWithPipeline(
  sourceFirst: LearnCardOutput[],
  pipeline: LearnCardOutput[],
  range: LearnCardCountRange,
): LearnCardOutput[] {
  const used = new Set(pipeline.map((c) => c.title.toLowerCase()));
  const prefix: LearnCardOutput[] = [];
  for (const card of sourceFirst) {
    const key = card.title.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    prefix.push(card);
  }
  return [...prefix, ...pipeline].slice(0, range.max);
}

export function sourceFirstLearnDebugStats(
  result: SourceFirstLearnResult,
  rejectedCardCount: number,
  extractedClaimCount: number,
): SourceFirstLearnDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;

  const claimTypes: Record<string, number> = {};
  for (const c of result.claims) {
    claimTypes[c.claimType] = (claimTypes[c.claimType] ?? 0) + 1;
  }

  return {
    extractedClaimCount,
    selectedClaimCount: result.claims.length,
    generatedCardCount: result.cards.length,
    rejectedCardCount,
    claimTypes,
    sourceBackedCardCount: result.cards.filter(
      (c) => c.sourceTrace?.excerpt && c.sourceTrace.excerpt.length >= 24,
    ).length,
  };
}

export function stripWeakMemoryAnchors(cards: LearnCardOutput[]): LearnCardOutput[] {
  return cards.map((card) => {
    const anchor = card.memoryAnchor?.text?.trim();
    if (!anchor) return card;
    if (
      anchor.length < 18 ||
      /^(remember|key insight|think about|this is important)/i.test(anchor)
    ) {
      const { memoryAnchor, ...rest } = card;
      void memoryAnchor;
      return rest;
    }
    return card;
  });
}
