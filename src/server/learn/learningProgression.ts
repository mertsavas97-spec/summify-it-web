/**
 * Phase Learn 3 — learning science: progression, recall pressure, relationships, ordering.
 */

import type {
  LearnCognitiveLevel,
  LearnProgressionDebugMeta,
  LearnRetrievalType,
  RecallDifficultyLevel,
} from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import { isCreatorIntelligenceMode, validateLearnTitle } from "./validateLearnTitle";
import { resolveCardStrategyPattern, type ModeLearnStrategy } from "./modeLearnStrategies";

const MAX_HOOKS_PER_SET = 2;
const DIFFICULTY_TARGETS = { easy: 3, medium: 3, hard: 2 };

const GENERIC_PROMPT =
  /^(what is the key insight|explain this concept|what should you recall|what memory hook)/i;

export type ProgressionCard = LearnCardOutput & {
  cardId: string;
  recallDifficulty: RecallDifficultyLevel;
  retrievalType: LearnRetrievalType;
  cognitiveLevel: LearnCognitiveLevel;
};

export type ApplyLearningProgressionResult = {
  cards: LearnCardOutput[];
  stats: LearnProgressionDebugMeta;
};

function stableCardId(card: LearnCardOutput, index: number): string {
  return card.cardId ?? `learn_${index}_${card.type}`;
}

function extractEntities(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ??
    [];
  return [...new Set(matches.map((m) => m.trim()))].filter((m) => m.length >= 3);
}

function significantTerms(text: string, max = 8): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !/^(which|what|when|where|does|this|that|with|from)$/.test(w))
    .slice(0, max);
}

function classifyRetrieval(
  card: LearnCardOutput,
  strategy: ModeLearnStrategy,
): LearnRetrievalType {
  const pattern = resolveCardStrategyPattern(card);
  const text = `${card.title} ${card.content}`.toLowerCase();

  if (card.type === "quiz") return "recall";
  if (pattern === "timeline_chain" || pattern === "historical_anchor" || /\bbefore\b|\bafter\b|\b\d{4}\b/.test(text)) {
    return "chronology";
  }
  if (
    strategy.promptStyle === "mechanism_recall" ||
    pattern === "mechanism_breakdown" ||
    pattern === "failure_mode" ||
    pattern === "workflow_sequence"
  ) {
    return "mechanism";
  }
  if (pattern === "compare" || /\bversus\b|\bvs\.?\b|\bcompared\b/.test(text)) return "comparison";
  if (
    pattern === "contradiction" ||
    pattern === "limitation" ||
    pattern === "implication" ||
    /\bimplication\b|\bsynthesis\b/.test(text)
  ) {
    return "synthesis";
  }
  if (strategy.promptStyle === "decision_recall" && (pattern === "tradeoff" || pattern === "decision")) {
    return "application";
  }
  if (strategy.promptStyle === "creative_angle") return "application";
  if (card.type === "why_it_matters" || card.type === "why" || pattern === "cause_effect_chain") {
    return "recall";
  }
  if (card.type === "memory_hook") return "recognition";
  if (card.type === "connection") return "comparison";
  return "recall";
}

function classifyCognitive(
  card: LearnCardOutput,
  retrieval: LearnRetrievalType,
): LearnCognitiveLevel {
  if (retrieval === "synthesis" || retrieval === "application") return "abstract";
  if (retrieval === "comparison" || retrieval === "mechanism" || retrieval === "chronology") {
    return "relational";
  }
  if (card.type === "concept" || card.type === "quiz") return "conceptual";
  return "factual";
}

function classifyRecallDifficulty(
  card: LearnCardOutput,
  retrieval: LearnRetrievalType,
  cognitive: LearnCognitiveLevel,
  strategy: ModeLearnStrategy,
): RecallDifficultyLevel {
  if (retrieval === "recognition" || cognitive === "factual") {
    if (card.type === "quiz" && card.content.length < 120) return "easy";
    return "easy";
  }
  if (retrieval === "synthesis" || retrieval === "application" || cognitive === "abstract") {
    return "hard";
  }
  if (strategy.promptStyle === "decision_recall" && retrieval === "comparison") return "hard";
  if (retrieval === "mechanism" || retrieval === "chronology") return "medium";
  return "medium";
}

