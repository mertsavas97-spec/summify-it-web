/**
 * Phase Learn 6.2 — knowledge compression & anti-redundancy engine.
 */

import type { LearnKnowledgeCompressionDebugMeta } from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import { resolveCardStrategyPattern } from "./modeLearnStrategies";
import type { KnowledgeStructure } from "./knowledgeStructure";
import {
  capitalizedPhrases,
  isWeakGenericLearnTitle,
  tokenize,
} from "./knowledgeStructure";
import type { LearnCandidate } from "./types";

/** Pipeline learn card (candidate stage). */
export type LearnCard = LearnCandidate;

export type KnowledgeCompressionResult<T = LearnCard> = {
  keptCards: T[];
  removedCards: T[];
  compressedClusters: Array<{
    clusterId: string;
    topic: string;
    removedCardIds: string[];
    keptCardId: string;
  }>;
  semanticRegions: Array<{
    label: string;
    cardIds: string[];
  }>;
};

export type CompressionStats = {
  originalCardCount: number;
  compressedCardCount: number;
  removedSemanticDuplicates: number;
  mergedCardCount: number;
  semanticRegionCount: number;
  averageKnowledgeDensity: number;
  averageIdeaUniqueness: number;
};

type CompressibleCard = {
  kind?: LearnCandidate["kind"];
  type?: string;
  title: string;
  content: string;
  importance?: number;
  entities?: string[];
  learnPattern?: string;
  groupTitle?: string;
  cardId?: string;
  source?: string;
};

type UniquenessContext = {
  fingerprints: Set<string>[];
  entities: Set<string>;
  patterns: Set<string>;
  narrativeRoles: Set<string>;
  regionLabels: Set<string>;
  causalKeys: Set<string>;
};

const REGION_MERGE_THRESHOLD = 0.38;
const TITLE_SIM_THRESHOLD = 0.55;
const NARRATIVE_MARKERS: Array<{ role: string; re: RegExp }> = [
  { role: "rise", re: /\b(rise|rising|growth|surge|expansion)\b/i },
  { role: "collapse", re: /\b(collapse|fall|decline|crisis|bankrupt)\b/i },
  { role: "resistance", re: /\b(resistance|protest|opposition|backlash)\b/i },
  { role: "recovery", re: /\b(recovery|rebound|renewal|revival)\b/i },
  { role: "instability", re: /\b(instability|volatile|turmoil|uncertain)\b/i },
  { role: "transformation", re: /\b(transform|shift|evolv|became|reform)\b/i },
  { role: "strategic_shift", re: /\b(strategy|pivot|restructur|realign)\b/i },
];

const CAUSAL_RE = /\b(because|led to|resulted in|triggered|therefore|thus|due to)\b/i;
const CONTRAST_RE = /\b(versus|vs\.|while|whereas|however|despite|contrast|contradiction)\b/i;
const TRANSFORM_RE = /\b(transform|shift|evolv|became|transition|turning point)\b/i;
const TIMELINE_RE = /\b(after|before|during|\d{4}|following|subsequently)\b/i;

const COVERAGE_BUCKETS = [
  "chronology",
  "causality",
  "conflict",
  "transformation",
  "entities",
  "themes",
  "implications",
] as const;

type CoverageBucket = (typeof COVERAGE_BUCKETS)[number];

const VERBOSE_PHRASES = [
  /\baccording to the source\b/gi,
  /\bthe source (emphasizes|highlights|suggests|states)\b/gi,
  /\bit is (important|worth) (to note|noting)\b/gi,
  /\bin this (context|analysis|document)\b/gi,
  /\bthe (speaker|video|presenter) (discusses|explains)\b/gi,
];

function cardText(c: CompressibleCard): string {
  return `${c.title} ${c.content}`;
}

function stableId(c: CompressibleCard, index: number): string {
  return c.cardId ?? `card_${index}_${c.kind ?? c.type ?? "x"}`;
}

function fingerprint(text: string): Set<string> {
  return new Set(tokenize(text));
}

function entitySet(text: string): Set<string> {
  return new Set(capitalizedPhrases(text).map((e) => e.toLowerCase()));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) {
    if (b.has(t)) shared += 1;
  }
  return shared / Math.min(a.size, b.size);
}

