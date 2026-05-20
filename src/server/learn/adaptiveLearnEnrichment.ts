/**
 * Phase 11D — grouping, difficulty scoring, relationships, API enrichment.
 */

import type { LearnCardOutput } from "@/server/ai/schemas";
import type {
  AdaptiveLearnDebugMeta,
  AdaptiveLearnProfile,
  LearnAbstractionLevel,
  LearnCardPattern,
  LearnCardRelationship,
  LearnDifficultyLevel,
  LearnDifficultyStats,
} from "@/types/adaptive-learn";
import type { LearnCandidate, LearnCardKind } from "./types";

const KIND_TO_GROUP: Partial<Record<LearnCardKind, string>> = {
  quiz: "practice_questions",
  memory_hook: "timeline_recall",
  connection: "causes_consequences",
  misconception: "failure_points",
};

function stableCardId(candidate: LearnCandidate, index: number): string {
  return candidate.cardId ?? `card_${index}_${candidate.learnPattern ?? candidate.kind}`;
}

function resolveGroup(
  candidate: LearnCandidate,
  profile: AdaptiveLearnProfile,
): { groupId?: string; groupTitle?: string } {
  if (profile.groupingStrategy === "flat" || profile.groups.length === 0) {
    return {};
  }

  if (candidate.groupId) {
    const g = profile.groups.find((x) => x.id === candidate.groupId);
    if (g) return { groupId: g.id, groupTitle: g.title };
  }

  const preferred = profile.groups.find((g) => g.cardTypes.includes(candidate.kind as never));
  if (preferred) return { groupId: preferred.id, groupTitle: preferred.title };

  const fallbackId = KIND_TO_GROUP[candidate.kind];
  if (fallbackId) {
    const g = profile.groups.find((x) => x.id === fallbackId);
    if (g) return { groupId: g.id, groupTitle: g.title };
  }

  return profile.groups[0]
    ? { groupId: profile.groups[0].id, groupTitle: profile.groups[0].title }
    : {};
}

export function scoreLearnDifficulty(candidate: LearnCandidate): {
  difficulty: LearnDifficultyLevel;
  abstractionLevel: LearnAbstractionLevel;
  memoryWeight: number;
  conceptualDensity: number;
} {
  const text = `${candidate.title} ${candidate.content}`;
  let abstraction: LearnAbstractionLevel = "medium";
  let density = 0.45;
  let memory = 0.5;

  const pattern = candidate.learnPattern;
  if (
    pattern === "symbol_interpretation" ||
    pattern === "thematic_link" ||
    pattern === "character_psychology"
  ) {
    abstraction = "high";
    density = 0.72;
    memory = 0.55;
  } else if (
    pattern === "mechanism_breakdown" ||
    pattern === "terminology" ||
    pattern === "architecture_decomposition"
  ) {
    abstraction = "medium";
    density = 0.68;
    memory = 0.62;
  } else if (pattern === "timeline_chain" || pattern === "fact_recall") {
    abstraction = "low";
    density = 0.38;
    memory = 0.58;
  } else if (pattern === "cause_effect_chain" || pattern === "workflow_sequence") {
    abstraction = "medium";
    density = 0.55;
    memory = 0.64;
  }

  if (candidate.kind === "quiz") memory = Math.min(0.85, memory + 0.12);
  if (candidate.kind === "connection") density = Math.min(0.8, density + 0.08);
  if (/\d{4}|\d+%/.test(text)) memory = Math.min(0.9, memory + 0.1);

  let difficulty: LearnDifficultyLevel = "medium";
  if (density >= 0.65 || abstraction === "high") difficulty = "high";
  else if (density <= 0.42 && abstraction === "low") difficulty = "low";

  return {
    difficulty,
    abstractionLevel: abstraction,
    memoryWeight: Math.round(memory * 100) / 100,
    conceptualDensity: Math.round(density * 100) / 100,
  };
}

function inferRelationships(
  candidates: LearnCandidate[],
): Map<string, LearnCardRelationship[]> {
  const rels = new Map<string, LearnCardRelationship[]>();
  const ids = candidates.map((c, i) => stableCardId(c, i));

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const id = ids[i];
    const list: LearnCardRelationship[] = [];

    if (c.learnPattern === "timeline_chain" && i + 1 < candidates.length) {
      const next = candidates[i + 1];
      if (next.learnPattern === "timeline_chain" || YEAR.test(next.content)) {
        list.push({ type: "chronology_after", targetCardId: ids[i + 1] });
      }
    }

    if (c.learnPattern === "cause_effect_chain" && i > 0) {
      list.push({ type: "caused_by", targetCardId: ids[i - 1] });
      list.push({ type: "leads_to", targetCardId: ids[i - 1] });
    }

    if (c.kind === "connection" && i > 0) {
      list.push({ type: "related_to", targetCardId: ids[i - 1] });
    }

    if (c.learnPattern === "symbol_interpretation" && i > 0) {
      list.push({ type: "symbolizes", targetCardId: ids[i - 1] });
    }

    if (c.learnPattern === "dependency_chain" || c.learnPattern === "workflow_sequence") {
      if (i > 0) list.push({ type: "depends_on", targetCardId: ids[i - 1] });
    }

    if (list.length > 0) rels.set(id, list);
  }

  return rels;
}