/** Compress memory hooks into short associative phrases. */
export function refineMemoryHookContent(card: LearnCardOutput): LearnCardOutput {
  if (card.type !== "memory_hook") return card;

  let content = card.content.trim();
  if (/^think:/i.test(content) && content.length < 100) return card;

  const entities = extractEntities(content);
  const contrast = content.match(
    /\b([A-Za-z][\w-]+(?:\s+[A-Za-z][\w-]+){0,3})\s+(?:\+|and|with|vs\.?|versus)\s+([A-Za-z][\w-]+(?:\s+[A-Za-z][\w-]+){0,3})\b/i,
  );
  if (contrast) {
    content = `${contrast[1]} + ${contrast[2]} = ${entities[0] ?? "core idea"}.`;
  } else if (entities.length >= 2) {
    content = `${entities[0]} ↔ ${entities[1]}: ${content.split(/[.!?]/)[0]?.slice(0, 72) ?? content.slice(0, 72)}.`;
  } else if (entities.length === 1) {
    const short = content.split(/[.!?]/).find((s) => s.trim().length >= 12 && s.length <= 90);
    content = short ? `${entities[0]} = ${short.trim()}.` : `Think: ${entities[0]} anchors this section.`;
  } else {
    const words = content.split(/\s+/).slice(0, 12).join(" ");
    content = `Think: ${words}${words.endsWith(".") ? "" : "."}`;
  }

  if (content.length > 140) content = `${content.slice(0, 137)}…`;
  return { ...card, content };
}

function stripAnswerLeakage(prompt: string, answer: string): string {
  let q = prompt.trim();
  const answerTerms = significantTerms(answer, 6);
  for (const term of answerTerms) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (answerTerms.length <= 4 && q.match(re)) {
      q = q.replace(re, "___");
    }
  }
  q = q.replace(/\s+/g, " ").replace(/___\s*/g, "").trim();
  if (q.length < 12) return prompt;
  return q;
}

/** High-recall-pressure practice prompt from progression metadata. */
export function retrievalPromptForCard(
  card: LearnCardOutput,
  strategy: ModeLearnStrategy,
  intelligenceModeId?: string | null,
): string {
  const title = card.title.trim().split("---")[0].trim();
  const content = card.content.trim();
  const pattern = resolveCardStrategyPattern(card);
  const retrieval = card.retrievalType ?? classifyRetrieval(card, strategy);
  const entities = extractEntities(content);
  const subject = entities[0] ?? "the main topic";

  if (card.type === "quiz") {
    const q = content.split("\n---\n")[0]?.trim() ?? title;
    const base = q.endsWith("?") ? q : `${q}?`;
    return stripAnswerLeakage(base, content.split("\n---\n")[1] ?? content);
  }

  if (GENERIC_PROMPT.test(title)) {
    if (retrieval === "chronology") {
      return stripAnswerLeakage(`What development came before ${subject} in this source?`, content);
    }
    if (retrieval === "mechanism") {
      return stripAnswerLeakage(`How does ${subject} work step by step?`, content);
    }
    return stripAnswerLeakage(`Why does ${subject} matter in this document?`, content);
  }

  let prompt: string;

  if (strategy.promptStyle === "creative_angle" && card.type === "memory_hook") {
    return stripAnswerLeakage(`Which tension creates curiosity around ${subject}?`, content);
  }
  if (strategy.promptStyle === "decision_recall" && card.recallDifficulty === "hard") {
    return stripAnswerLeakage(`What hidden assumption shapes ${subject}?`, content);
  }

  switch (retrieval) {
    case "chronology":
      prompt =
        title.endsWith("?") && !title.toLowerCase().includes("what is")
          ? title
          : `How did ${subject} unfold over time in this source?`;
      break;
    case "mechanism":
      prompt = title.startsWith("How") ? title : `How does ${subject} produce its effect here?`;
      break;
    case "comparison":
      prompt = title.includes(" vs ") ? title : `How does ${subject} compare to related ideas in the source?`;
      break;
    case "synthesis":
      if (strategy.promptStyle === "decision_recall") {
        prompt = `What hidden assumption shapes ${subject}?`;
      } else if (pattern === "limitation") {
        prompt = `What limitation should you remember about ${subject}?`;
      } else {
        prompt = `What implication follows from ${subject}?`;
      }
      break;
    case "application":
      if (
        strategy.promptStyle === "creative_angle" &&
        isCreatorIntelligenceMode(intelligenceModeId, strategy)
      ) {
        prompt = `What makes ${subject} reusable as content?`;
      } else if (strategy.promptStyle === "decision_recall") {
        prompt = `What strategic priority does ${subject} suggest?`;
      } else {
        prompt = `How would you apply ${subject} in a new scenario?`;
      }
      break;
    case "recognition":
      if (card.type === "memory_hook") {
        return `Recall the hook: ${content.slice(0, 90)}`;
      }
      prompt = title.endsWith("?") ? title : `What identifies ${subject} in this source?`;
      break;
    default:
      if (title.endsWith("?") && validateLearnTitle(title).valid) {
        prompt = title;
      } else if (pattern === "cause_effect_chain" || card.type === "why_it_matters") {
        prompt = title.startsWith("Why") ? title : `Why did ${subject} become decisive here?`;
      } else if (pattern === "figure_significance") {
        prompt = `Who or what is ${subject}, and what role do they play?`;
      } else {
        prompt = title.endsWith("?") && validateLearnTitle(title).valid
          ? title
          : `Why does ${subject} matter in this document?`;
      }
  }

  return stripAnswerLeakage(prompt, content);
}