function titleSimilarity(a: string, b: string): number {
  const na = a.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (na === nb) return 1;
  const ta = new Set(na.split(/\s+/).filter((w) => w.length > 3));
  const tb = new Set(nb.split(/\s+/).filter((w) => w.length > 3));
  return jaccard(ta, tb);
}

function narrativeRole(text: string): string | null {
  for (const { role, re } of NARRATIVE_MARKERS) {
    if (re.test(text)) return role;
  }
  return null;
}

function causalKey(text: string): string | null {
  if (!CAUSAL_RE.test(text)) return null;
  const ents = capitalizedPhrases(text).slice(0, 2).join("_").toLowerCase();
  const verbs = tokenize(text).filter((t) => /led|cause|result|trigger|because/.test(t));
  return `${ents}:${verbs.slice(0, 2).join("_")}` || null;
}

function coverageBucket(c: CompressibleCard): CoverageBucket {
  const text = cardText(c).toLowerCase();
  const pattern = c.learnPattern ?? resolveCardStrategyPattern(c as LearnCandidate);

  if (TIMELINE_RE.test(text) || pattern.includes("timeline")) return "chronology";
  if (CAUSAL_RE.test(text) || pattern.includes("cause") || pattern.includes("causal")) {
    return "causality";
  }
  if (/\b(conflict|tension|crisis|pressure|versus|despite)\b/i.test(text) || pattern.includes("conflict")) {
    return "conflict";
  }
  if (TRANSFORM_RE.test(text) || pattern.includes("transform")) return "transformation";
  if (capitalizedPhrases(text).length >= 2) return "entities";
  if (c.kind === "why_it_matters" || pattern.includes("implication")) return "implications";
  return "themes";
}

/** High-signal cards: causality, contrast, transformation, multi-entity links. */
export function calculateKnowledgeDensity(card: CompressibleCard): number {
  const text = cardText(card);
  const len = text.length;
  let score = 0.28;

  if (CAUSAL_RE.test(text)) score += 0.18;
  if (CONTRAST_RE.test(text)) score += 0.16;
  if (TRANSFORM_RE.test(text)) score += 0.14;
  if (TIMELINE_RE.test(text)) score += 0.1;
  if (narrativeRole(text)) score += 0.08;

  const ents = capitalizedPhrases(text);
  if (ents.length >= 2) score += 0.12;
  if (ents.length >= 3) score += 0.06;

  if (card.learnPattern && /cause|contrast|timeline|narrative|transform|conflict/i.test(card.learnPattern)) {
    score += 0.1;
  }

  if (isWeakGenericLearnTitle(card.title)) score -= 0.22;
  if (/^(what defines|what is the|major|broader)\b/i.test(card.title)) score -= 0.15;
  if (len < 60) score -= 0.12;
  if (len > 340) score -= 0.08;
  if (card.source === "summary" && len < 120) score -= 0.1;

  return Math.max(0.05, Math.min(1, score));
}

/** Novelty vs cards already retained in this compression pass. */
export function calculateIdeaUniquenessScore(
  card: CompressibleCard,
  context: UniquenessContext,
): number {
  const text = cardText(card);
  const fp = fingerprint(text);
  const ents = entitySet(text);
  const pattern = card.learnPattern ?? resolveCardStrategyPattern(card as LearnCandidate);
  const role = narrativeRole(text);
  const causal = causalKey(text);

  let score = 0.55;

  let maxFpOverlap = 0;
  for (const kept of context.fingerprints) {
    maxFpOverlap = Math.max(maxFpOverlap, jaccard(fp, kept));
  }
  score += (1 - maxFpOverlap) * 0.22;

  let newEntities = 0;
  for (const e of ents) {
    if (!context.entities.has(e)) newEntities += 1;
  }
  score += Math.min(0.18, newEntities * 0.06);

  if (!context.patterns.has(pattern)) score += 0.08;
  if (role && !context.narrativeRoles.has(role)) score += 0.1;
  if (causal && !context.causalKeys.has(causal)) score += 0.1;

  const region = card.groupTitle ?? ents.values().next().value ?? "";
  if (region && context.regionLabels.has(region.toLowerCase())) score -= 0.2;

  if (maxFpOverlap > 0.72) score -= 0.25;
  if (isWeakGenericLearnTitle(card.title)) score -= 0.2;

  return Math.max(0.05, Math.min(1, score));
}