const YEAR = /\b(1[0-9]{3}|20[0-2][0-9])\b/;

export function profilePatternBoost(
  pattern: LearnCardPattern | undefined,
  profile: AdaptiveLearnProfile,
): number {
  if (!pattern) return 0;
  return profile.preferredCardPatterns.includes(pattern) ? 0.14 : -0.04;
}

export function enrichCandidatesForProfile(
  candidates: LearnCandidate[],
  profile: AdaptiveLearnProfile,
): LearnCandidate[] {
  return candidates.map((c, i) => {
    const scores = scoreLearnDifficulty(c);
    const group = resolveGroup(c, profile);
    return {
      ...c,
      cardId: stableCardId(c, i),
      ...group,
      ...scores,
      importance: c.importance + profilePatternBoost(c.learnPattern, profile),
    };
  });
}

export function buildLearnDebugMeta(
  candidates: LearnCandidate[],
  profile: AdaptiveLearnProfile,
): AdaptiveLearnDebugMeta {
  const groupCounts = new Map<string, { title: string; count: number }>();
  let relationshipCount = 0;
  const stats: LearnDifficultyStats = {
    low: 0,
    medium: 0,
    high: 0,
    avgMemoryWeight: 0,
    avgConceptualDensity: 0,
  };

  let memSum = 0;
  let denSum = 0;

  for (const c of candidates) {
    if (c.groupId) {
      const prev = groupCounts.get(c.groupId);
      groupCounts.set(c.groupId, {
        title: c.groupTitle ?? c.groupId,
        count: (prev?.count ?? 0) + 1,
      });
    }
    relationshipCount += c.cardRelationships?.length ?? 0;
    if (c.difficulty === "low") stats.low += 1;
    else if (c.difficulty === "high") stats.high += 1;
    else stats.medium += 1;
    memSum += c.memoryWeight ?? 0.5;
    denSum += c.conceptualDensity ?? 0.5;
  }

  const n = Math.max(1, candidates.length);
  stats.avgMemoryWeight = Math.round((memSum / n) * 100) / 100;
  stats.avgConceptualDensity = Math.round((denSum / n) * 100) / 100;

  const learnGroups =
    profile.groups.length > 0
      ? profile.groups.map((g) => ({
          id: g.id,
          title: g.title,
          cardCount: groupCounts.get(g.id)?.count ?? 0,
        }))
      : [...groupCounts.entries()].map(([id, v]) => ({
          id,
          title: v.title,
          cardCount: v.count,
        }));

  return {
    adaptiveLearnProfileId: profile.profileId,
    learnGroups,
    relationshipCount,
    difficultyStats: stats,
  };
}

export function attachCardRelationships(candidates: LearnCandidate[]): LearnCandidate[] {
  const relMap = inferRelationships(candidates);
  return candidates.map((c, i) => {
    const id = stableCardId(c, i);
    const cardRelationships = relMap.get(id);
    return cardRelationships ? { ...c, cardId: id, cardRelationships } : { ...c, cardId: id };
  });
}

export function candidateToEnrichedOutput(
  candidate: LearnCandidate,
  base: LearnCardOutput,
): LearnCardOutput {
  return {
    ...base,
    ...(candidate.cardId ? { cardId: candidate.cardId } : {}),
    ...(candidate.groupId ? { groupId: candidate.groupId, groupTitle: candidate.groupTitle } : {}),
    ...(candidate.learnPattern ? { learnPattern: candidate.learnPattern } : {}),
    ...(candidate.difficulty ? { difficulty: candidate.difficulty } : {}),
    ...(candidate.abstractionLevel ? { abstractionLevel: candidate.abstractionLevel } : {}),
    ...(candidate.memoryWeight !== undefined ? { memoryWeight: candidate.memoryWeight } : {}),
    ...(candidate.conceptualDensity !== undefined
      ? { conceptualDensity: candidate.conceptualDensity }
      : {}),
    ...(candidate.cardRelationships?.length
      ? { cardRelationships: candidate.cardRelationships }
      : {}),
  };
}

/** Order selected cards by group priority for UI grouping. */
export function sortCandidatesByGroups(
  candidates: LearnCandidate[],
  profile: AdaptiveLearnProfile,
): LearnCandidate[] {
  if (profile.groupingStrategy === "flat" || profile.groups.length === 0) {
    return candidates;
  }

  const order = new Map(profile.groups.map((g, i) => [g.id, i]));
  return [...candidates].sort((a, b) => {
    const ai = a.groupId ? (order.get(a.groupId) ?? 99) : 99;
    const bi = b.groupId ? (order.get(b.groupId) ?? 99) : 99;
    return ai - bi;
  });
}
