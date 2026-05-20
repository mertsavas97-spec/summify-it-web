/**
 * Phase Learn 6.1 — semantic concept clustering to collapse duplicate knowledge regions.
 */

import { cognitiveQuestionKey } from "./learnCognitiveDedup";
import type { KnowledgeStructure } from "./knowledgeStructure";
import { capitalizedPhrases, tokenize } from "./knowledgeStructure";
import type { LearnCandidate } from "./types";

export type ConceptCluster = {
  id: string;
  label: string;
  memberIds: string[];
  strength: number;
};

/** Higher = fewer clusters (less aggressive collapse). */
const CLUSTER_OVERLAP_THRESHOLD = 0.58;
const ENTITY_OVERLAP_BOOST = 0.22;

function normalizeFingerprint(text: string): Set<string> {
  return new Set(tokenize(text));
}

function entitySet(text: string): Set<string> {
  return new Set(capitalizedPhrases(text).map((e) => e.toLowerCase()));
}

function jaccardLike(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) {
    if (b.has(t)) shared += 1;
  }
  return shared / Math.min(a.size, b.size);
}

function entityOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) {
    if (b.has(t)) shared += 1;
  }
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function clusterLabelForGroup(members: LearnCandidate[], structure: KnowledgeStructure): string {
  const entityCounts = new Map<string, number>();
  for (const m of members) {
    for (const e of capitalizedPhrases(`${m.title} ${m.content}`)) {
      entityCounts.set(e, (entityCounts.get(e) ?? 0) + 1);
    }
  }
  const topEntity = [...entityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const theme = structure.majorThemes.find((t) =>
    members.some((m) => `${m.title} ${m.content}`.toLowerCase().includes(t.toLowerCase().slice(0, 12))),
  );

  if (theme && topEntity) return `${theme} · ${topEntity}`;
  if (theme) return theme;
  if (topEntity) return `Concept cluster: ${topEntity}`;
  return members[0]?.title.slice(0, 56) ?? "Related concepts";
}

function candidateKey(c: LearnCandidate, index: number): string {
  return c.cardId ?? `cand_${index}_${c.kind}`;
}

export type ConceptClusterCollapseResult = {
  candidates: LearnCandidate[];
  clusters: ConceptCluster[];
  removedDuplicateClusters: number;
};

/**
 * Collapse candidates that belong to the same knowledge region; keep strongest per cluster.
 */
export function collapseCandidatesByConceptClusters(
  candidates: LearnCandidate[],
  structure: KnowledgeStructure,
): ConceptClusterCollapseResult {
  if (candidates.length <= 1) {
    return { candidates, clusters: [], removedDuplicateClusters: 0 };
  }

  const fingerprints = candidates.map((c) => normalizeFingerprint(`${c.title} ${c.content}`));
  const entities = candidates.map((c) => entitySet(`${c.title} ${c.content}`));
  const parent = candidates.map((_, i) => i);

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const tokenSim = jaccardLike(fingerprints[i], fingerprints[j]);
      const entSim = entityOverlap(entities[i], entities[j]);
      const score = tokenSim + entSim * ENTITY_OVERLAP_BOOST;
      if (score >= CLUSTER_OVERLAP_THRESHOLD) union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < candidates.length; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }

  const kept: LearnCandidate[] = [];
  const clusters: ConceptCluster[] = [];
  let removedDuplicateClusters = 0;

  for (const indices of groups.values()) {
    if (indices.length === 1) {
      kept.push(candidates[indices[0]]);
      continue;
    }

    const members = indices.map((i) => candidates[i]);
    const label = clusterLabelForGroup(members, structure);
    const memberIds = indices.map((i) => candidateKey(candidates[i], i));

    const byCognitive = new Map<string, LearnCandidate>();
    for (const m of members) {
      const op = cognitiveQuestionKey(m);
      const existing = byCognitive.get(op);
      if (!existing || m.importance > existing.importance) {
        byCognitive.set(op, m);
      }
    }

    const winners = [...byCognitive.values()].sort((a, b) => b.importance - a.importance);
    const maxKeep = Math.min(4, winners.length);

    clusters.push({
      id: `cluster_${clusters.length}`,
      label,
      memberIds,
      strength: winners[0]?.importance ?? 0.5,
    });

    removedDuplicateClusters += indices.length - maxKeep;

    for (const winner of winners.slice(0, maxKeep)) {
      const enriched: LearnCandidate = {
        ...winner,
        importance: Math.min(1, winner.importance + 0.06),
        groupTitle: winner.groupTitle ?? label,
        entities: [
          ...new Set([
            ...winner.entities,
            ...capitalizedPhrases(`${winner.title} ${winner.content}`),
          ]),
        ],
      };

      if (/^what defines\b/i.test(enriched.title) && label.length > 8) {
        enriched.title = `What role does ${label.slice(0, 40)} play in the source?`.slice(0, 72);
      }

      kept.push(enriched);
    }
  }

  return {
    candidates: kept.sort((a, b) => b.importance - a.importance),
    clusters,
    removedDuplicateClusters,
  };
}