function combinedRetentionScore(card: CompressibleCard, context: UniquenessContext): number {
  const importance = card.importance ?? 0.5;
  const density = calculateKnowledgeDensity(card);
  const uniqueness = calculateIdeaUniquenessScore(card, context);
  return importance * 0.35 + density * 0.4 + uniqueness * 0.25;
}

function registerKept(context: UniquenessContext, card: CompressibleCard): void {
  context.fingerprints.push(fingerprint(cardText(card)));
  for (const e of entitySet(cardText(card))) context.entities.add(e);
  const pattern = card.learnPattern ?? resolveCardStrategyPattern(card as LearnCandidate);
  context.patterns.add(pattern);
  const role = narrativeRole(cardText(card));
  if (role) context.narrativeRoles.add(role);
  const ck = causalKey(cardText(card));
  if (ck) context.causalKeys.add(ck);
  const region = card.groupTitle ?? "";
  if (region) context.regionLabels.add(region.toLowerCase());
}

function regionSimilarity(a: CompressibleCard, b: CompressibleCard): number {
  const fpA = fingerprint(cardText(a));
  const fpB = fingerprint(cardText(b));
  const entA = entitySet(cardText(a));
  const entB = entitySet(cardText(b));

  let score = jaccard(fpA, fpB) + jaccard(entA, entB) * 0.25;
  score += titleSimilarity(a.title, b.title) * 0.2;

  if (a.groupTitle && b.groupTitle && a.groupTitle.toLowerCase() === b.groupTitle.toLowerCase()) {
    score += 0.25;
  }

  const roleA = narrativeRole(cardText(a));
  const roleB = narrativeRole(cardText(b));
  if (roleA && roleB && roleA === roleB) score += 0.15;

  const cA = causalKey(cardText(a));
  const cB = causalKey(cardText(b));
  if (cA && cB && cA === cB) score += 0.2;

  return score;
}

export function detectSemanticRegions<T extends CompressibleCard>(
  cards: T[],
): Array<{ label: string; cardIds: string[]; indices: number[] }> {
  if (cards.length <= 1) {
    return cards.map((c, i) => ({
      label: c.groupTitle ?? c.title.slice(0, 40),
      cardIds: [stableId(c, i)],
      indices: [i],
    }));
  }

  const parent = cards.map((_, i) => i);

  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const sim = regionSimilarity(cards[i], cards[j]);
      if (sim >= REGION_MERGE_THRESHOLD || titleSimilarity(cards[i].title, cards[j].title) >= TITLE_SIM_THRESHOLD) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < cards.length; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }

  return [...groups.values()].map((indices) => {
    const members = indices.map((i) => cards[i]);
    const entityCounts = new Map<string, number>();
    for (const m of members) {
      for (const e of capitalizedPhrases(cardText(m))) {
        entityCounts.set(e, (entityCounts.get(e) ?? 0) + 1);
      }
    }
    const topEntity = [...entityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const label =
      members[0]?.groupTitle ??
      (topEntity ? `${topEntity} region` : members[0]?.title.slice(0, 48) ?? "Semantic region");

    return {
      label,
      cardIds: indices.map((i) => stableId(cards[i], i)),
      indices,
    };
  });
}

