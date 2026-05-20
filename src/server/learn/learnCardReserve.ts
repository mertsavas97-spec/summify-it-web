/**
 * Refill learn cards from reserve pool + knowledge-structure fallbacks.
 */

import type { AnalysisResult } from "@/server/ai/schemas";
import type { LearnCardOutput } from "@/types/text-analysis";
import { calculateKnowledgeDensity, calculateIdeaUniquenessScore } from "./knowledgeCompression";
import { isWeakGenericLearnTitle, type KnowledgeStructure } from "./knowledgeStructure";
import { synthesizeKnowledgeStructureCandidates } from "./knowledgeStructureLearn";
import { cognitiveQuestionKey, cognitiveQuestionKeyFromOutput } from "./learnCognitiveDedup";
import type { ModeLearnStrategy } from "./modeLearnStrategies";
import type { LearnCardCountRange } from "./types";
import type { LearnCandidate } from "./types";

export type LearnReservePool = {
  candidates: LearnCandidate[];
};

export function createReservePool(): LearnReservePool {
  return { candidates: [] };
}

export function pushReserveCandidates(pool: LearnReservePool, items: LearnCandidate[]): void {
  for (const item of items) {
    if (!item.title?.trim() || !item.content?.trim()) continue;
    if (isWeakGenericLearnTitle(item.title)) continue;
    pool.candidates.push(item);
  }
}

function reserveScore(c: LearnCandidate): number {
  const ctx = {
    fingerprints: [],
    entities: new Set<string>(),
    patterns: new Set<string>(),
    narrativeRoles: new Set<string>(),
    regionLabels: new Set<string>(),
    causalKeys: new Set<string>(),
  };
  const density = calculateKnowledgeDensity(c);
  const uniqueness = calculateIdeaUniquenessScore(c, ctx);
  const traceBoost = c.source === "synthesized" ? 0.04 : 0;
  return (c.importance ?? 0.5) * 0.4 + density * 0.35 + uniqueness * 0.25 + traceBoost;
}

function candidateToOutput(
  c: LearnCandidate,
  index: number,
  toOutput: (c: LearnCandidate, flags: { isYoutube: boolean; isPresentation: boolean }) => LearnCardOutput,
  flags: { isYoutube: boolean; isPresentation: boolean },
): LearnCardOutput {
  const out = toOutput(c, flags);
  return {
    ...out,
    cardId: out.cardId ?? c.cardId ?? `reserve_${index}_${c.kind}`,
  };
}

/**
 * Refill up to range.min from reserve + structure synthesis (no aggressive compression).
 */
export function refillLearnCardsFromReserve<T extends LearnCardOutput>(input: {
  current: T[];
  pool: LearnReservePool;
  range: LearnCardCountRange;
  knowledgeStructure: KnowledgeStructure;
  result: Pick<
    AnalysisResult,
    "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems"
  >;
  learnStrategy: ModeLearnStrategy;
  outputFlags: { isYoutube: boolean; isPresentation: boolean };
  toOutput: (c: LearnCandidate, flags: { isYoutube: boolean; isPresentation: boolean }) => T;
}): T[] {
  const { range, current, pool, knowledgeStructure, result, learnStrategy, outputFlags, toOutput } =
    input;

  if (current.length >= range.min) return current.slice(0, range.max);

  const usedKeys = new Set(current.map((c) => cognitiveQuestionKeyFromOutput(c)));
  const usedTitles = new Set(current.map((c) => c.title.toLowerCase().trim()));
  const out: T[] = [...current];

  const structureFallbacks = synthesizeKnowledgeStructureCandidates(
    { ...result, learnCards: current },
    knowledgeStructure,
    { strategy: learnStrategy },
  );

  const ranked = [...pool.candidates, ...structureFallbacks]
    .filter((c) => !isWeakGenericLearnTitle(c.title))
    .sort((a, b) => reserveScore(b) - reserveScore(a));

  for (let i = 0; i < ranked.length && out.length < range.min; i++) {
    const c = ranked[i];
    const key = cognitiveQuestionKey(c);
    const titleKey = c.title.toLowerCase().trim();
    if (usedKeys.has(key) || usedTitles.has(titleKey)) continue;

    const card = candidateToOutput(c, i, toOutput, outputFlags);
    if (isWeakGenericLearnTitle(card.title)) continue;

    out.push(card as T);
    usedKeys.add(cognitiveQuestionKeyFromOutput(card));
    usedTitles.add(card.title.toLowerCase().trim());
  }

  return out.slice(0, range.max);
}
