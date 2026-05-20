/**
 * Phase Learn 6.1 — deterministic knowledge structure extraction.
 */

export type KnowledgeNodeType =
  | "concept"
  | "entity"
  | "event"
  | "timeline"
  | "cause_effect"
  | "conflict"
  | "transformation"
  | "decision"
  | "theme";

export type KnowledgeNode = {
  id: string;
  label: string;
  type: KnowledgeNodeType;
  importance: number;
  aliases?: string[];
  summary?: string;
  relatedNodeIds?: string[];
};

export type KnowledgeStructure = {
  nodes: KnowledgeNode[];
  majorThemes: string[];
  timelineMoments: string[];
  causalChains: Array<{ cause: string; effect: string }>;
  conflicts: string[];
  transformations: string[];
};

export type KnowledgeStructureInput = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings?: string[];
};

import type { LearnKnowledgeStructureDebugMeta } from "@/types/adaptive-learn";

export type { LearnKnowledgeStructureDebugMeta };

const TIMELINE_MARKERS =
  /\b(after|before|during|following|earlier|later|subsequently|meanwhile|in\s+\d{4}|by\s+\d{4}|since\s+\d{4}|until\s+\d{4})\b/i;
const YEAR_PATTERN = /\b(1[0-9]{3}|20[0-2][0-9]|3\s+Temmuz|temmuz)\b/i;
const DATE_EVENT =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i;

const TRANSFORMATION_MARKERS =
  /\b(became|become|shifted|transformed|evolved|transitioned|rebuilt|reformed|emerged|collapsed|recovered|escalat(?:ed|ion)|resistance)\b/i;

const CAUSALITY_MARKERS =
  /\b(because|therefore|thus|hence|led to|resulted in|triggered|caused|due to|as a result|so that|drove|forced)\b/i;

const CONFLICT_MARKERS =
  /\b(despite|however|although|yet|crisis|pressure|struggle|tension|conflict|contradiction|opposed|versus|vs\.|instability|backlash|controversy)\b/i;

const NARRATIVE_ARC_MARKERS =
  /\b(rise|fall|collapse|recovery|resistance|transformation|escalation|turning point|era|period|chapter|phase)\b/i;

const CONTRAST_MARKERS = /\b(while|whereas|unlike|in contrast|on the other hand|coexist|paradox|tension between)\b/i;

const WEAK_DEFINE_TITLE = /^what defines\b/i;

const STOP = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "from",
  "they",
  "their",
  "have",
  "been",
  "were",
  "will",
  "would",
  "could",
  "should",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "when",
  "where",
  "which",
  "while",
  "because",
  "also",
  "just",
  "very",
  "more",
  "most",
  "some",
  "such",
  "than",
  "then",
  "there",
  "these",
  "those",
  "what",
  "does",
  "define",
  "defines",
  "source",
  "emphasize",
  "major",
  "broader",
  "point",
  "entity",
]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_+|_+$)/g, "")
    .slice(0, 48);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && s.length <= 420);
}

function tokenize(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w)),
    ),
  ];
}

function capitalizedPhrases(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to|'s)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ??
    [];
  return [...new Set(matches.map((m) => m.trim()))].filter((m) => m.length > 2 && m.length < 56);
}