function mergeWeakPair(a: LearnCandidate, b: LearnCandidate): LearnCandidate | null {
  const densityA = calculateKnowledgeDensity(a);
  const densityB = calculateKnowledgeDensity(b);
  if (densityA > 0.55 && densityB > 0.55) return null;

  const ents = [...new Set([...capitalizedPhrases(cardText(a)), ...capitalizedPhrases(cardText(b))])];
  const primary = ents[0] ?? "this subject";
  const themeA = tokenize(a.title).slice(0, 2).join(" ");
  const themeB = tokenize(b.title).slice(0, 2).join(" ");

  let title = `How did ${primary} connect ${themeA} and ${themeB}?`;
  if (/\b(social|political|institutional|identity|symbol)\b/i.test(`${a.content} ${b.content}`)) {
    title = `How did ${primary} evolve across social and institutional dimensions?`;
  }
  if (TRANSFORM_RE.test(`${a.content} ${b.content}`)) {
    title = `What transformation links ${primary} to broader change in the source?`;
  }

  return {
    kind: a.kind === "why_it_matters" || b.kind === "why_it_matters" ? "why_it_matters" : "connection",
    title: title.slice(0, 72),
    content: `${a.content}\n\n↔ ${b.content}`.slice(0, 380),
    source: "synthesized",
    importance: Math.min(1, Math.max(a.importance, b.importance) + 0.08),
    entities: ents.slice(0, 6),
    learnPattern: a.learnPattern ?? b.learnPattern ?? "contrast_analysis",
    groupTitle: a.groupTitle ?? b.groupTitle,
    cardId: `merged_${stableId(a, 0)}_${stableId(b, 1)}`,
  };
}

export function reduceVerbosity<T extends CompressibleCard>(card: T): T {
  let title = card.title.trim();
  let content = card.content.trim();

  for (const re of VERBOSE_PHRASES) {
    title = title.replace(re, "").trim();
    content = content.replace(re, "").trim();
  }

  title = title.replace(/\s{2,}/g, " ").replace(/^[,:;\s]+/, "");
  content = content.replace(/\s{2,}/g, " ");

  if (title.length > 72) {
    const cut = title.slice(0, 69).replace(/\s+\S*$/, "");
    title = `${cut}…`;
  }
  if (content.length > 300) {
    const sentences = content.split(/(?<=[.!?])\s+/);
    content = sentences.slice(0, 3).join(" ").slice(0, 300);
    if (content.length >= 298) content = `${content.trim()}…`;
  }

  return { ...card, title, content };
}

function collapseRegions<T extends LearnCandidate>(
  cards: T[],
  regions: ReturnType<typeof detectSemanticRegions<T>>,
  context: UniquenessContext,
  clusters: KnowledgeCompressionResult<T>["compressedClusters"],
  removed: T[],
): T[] {
  const kept: T[] = [];

  for (const region of regions) {
    if (region.indices.length === 1) {
      const card = reduceVerbosity(cards[region.indices[0]]);
      kept.push(card);
      registerKept(context, card);
      continue;
    }

    const members = region.indices.map((i) => cards[i]);
    let winner = members[0];
    let best = combinedRetentionScore(winner, context);

    for (let m = 1; m < members.length; m++) {
      const score = combinedRetentionScore(members[m], context);
      if (score > best) {
        best = score;
        winner = members[m];
      }
    }

    const lowDensity = members.filter((c) => calculateKnowledgeDensity(c) < 0.48);
    if (lowDensity.length >= 2) {
      const merged = mergeWeakPair(lowDensity[0], lowDensity[1]);
      if (merged) {
        winner = reduceVerbosity(merged) as T;
      }
    }

    winner = reduceVerbosity({ ...winner, importance: Math.min(1, (winner.importance ?? 0.5) + 0.05) });
    kept.push(winner);
    registerKept(context, winner);

    const keptId = stableId(winner, region.indices[0]);
    const removedIds: string[] = [];
    for (const idx of region.indices) {
      const c = cards[idx];
      if (stableId(c, idx) !== keptId) {
        removed.push(c);
        removedIds.push(stableId(c, idx));
      }
    }

    if (removedIds.length > 0) {
      clusters.push({
        clusterId: `region_${clusters.length}`,
        topic: region.label,
        removedCardIds: removedIds,
        keptCardId: keptId,
      });
    }
  }

  return kept;
}

