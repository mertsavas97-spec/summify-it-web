/**
 * Phase Learn 2 — apply mode learn strategies to candidates and output cards.
 */

import type { LearnCardQualityStats } from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import type { LearnCardCountRange } from "./types";
import type { LearnCandidate, LearnCardKind } from "./types";
import {
  getModeLearnStrategy,
  patternPreferenceBoost,
  resolveCardStrategyPattern,
  type ModeLearnStrategy,
  type ModeLearnStrategyInput,
  type ModeStrategyPattern,
} from "./modeLearnStrategies";

export type LearnStrategyApplyStats = {
  strategyId: string;
  preferredPatterns: string[];
  blockedPatterns: string[];
  targetDistribution: Record<string, number>;
  actualDistribution: Record<string, number>;
  strategyFilteredCount: number;
  strategyBoostedCount: number;
};

export type LearnStrategyApplyResult<T> = {
  items: T[];
  stats: LearnStrategyApplyStats;
};

function emptyStats(strategy: ModeLearnStrategy): LearnStrategyApplyStats {
  return {
    strategyId: strategy.id,
    preferredPatterns: [...strategy.preferredPatterns],
    blockedPatterns: [...strategy.blockedPatterns],
    targetDistribution: { ...strategy.targetDistribution },
    actualDistribution: {},
    strategyFilteredCount: 0,
    strategyBoostedCount: 0,
  };
}

function distributionOf(
  items: Array<{
    title: string;
    content: string;
    learnPattern?: import("@/types/adaptive-learn").LearnCardPattern;
    type?: string;
    kind?: LearnCardKind;
  }>,
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const item of items) {
    const key = resolveCardStrategyPattern(item);
    dist[key] = (dist[key] ?? 0) + 1;
  }
  return dist;
}

function hasStrongSourceGrounding(text: string): boolean {
  return (
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(text) ||
    /\b\d{4}\b|\b\d+%\b/.test(text) ||
    text.length >= 90
  );
}

function isBlockedByStrategy(
  candidate: LearnCandidate,
  strategy: ModeLearnStrategy,
): boolean {
  const pattern = resolveCardStrategyPattern(candidate);
  const text = `${candidate.title} ${candidate.content}`;

  if (strategy.blockedKinds?.includes(candidate.kind)) {
    if (!hasStrongSourceGrounding(text)) return true;
  }

  if (candidate.source && strategy.blockedSources?.includes(candidate.source)) {
    if (!hasStrongSourceGrounding(text)) return true;
  }

  if (!strategy.blockedPatterns.includes(pattern)) return false;

  if (strategy.id === "executive" && candidate.kind === "quiz") {
    return !candidate.content.includes("---");
  }

  if (strategy.id === "researcher" && candidate.kind === "memory_hook") {
    return true;
  }

  return !hasStrongSourceGrounding(text);
}

/** Boost candidate importance using mode strategy preferences. */
export function applyStrategyToCandidateRanking(
  candidates: LearnCandidate[],
  strategy: ModeLearnStrategy,
): { candidates: LearnCandidate[]; boostedCount: number } {
  let boostedCount = 0;

  const ranked = candidates.map((c) => {
    const pattern = resolveCardStrategyPattern(c);
    const boost = patternPreferenceBoost(pattern, strategy);
    const kindBoost = strategy.kindBoosts?.[c.kind] ?? 0;
    const totalBoost = boost + kindBoost;
    if (totalBoost > 0.05) boostedCount += 1;
    return {
      ...c,
      importance: Math.max(0.05, Math.min(1, c.importance + totalBoost)),
    };
  });

  return {
    candidates: ranked.sort((a, b) => b.importance - a.importance),
    boostedCount,
  };
}

/** Drop strategy-blocked candidates before ranking/selection. */
export function filterCandidatesByStrategy(
  candidates: LearnCandidate[],
  strategy: ModeLearnStrategy,
): { candidates: LearnCandidate[]; filteredCount: number } {
  const kept: LearnCandidate[] = [];
  let filteredCount = 0;

  for (const c of candidates) {
    if (isBlockedByStrategy(c, strategy)) {
      filteredCount += 1;
      continue;
    }
    kept.push(c);
  }

  return { candidates: kept, filteredCount };
}

function mapTargetKeyToPatterns(targetKey: string): ModeStrategyPattern[] {
  if (targetKey === "concept") return ["concept", "terminology", "fact_recall"];
  if (targetKey === "why_it_matters") return ["why_it_matters", "cause_effect_chain"];
  if (targetKey === "memory_hook") return ["memory_hook", "hook"];
  if (targetKey === "quiz_application") return ["quiz_application"];
  return [targetKey];
}

/**
 * Select candidates toward strategy targetDistribution (soft quotas).
 */
export function selectCandidatesByStrategy(
  ranked: LearnCandidate[],
  strategy: ModeLearnStrategy,
  range: LearnCardCountRange,
): LearnCandidate[] {
  const target = range.max;
  const scale = target / 8;
  const selected: LearnCandidate[] = [];
  const used = new Set<string>();

  const pickPattern = (patterns: ModeStrategyPattern[], limit: number) => {
    let count = 0;
    for (const c of ranked) {
      if (count >= limit) break;
      const pattern = resolveCardStrategyPattern(c);
      if (!patterns.includes(pattern)) continue;
      const key = c.title.toLowerCase();
      if (used.has(key)) continue;
      selected.push(c);
      used.add(key);
      count += 1;
    }
  };

  for (const [key, count] of Object.entries(strategy.targetDistribution)) {
    const limit = Math.max(1, Math.round(count * scale));
    pickPattern(mapTargetKeyToPatterns(key), limit);
  }

  for (const c of ranked) {
    if (selected.length >= target) break;
    const key = c.title.toLowerCase();
    if (used.has(key)) continue;
    if (isBlockedByStrategy(c, strategy)) continue;
    selected.push(c);
    used.add(key);
  }

  return selected.slice(0, target);
}