function themeFromSentence(sentence: string, entities: string[]): string | null {
  const lower = sentence.toLowerCase();
  if (TRANSFORMATION_MARKERS.test(sentence)) {
    const subject = entities[0] ?? "the subject";
    return `Transformation of ${subject}`;
  }
  if (CONFLICT_MARKERS.test(sentence)) {
    const subject = entities[0] ?? "this period";
    return `Tension around ${subject}`;
  }
  if (entities.length >= 2) {
    return `${entities[0]} and ${entities[1]}`;
  }
  if (entities[0] && lower.includes(entities[0].toLowerCase())) {
    return entities[0];
  }
  const nouns = tokenize(sentence).slice(0, 4);
  if (nouns.length >= 2) {
    return nouns
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return null;
}

function extractCausalChains(sentences: string[]): Array<{ cause: string; effect: string }> {
  const chains: Array<{ cause: string; effect: string }> = [];
  for (const sentence of sentences) {
    if (!CAUSALITY_MARKERS.test(sentence)) continue;
    const parts = sentence.split(/\b(?:because|therefore|thus|led to|resulted in|triggered|due to)\b/i);
    if (parts.length >= 2) {
      const cause = parts[0].trim().slice(0, 180);
      const effect = parts.slice(1).join(" ").trim().slice(0, 180);
      if (cause.length > 20 && effect.length > 20) {
        chains.push({ cause, effect });
        continue;
      }
    }
    const m = sentence.match(/^(.{20,160}?)\b(?:because|led to|resulted in)\b(.{20,180})$/i);
    if (m) chains.push({ cause: m[1].trim(), effect: m[2].trim() });
  }
  return chains.slice(0, 8);
}

function extractTimelineMoments(sentences: string[]): string[] {
  const moments: string[] = [];
  for (const sentence of sentences) {
    if (YEAR_PATTERN.test(sentence) || TIMELINE_MARKERS.test(sentence) || DATE_EVENT.test(sentence)) {
      moments.push(sentence.slice(0, 200));
    }
  }
  return [...new Set(moments)].slice(0, 10);
}

function extractConflicts(sentences: string[]): string[] {
  return sentences.filter((s) => CONFLICT_MARKERS.test(s)).slice(0, 8);
}

function extractTransformations(sentences: string[]): string[] {
  return sentences
    .filter((s) => TRANSFORMATION_MARKERS.test(s) || NARRATIVE_ARC_MARKERS.test(s))
    .slice(0, 8);
}

function extractMajorThemes(sentences: string[], title: string): string[] {
  const themeCounts = new Map<string, number>();
  const bump = (theme: string, weight = 1) => {
    const key = theme.trim();
    if (key.length < 4) return;
    themeCounts.set(key, (themeCounts.get(key) ?? 0) + weight);
  };

  bump(title, 3);
  for (const sentence of sentences) {
    const entities = capitalizedPhrases(sentence);
    const theme = themeFromSentence(sentence, entities);
    if (theme) bump(theme, 2);
    for (const entity of entities.slice(0, 2)) bump(entity, 1);
  }

  return [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);
}

function buildNodes(structure: Omit<KnowledgeStructure, "nodes">, sentences: string[]): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = [];
  let idx = 0;

  const push = (node: Omit<KnowledgeNode, "id">) => {
    nodes.push({ ...node, id: `kn_${idx++}` });
  };

  for (const theme of structure.majorThemes.slice(0, 6)) {
    push({
      label: theme,
      type: "theme",
      importance: 0.72,
      aliases: tokenize(theme).slice(0, 4),
    });
  }

  const entityCounts = new Map<string, number>();
  for (const sentence of sentences) {
    for (const entity of capitalizedPhrases(sentence)) {
      entityCounts.set(entity, (entityCounts.get(entity) ?? 0) + 1);
    }
  }
  for (const [entity, count] of [...entityCounts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)) {
    push({
      label: entity,
      type: "entity",
      importance: Math.min(0.9, 0.55 + count * 0.08),
      aliases: [entity.toLowerCase()],
    });
  }

  structure.timelineMoments.forEach((moment, i) => {
    push({
      label: moment.slice(0, 72),
      type: "timeline",
      importance: 0.68 - i * 0.02,
      summary: moment,
    });
  });

  structure.causalChains.forEach((chain, i) => {
    push({
      label: `${chain.cause.slice(0, 36)} → ${chain.effect.slice(0, 36)}`,
      type: "cause_effect",
      importance: 0.78 - i * 0.03,
      summary: `${chain.cause} → ${chain.effect}`,
      relatedNodeIds: [],
    });
  });

  structure.conflicts.forEach((conflict, i) => {
    push({
      label: conflict.slice(0, 72),
      type: "conflict",
      importance: 0.74 - i * 0.02,
      summary: conflict,
    });
  });

  structure.transformations.forEach((t, i) => {
    push({
      label: t.slice(0, 72),
      type: "transformation",
      importance: 0.7 - i * 0.02,
      summary: t,
    });
  });

  return nodes.slice(0, 24);
}

/** Extract structured knowledge graph from analysis text (no LLM). */
export function extractKnowledgeStructure(input: KnowledgeStructureInput): KnowledgeStructure {
  const corpus = [
    input.title,
    input.summary,
    ...input.keyInsights,
    ...(input.risksOrWarnings ?? []),
  ].join(" ");
  const sentences = splitSentences(corpus);

  const majorThemes = extractMajorThemes(sentences, input.title);
  const timelineMoments = extractTimelineMoments(sentences);
  const causalChains = extractCausalChains(sentences);
  const conflicts = extractConflicts(sentences);
  const transformations = extractTransformations(sentences);

  const partial = { majorThemes, timelineMoments, causalChains, conflicts, transformations };
  const nodes = buildNodes(partial, sentences);

  return { ...partial, nodes };
}

export function knowledgeStructureDebugFromStructure(
  structure: KnowledgeStructure,
  clusterCount = 0,
  removedDuplicateClusters = 0,
): LearnKnowledgeStructureDebugMeta {
  return {
    nodeCount: structure.nodes.length,
    clusterCount,
    causalChainCount: structure.causalChains.length,
    transformationCount: structure.transformations.length,
    conflictCount: structure.conflicts.length,
    timelineMomentCount: structure.timelineMoments.length,
    removedDuplicateClusters,
  };
}

export function isChronologySensitiveMode(modeId?: string | null, pipelineMode?: string | null): boolean {
  const id = (modeId ?? "").toLowerCase();
  const pipe = (pipelineMode ?? "").toLowerCase();
  return (
    id.includes("student") ||
    id.includes("historical") ||
    id.includes("timeline") ||
    id.includes("legal") ||
    id.includes("researcher") ||
    pipe === "academic" ||
    pipe === "legal"
  );
}

export function isWeakGenericLearnTitle(title: string): boolean {
  return (
    WEAK_DEFINE_TITLE.test(title.trim()) ||
    /^what is the (main |key )?(point|takeaway|insight)\??$/i.test(title.trim()) ||
    /^what point does the source emphasize\??$/i.test(title.trim()) ||
    /^major socio-?economic\b/i.test(title.trim())
  );
}

export { tokenize, capitalizedPhrases, slugify, CONFLICT_MARKERS, CONTRAST_MARKERS };