function selectCoverageBalanced<T extends LearnCandidate>(
  cards: T[],
  targetMax: number,
  targetMin: number,
): T[] {
  if (cards.length <= targetMax) return cards;

  const scored = [...cards].sort(
    (a, b) => combinedRetentionScore(b, emptyContext()) - combinedRetentionScore(a, emptyContext()),
  );

  const covered = new Set<CoverageBucket>();
  const picked: T[] = [];
  const byBucket = new Map<CoverageBucket, T[]>();
  for (const card of scored) {
    const bucket = coverageBucket(card);
    const list = byBucket.get(bucket) ?? [];
    list.push(card);
    byBucket.set(bucket, list);
  }

  for (const bucket of COVERAGE_BUCKETS) {
    const card = byBucket.get(bucket)?.[0];
    if (!card || picked.length >= targetMax) continue;
    if (!covered.has(bucket)) {
      picked.push(card);
      covered.add(bucket);
    }
  }

  for (const card of scored) {
    if (picked.length >= targetMax) break;
    const bucket = coverageBucket(card);
    if (!covered.has(bucket) || picked.length < targetMin) {
      if (!picked.includes(card)) {
        picked.push(card);
        covered.add(bucket);
      }
    }
  }

  for (const card of scored) {
    if (picked.length >= targetMax) break;
    if (!picked.includes(card)) picked.push(card);
  }

  return picked.slice(0, targetMax);
}

function emptyContext(): UniquenessContext {
  return {
    fingerprints: [],
    entities: new Set(),
    patterns: new Set(),
    narrativeRoles: new Set(),
    regionLabels: new Set(),
    causalKeys: new Set(),
  };
}

function aggregateStats(
  original: number,
  kept: CompressibleCard[],
  removed: number,
  merged: number,
  regionCount: number,
): CompressionStats {
  const densities = kept.map((c) => calculateKnowledgeDensity(c));
  const uniqueness = kept.map((c, i) => {
    const ctx = emptyContext();
    for (let j = 0; j < i; j++) registerKept(ctx, kept[j]);
    return calculateIdeaUniquenessScore(c, ctx);
  });

  return {
    originalCardCount: original,
    compressedCardCount: kept.length,
    removedSemanticDuplicates: removed,
    mergedCardCount: merged,
    semanticRegionCount: regionCount,
    averageKnowledgeDensity:
      densities.length > 0 ? Math.round((densities.reduce((a, b) => a + b, 0) / densities.length) * 100) / 100 : 0,
    averageIdeaUniqueness:
      uniqueness.length > 0
        ? Math.round((uniqueness.reduce((a, b) => a + b, 0) / uniqueness.length) * 100) / 100
        : 0,
  };
}

/**
 * Second-stage compression on learn candidates (post-dedupe, pre-selection).
 */
export function compressLearnCandidates(
  candidates: LearnCandidate[],
  _structure: KnowledgeStructure,
  options?: { targetMax?: number; targetMin?: number },
): { result: KnowledgeCompressionResult<LearnCandidate>; stats: CompressionStats } {
  const targetMax = options?.targetMax ?? candidates.length;
  const targetMin = options?.targetMin ?? 3;
  const original = candidates.length;

  if (candidates.length <= 1) {
    const kept = candidates.map((c) => reduceVerbosity(c));
    return {
      result: {
        keptCards: kept,
        removedCards: [],
        compressedClusters: [],
        semanticRegions: kept.map((c, i) => ({ label: c.title, cardIds: [stableId(c, i)] })),
      },
      stats: aggregateStats(original, kept, 0, 0, kept.length),
    };
  }

  const regions = detectSemanticRegions(candidates);
  const context = emptyContext();
  const clusters: KnowledgeCompressionResult<LearnCandidate>["compressedClusters"] = [];
  const removed: LearnCandidate[] = [];
  let mergedCount = 0;

  const regionMerged = collapseRegions(candidates, regions, context, clusters, removed);
  mergedCount = clusters.filter((c) => c.removedCardIds.length > 1).length;

  const balanced = selectCoverageBalanced(regionMerged, targetMax, targetMin);
  const semanticRegions = detectSemanticRegions(balanced).map((r) => ({
    label: r.label,
    cardIds: r.cardIds,
  }));

  return {
    result: {
      keptCards: balanced,
      removedCards: removed,
      compressedClusters: clusters,
      semanticRegions,
    },
    stats: aggregateStats(original, balanced, removed.length, mergedCount, regions.length),
  };
}

function candidateFromOutput(card: LearnCardOutput, index: number): LearnCandidate {
  return {
    kind: (card.type === "why" ? "why_it_matters" : card.type) as LearnCandidate["kind"],
    title: card.title,
    content: card.content,
    source: "ai_card",
    importance: 0.6,
    entities: capitalizedPhrases(`${card.title} ${card.content}`),
    learnPattern: card.learnPattern,
    groupTitle: card.groupTitle,
    cardId: card.cardId ?? `out_${index}`,
  };
}