function progressionSortKey(card: ProgressionCard): number {
  const difficultyOrder: Record<RecallDifficultyLevel, number> = { easy: 0, medium: 1, hard: 2 };
  const retrievalOrder: Record<LearnRetrievalType, number> = {
    recognition: 0,
    recall: 1,
    chronology: 2,
    mechanism: 2,
    comparison: 3,
    application: 4,
    synthesis: 5,
  };
  const cognitiveOrder: Record<LearnCognitiveLevel, number> = {
    factual: 0,
    conceptual: 1,
    relational: 2,
    abstract: 3,
  };

  let score = difficultyOrder[card.recallDifficulty] * 10;
  score += retrievalOrder[card.retrievalType] * 2;
  score += cognitiveOrder[card.cognitiveLevel];

  if (card.type === "memory_hook") score += 6;
  if (card.recallDifficulty === "hard") score += 4;

  return score;
}

function tokenOverlap(a: string, b: string): number {
  const setA = new Set(significantTerms(a, 10));
  const setB = new Set(significantTerms(b, 10));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared += 1;
  return shared / Math.min(setA.size, setB.size);
}

function inferRelationships(cards: ProgressionCard[]): ProgressionCard[] {
  return cards.map((card, i) => {
    const prereq: string[] = [];
    const reinforces: string[] = [];
    const cardEntities = new Set(extractEntities(`${card.title} ${card.content}`).map((e) => e.toLowerCase()));

    for (let j = 0; j < cards.length; j++) {
      if (i === j) continue;
      const other = cards[j];
      const overlap = tokenOverlap(
        `${card.title} ${card.content}`,
        `${other.title} ${other.content}`,
      );
      if (overlap < 0.35) continue;

      const otherEntities = extractEntities(`${other.title} ${other.content}`).map((e) => e.toLowerCase());
      const sharesEntity = otherEntities.some((e) => cardEntities.has(e));
      if (!sharesEntity) continue;

      const diffOrder = { easy: 0, medium: 1, hard: 2 };
      if (diffOrder[other.recallDifficulty] < diffOrder[card.recallDifficulty]) {
        if (!prereq.includes(other.cardId)) prereq.push(other.cardId);
      } else if (diffOrder[other.recallDifficulty] > diffOrder[card.recallDifficulty]) {
        if (!reinforces.includes(other.cardId)) reinforces.push(other.cardId);
      } else if (j < i && card.cognitiveLevel === "relational") {
        if (!prereq.includes(other.cardId)) prereq.push(other.cardId);
      }
    }

    return {
      ...card,
      prerequisiteCardIds: prereq.length > 0 ? prereq.slice(0, 3) : undefined,
      reinforcesCardIds: reinforces.length > 0 ? reinforces.slice(0, 3) : undefined,
    };
  });
}

function limitHooks(cards: ProgressionCard[]): ProgressionCard[] {
  let hookCount = 0;
  return cards.filter((card) => {
    if (card.type !== "memory_hook") return true;
    hookCount += 1;
    return hookCount <= MAX_HOOKS_PER_SET;
  });
}

function balanceDifficultyMix(cards: ProgressionCard[], targetTotal: number): ProgressionCard[] {
  const scale = targetTotal / 8;
  const targets = {
    easy: Math.max(1, Math.round(DIFFICULTY_TARGETS.easy * scale)),
    medium: Math.max(1, Math.round(DIFFICULTY_TARGETS.medium * scale)),
    hard: Math.max(1, Math.round(DIFFICULTY_TARGETS.hard * scale)),
  };

  const buckets: Record<RecallDifficultyLevel, ProgressionCard[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const c of cards) buckets[c.recallDifficulty].push(c);

  const out: ProgressionCard[] = [];
  const pull = (level: RecallDifficultyLevel, n: number) => {
    for (let i = 0; i < n && buckets[level].length > 0; i++) {
      out.push(buckets[level].shift()!);
    }
  };

  pull("easy", targets.easy);
  pull("medium", targets.medium);
  pull("hard", targets.hard);

  for (const level of ["easy", "medium", "hard"] as const) {
    while (buckets[level].length > 0 && out.length < targetTotal) {
      out.push(buckets[level].shift()!);
    }
  }

  return out.slice(0, targetTotal);
}