/** Strategy-aware practice prompt (no generic templates when avoidable). */
export function practicePromptForCard(
  card: LearnCardOutput,
  strategy: ModeLearnStrategy,
): string {
  const title = card.title.trim();
  const pattern = resolveCardStrategyPattern(card);

  if (card.type === "quiz") {
    const q = card.content.split("\n---\n")[0]?.trim() ?? title;
    return q.endsWith("?") ? q : `${q}?`;
  }

  switch (strategy.promptStyle) {
    case "active_recall":
      if (title.endsWith("?")) return title;
      if (pattern === "cause_effect_chain" || pattern === "why_it_matters") {
        return title.startsWith("Why") ? title : `Why does ${title}?`;
      }
      if (pattern === "timeline_chain" || pattern === "historical_anchor") {
        return `What happened regarding ${title}?`;
      }
      if (pattern === "figure_significance") {
        return `Who or what is ${title}, and why does it matter here?`;
      }
      return `What should you recall about ${title}?`;

    case "argument_reconstruction":
      if (pattern === "evidence") return `What evidence supports: ${title}?`;
      if (pattern === "limitation") return `What limitation does the source note about ${title}?`;
      if (pattern === "contradiction") return `What tension or contradiction involves ${title}?`;
      if (pattern === "methodology") return `What method or approach applies to ${title}?`;
      return `What claim does the source make about ${title}?`;

    case "decision_recall":
      if (pattern === "risk_opportunity" || pattern === "risk") {
        return `What risk or opportunity does the source tie to ${title}?`;
      }
      if (pattern === "tradeoff") return `What tradeoff does ${title} involve?`;
      if (pattern === "metric_significance") return `Which metric or signal relates to ${title}?`;
      return `What decision or implication follows from ${title}?`;

    case "creative_angle":
      if (pattern === "hook" || card.type === "memory_hook") {
        return title.endsWith("?") ? title : `What is the strongest hook in: ${title}?`;
      }
      if (pattern === "story_beat") return `Which story beat does ${title} represent?`;
      if (pattern === "quote") return `What quoted moment supports ${title}?`;
      return `What reusable angle does ${title} offer?`;

    case "clause_recall":
      if (pattern === "obligation") return `What obligation does the source state about ${title}?`;
      if (pattern === "deadline") return `What deadline or timing applies to ${title}?`;
      if (pattern === "party") return `Which party is associated with ${title}?`;
      if (pattern === "exception") return `What exception applies to ${title}?`;
      return `What does the source say about ${title}? (Review only — not legal advice.)`;

    case "mechanism_recall":
      if (pattern === "failure_mode") return `What failure mode relates to ${title}?`;
      if (pattern === "dependency_chain") return `What depends on ${title} in this system?`;
      if (pattern === "configuration" || pattern === "API_behavior") {
        return `How is ${title} configured or exposed in the source?`;
      }
      return `How does ${title} work in this source?`;

    default:
      return title.endsWith("?") ? title : `Explain ${title}.`;
  }
}

/** Filter/reorder output cards by strategy before quality pass. */
export function applyStrategyToLearnCards(
  cards: LearnCardOutput[],
  strategy: ModeLearnStrategy,
  targetMax: number,
): LearnStrategyApplyResult<LearnCardOutput> {
  const stats = emptyStats(strategy);
  const filtered: LearnCardOutput[] = [];

  for (const card of cards) {
    const pseudo: LearnCandidate = {
      kind: (card.type === "why" ? "why_it_matters" : card.type) as LearnCardKind,
      title: card.title,
      content: card.content,
      source: "ai_card",
      importance: 0.5,
      entities: [],
      learnPattern: card.learnPattern,
    };
    if (isBlockedByStrategy(pseudo, strategy)) {
      stats.strategyFilteredCount += 1;
      continue;
    }
    const pattern = resolveCardStrategyPattern(card);
    const boost = patternPreferenceBoost(pattern, strategy);
    if (boost > 0.05) stats.strategyBoostedCount += 1;
    filtered.push(card);
  }

  const sorted = [...filtered].sort((a, b) => {
    const pa = resolveCardStrategyPattern(a);
    const pb = resolveCardStrategyPattern(b);
    return patternPreferenceBoost(pb, strategy) - patternPreferenceBoost(pa, strategy);
  });

  const patternCounts = new Map<string, number>();
  const out: LearnCardOutput[] = [];

  for (const card of sorted) {
    const key = resolveCardStrategyPattern(card);
    const count = patternCounts.get(key) ?? 0;
    if (count >= strategy.maxPerPattern) continue;
    out.push(card);
    patternCounts.set(key, count + 1);
    if (out.length >= targetMax) break;
  }

  for (const card of sorted) {
    if (out.length >= targetMax) break;
    if (out.includes(card)) continue;
    out.push(card);
  }

  stats.actualDistribution = distributionOf(out.slice(0, targetMax));
  return { items: out.slice(0, targetMax), stats };
}

export function resolveLearnStrategy(input: ModeLearnStrategyInput): ModeLearnStrategy {
  return getModeLearnStrategy(input);
}

export function learnStrategyDebugStats(
  stats: LearnStrategyApplyStats,
): LearnStrategyApplyStats | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return stats;
}

export function mergeStrategyIntoQualityDebug(
  quality: LearnCardQualityStats | undefined,
  strategy: LearnStrategyApplyStats | undefined,
): LearnCardQualityStats | undefined {
  if (!quality || !strategy) return quality;
  return quality;
}