/**
 * Final compression on learn card outputs (post-quality, pre-progression).
 */
export function compressLearnCardOutputs(
  cards: LearnCardOutput[],
  structure: KnowledgeStructure,
  options?: { targetMax?: number; targetMin?: number },
): { result: KnowledgeCompressionResult<LearnCardOutput>; stats: CompressionStats } {
  const indexed = cards.map((card, i) => ({
    card,
    candidate: candidateFromOutput(card, i),
  }));
  const { result, stats } = compressLearnCandidates(
    indexed.map((x) => x.candidate),
    structure,
    options,
  );

  const keptIds = new Set(result.keptCards.map((c) => c.cardId ?? c.title));
  const keptOutputs: LearnCardOutput[] = [];
  const removedOutputs: LearnCardOutput[] = [];

  for (const { card, candidate } of indexed) {
    const key = candidate.cardId ?? candidate.title;
    if (keptIds.has(key)) {
      const match = result.keptCards.find((k) => (k.cardId ?? k.title) === key);
      keptOutputs.push(
        reduceVerbosity({
          ...card,
          title: match?.title ?? card.title,
          content: match?.content ?? card.content,
        }),
      );
    } else {
      removedOutputs.push(card);
    }
  }

  return {
    result: {
      keptCards: keptOutputs,
      removedCards: removedOutputs,
      compressedClusters: result.compressedClusters,
      semanticRegions: result.semanticRegions,
    },
    stats,
  };
}

/** Maximize novelty and conceptual expansion in practice order. */
export function orderCardsForProgressiveUnderstanding(cards: LearnCardOutput[]): LearnCardOutput[] {
  if (cards.length <= 2) return cards;

  const enriched = cards.map((c, i) => ({
    card: c,
    index: i,
    density: calculateKnowledgeDensity(c),
    bucket: coverageBucket(c),
    retrieval: c.retrievalType ?? "recall",
    cognitive: c.cognitiveLevel ?? "conceptual",
    entities: entitySet(cardText(c)),
    narrative: narrativeRole(cardText(c)),
  }));

  const ordered: typeof enriched = [];
  const used = new Set<number>();
  const seenBuckets = new Set<string>();
  const seenEntities = new Map<string, number>();
  let lastRetrieval: string[] = [];

  const pickScore = (item: (typeof enriched)[0]): number => {
    let score = -item.density * 10;
    if (!seenBuckets.has(item.bucket)) score -= 4;
    let entityPenalty = 0;
    for (const e of item.entities) {
      entityPenalty += (seenEntities.get(e) ?? 0) * 3;
    }
    score += entityPenalty;
    if (lastRetrieval.length >= 2 && lastRetrieval.every((r) => r === item.retrieval)) score += 5;
    if (item.cognitive === "abstract" && seenBuckets.size >= 3) score -= 2;
    return score;
  };

  while (ordered.length < enriched.length) {
    let best = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < enriched.length; i++) {
      if (used.has(i)) continue;
      const s = pickScore(enriched[i]);
      if (s < bestScore) {
        bestScore = s;
        best = i;
      }
    }
    if (best < 0) break;
    const item = enriched[best];
    used.add(best);
    ordered.push(item);
    seenBuckets.add(item.bucket);
    for (const e of item.entities) {
      seenEntities.set(e, (seenEntities.get(e) ?? 0) + 1);
    }
    lastRetrieval = [...lastRetrieval, item.retrieval].slice(-2);
  }

  return ordered.map((o) => o.card);
}

export function learnCompressionDebugStats(
  stats: CompressionStats,
): LearnKnowledgeCompressionDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return {
    originalCardCount: stats.originalCardCount,
    compressedCardCount: stats.compressedCardCount,
    removedSemanticDuplicates: stats.removedSemanticDuplicates,
    mergedCardCount: stats.mergedCardCount,
    semanticRegionCount: stats.semanticRegionCount,
    averageKnowledgeDensity: stats.averageKnowledgeDensity,
    averageIdeaUniqueness: stats.averageIdeaUniqueness,
  };
}