function reduceFatigueOrder(cards: ProgressionCard[]): ProgressionCard[] {
  const result: ProgressionCard[] = [];
  const used = new Set<number>();
  const entityCounts = new Map<string, number>();
  let lastRetrieval: LearnRetrievalType[] = [];

  const scoreNext = (card: ProgressionCard): number => {
    let score = progressionSortKey(card);
    const ents = extractEntities(`${card.title} ${card.content}`);
    for (const e of ents) {
      const c = entityCounts.get(e.toLowerCase()) ?? 0;
      if (c >= 2) score += 5;
    }
    if (lastRetrieval.length >= 2 && lastRetrieval.every((r) => r === card.retrievalType)) {
      score += 8;
    }
    if (card.title.toLowerCase().startsWith("why") && lastRetrieval.filter((r) => r === "recall").length >= 2) {
      score += 6;
    }
    return score;
  };

  while (result.length < cards.length) {
    let bestIdx = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < cards.length; i++) {
      if (used.has(i)) continue;
      const s = scoreNext(cards[i]);
      if (s < bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    const card = cards[bestIdx];
    used.add(bestIdx);
    result.push(card);
    for (const e of extractEntities(`${card.title} ${card.content}`)) {
      const k = e.toLowerCase();
      entityCounts.set(k, (entityCounts.get(k) ?? 0) + 1);
    }
    lastRetrieval = [...lastRetrieval, card.retrievalType].slice(-2);
  }

  return result;
}

function enrichCard(
  card: LearnCardOutput,
  index: number,
  strategy: ModeLearnStrategy,
): ProgressionCard {
  const refined = card.type === "memory_hook" ? refineMemoryHookContent(card) : card;
  const retrieval = classifyRetrieval(refined, strategy);
  const cognitive = classifyCognitive(refined, retrieval);
  const recallDifficulty = classifyRecallDifficulty(refined, retrieval, cognitive, strategy);

  return {
    ...refined,
    cardId: stableCardId(refined, index),
    recallDifficulty,
    retrievalType: retrieval,
    cognitiveLevel: cognitive,
  };
}

function buildStats(cards: ProgressionCard[]): LearnProgressionDebugMeta {
  const stats: LearnProgressionDebugMeta = {
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    retrievalDistribution: {},
    cognitiveDistribution: {},
    relationshipCount: 0,
    hookCount: 0,
  };

  for (const card of cards) {
    if (card.recallDifficulty === "easy") stats.easyCount += 1;
    else if (card.recallDifficulty === "medium") stats.mediumCount += 1;
    else stats.hardCount += 1;

    stats.retrievalDistribution[card.retrievalType] =
      (stats.retrievalDistribution[card.retrievalType] ?? 0) + 1;
    stats.cognitiveDistribution[card.cognitiveLevel] =
      (stats.cognitiveDistribution[card.cognitiveLevel] ?? 0) + 1;

    stats.relationshipCount +=
      (card.prerequisiteCardIds?.length ?? 0) + (card.reinforcesCardIds?.length ?? 0);
    if (card.type === "memory_hook") stats.hookCount += 1;
  }

  return stats;
}

export function learnProgressionDebugStats(
  stats: LearnProgressionDebugMeta,
): LearnProgressionDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return stats;
}

/**
 * Apply progression enrichment, difficulty mix, relationships, fatigue reduction, and ordering.
 * Run after strategy + quality passes.
 */
export function applyLearningProgression(
  cards: LearnCardOutput[],
  strategy: ModeLearnStrategy,
  options?: { targetMax?: number },
): ApplyLearningProgressionResult {
  const targetMax = options?.targetMax ?? cards.length;
  if (cards.length === 0) {
    return {
      cards: [],
      stats: {
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        retrievalDistribution: {},
        cognitiveDistribution: {},
        relationshipCount: 0,
        hookCount: 0,
      },
    };
  }

  let enriched = cards.map((c, i) => enrichCard(c, i, strategy));
  enriched = limitHooks(enriched);
  enriched = balanceDifficultyMix(
    [...enriched].sort((a, b) => progressionSortKey(a) - progressionSortKey(b)),
    targetMax,
  );
  enriched = inferRelationships(enriched);
  enriched = reduceFatigueOrder(enriched);

  return {
    cards: enriched,
    stats: buildStats(enriched),
  };
}
