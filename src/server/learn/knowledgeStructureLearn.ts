/**
 * Phase Learn 6.1 — memory-oriented candidates and knowledge priority scoring.
 */

import type { AnalysisResult } from "@/server/ai/schemas";
import type { LearnCardPattern } from "@/types/adaptive-learn";
import type { KnowledgeStructure } from "./knowledgeStructure";
import {
  isChronologySensitiveMode,
  isWeakGenericLearnTitle,
  knowledgeStructureDebugFromStructure,
  slugify,
  type LearnKnowledgeStructureDebugMeta,
} from "./knowledgeStructure";
import type { ModeLearnStrategy } from "./modeLearnStrategies";
import type { LearnCandidate, LearnCardKind } from "./types";

export type KnowledgeStructureLearnPattern =
  | "causal_reasoning"
  | "timeline_turning_point"
  | "institutional_conflict"
  | "transformation_arc"
  | "contrast_analysis"
  | "narrative_tension"
  | "historical_significance";

const PATTERN_TO_LEARN: Record<KnowledgeStructureLearnPattern, LearnCardPattern> = {
  causal_reasoning: "cause_effect_chain",
  timeline_turning_point: "timeline_chain",
  institutional_conflict: "narrative_tension",
  transformation_arc: "thematic_link",
  contrast_analysis: "event_linkage",
  narrative_tension: "narrative_tension",
  historical_significance: "historical_anchor",
};

function draft(
  kind: LearnCardKind,
  title: string,
  content: string,
  pattern: LearnCardPattern,
  importance: number,
  groupTitle?: string,
): LearnCandidate {
  return {
    kind,
    title: title.slice(0, 72),
    content: content.slice(0, 380),
    source: "synthesized",
    importance,
    entities: [],
    learnPattern: pattern,
    groupTitle,
    cardId: `ks_${slugify(pattern)}_${slugify(title)}`,
  };
}

function primaryEntity(structure: KnowledgeStructure, fallback: string): string {
  const entity = structure.nodes.find((n) => n.type === "entity");
  return entity?.label ?? structure.majorThemes[0] ?? fallback;
}

function tensionTitle(entity: string, era?: string): string {
  const scope = era ? `${era}` : entity;
  return `What tension defines ${scope} according to the source?`.slice(0, 72);
}

function turningPointTitle(moment: string, entity: string): string {
  const snippet = moment.slice(0, 48).replace(/\?+$/, "");
  return `Why did ${snippet} become a turning point for ${entity}?`.slice(0, 72);
}

function causalTitle(cause: string, effect: string): string {
  const c = cause.slice(0, 40).replace(/\?+$/, "");
  const e = effect.slice(0, 40).replace(/\?+$/, "");
  return `How did ${c} lead to ${e}?`.slice(0, 72);
}

function contrastTitle(a: string, b: string): string {
  return `How did ${a} contrast with ${b} in this source?`.slice(0, 72);
}

function transformationTitle(line: string, entity: string): string {
  const hook = line.slice(0, 56).replace(/\?+$/, "");
  return `How did ${entity} change after: ${hook}?`.slice(0, 72);
}

/** Higher-order learn cards from extracted knowledge structure. */
export function synthesizeKnowledgeStructureCandidates(
  result: AnalysisResult,
  structure: KnowledgeStructure,
  options: {
    strategy: ModeLearnStrategy;
    intelligenceModeId?: string | null;
    pipelineMode?: string | null;
  },
): LearnCandidate[] {
  const out: LearnCandidate[] = [];
  const entity = primaryEntity(structure, result.title);
  const chronology = isChronologySensitiveMode(options.intelligenceModeId, options.pipelineMode);

  for (const chain of structure.causalChains.slice(0, 3)) {
    out.push(
      draft(
        "why_it_matters",
        causalTitle(chain.cause, chain.effect),
        `${chain.cause}\n\n→ ${chain.effect}`,
        PATTERN_TO_LEARN.causal_reasoning,
        0.82,
        "Causal reasoning",
      ),
    );
  }

  if (chronology) {
    for (const moment of structure.timelineMoments.slice(0, 3)) {
      out.push(
        draft(
          "memory_hook",
          turningPointTitle(moment, entity),
          moment,
          PATTERN_TO_LEARN.timeline_turning_point,
          0.8,
          "Timeline turning points",
        ),
      );
      out.push(
        draft(
          "connection",
          `What changed after this point in ${entity}'s story?`.slice(0, 72),
          moment,
          PATTERN_TO_LEARN.historical_significance,
          0.74,
          "Historical significance",
        ),
      );
    }
  }

  for (const conflict of structure.conflicts.slice(0, 2)) {
    out.push(
      draft(
        "connection",
        tensionTitle(entity),
        conflict,
        PATTERN_TO_LEARN.institutional_conflict,
        0.78,
        "Institutional conflict",
      ),
    );
    out.push(
      draft(
        "why_it_matters",
        `What contradiction defines this period for ${entity}?`.slice(0, 72),
        conflict,
        PATTERN_TO_LEARN.narrative_tension,
        0.76,
        "Narrative tension",
      ),
    );
  }

  for (const transform of structure.transformations.slice(0, 2)) {
    out.push(
      draft(
        "concept",
        transformationTitle(transform, entity),
        transform,
        PATTERN_TO_LEARN.transformation_arc,
        0.77,
        "Transformation arc",
      ),
    );
  }

  const themes = structure.majorThemes;
  if (themes.length >= 2) {
    out.push(
      draft(
        "connection",
        contrastTitle(themes[0], themes[1]),
        `${result.keyInsights.find((i) => i.toLowerCase().includes(themes[0].toLowerCase().slice(0, 8))) ?? themes[0]}\n\n↔ ${themes[1]}`,
        PATTERN_TO_LEARN.contrast_analysis,
        0.75,
        "Contrast analysis",
      ),
    );
  }

  if (/versus|vs\.|while|whereas|despite/i.test(result.summary)) {
    const sentence =
      splitSummaryContrast(result.summary) ??
      structure.conflicts[0] ??
      result.keyInsights[0];
    if (sentence) {
      out.push(
        draft(
          "why_it_matters",
          "What contradiction does the source highlight?",
          sentence,
          PATTERN_TO_LEARN.contrast_analysis,
          0.73,
          "Contrast analysis",
        ),
      );
    }
  }

  const narrativeInsight = result.keyInsights.find((i) =>
    /\b(rise|collapse|recovery|resistance|escalat|turning point)\b/i.test(i),
  );
  if (narrativeInsight) {
    out.push(
      draft(
        "memory_hook",
        `What narrative movement does the source trace around ${entity}?`.slice(0, 72),
        narrativeInsight,
        PATTERN_TO_LEARN.narrative_tension,
        0.72,
        "Narrative arc",
      ),
    );
  }

  void options.strategy;
  return out.filter((c) => !isWeakGenericLearnTitle(c.title));
}

function splitSummaryContrast(summary: string): string | null {
  const parts = summary.split(/\b(?:while|whereas|however|despite)\b/i);
  if (parts.length < 2) return null;
  const a = parts[0].trim();
  const b = parts.slice(1).join(" ").trim();
  if (a.length < 30 || b.length < 30) return null;
  return `${a}\n\n↔ ${b}`.slice(0, 380);
}

const HIGH_VALUE_PATTERNS = new Set<string>([
  "cause_effect_chain",
  "timeline_chain",
  "narrative_tension",
  "historical_anchor",
  "causal_reasoning",
  "timeline_turning_point",
  "institutional_conflict",
  "transformation_arc",
  "contrast_analysis",
  "historical_significance",
]);

/** Boost high-structure cards; penalize shallow/generic regions. */
export function applyKnowledgePriorityScoring(
  candidates: LearnCandidate[],
  structure: KnowledgeStructure,
): LearnCandidate[] {
  const themeTokens = new Set(
    structure.majorThemes.flatMap((t) => t.toLowerCase().split(/\s+/).filter((w) => w.length > 3)),
  );

  return candidates.map((c) => {
    let delta = 0;
    const text = `${c.title} ${c.content}`.toLowerCase();
    const pattern = c.learnPattern ?? "";

    if (HIGH_VALUE_PATTERNS.has(pattern)) delta += 0.12;
    if (structure.causalChains.length > 0 && /because|led to|resulted|triggered/i.test(text)) {
      delta += 0.1;
    }
    if (structure.conflicts.some((x) => overlapSnippet(text, x))) delta += 0.09;
    if (structure.timelineMoments.some((x) => overlapSnippet(text, x))) delta += 0.08;
    if (structure.transformations.some((x) => overlapSnippet(text, x))) delta += 0.08;

    for (const token of themeTokens) {
      if (token.length > 4 && text.includes(token)) {
        delta += 0.03;
        break;
      }
    }

    if (isWeakGenericLearnTitle(c.title)) delta -= 0.22;
    if (c.source === "summary" && text.length < 100) delta -= 0.08;
    if (/^what defines\b/i.test(c.title)) delta -= 0.18;
    if (/^(major|broader|key point|core idea)\b/i.test(c.title)) delta -= 0.14;

    return {
      ...c,
      importance: Math.max(0.05, Math.min(1, c.importance + delta)),
    };
  });
}

function overlapSnippet(haystack: string, needle: string): boolean {
  const slice = needle.toLowerCase().slice(0, 48);
  return slice.length > 12 && haystack.includes(slice);
}

export function learnKnowledgeStructureDebugStats(
  structure: KnowledgeStructure,
  clusterCount: number,
  removedDuplicateClusters: number,
): LearnKnowledgeStructureDebugMeta {
  return knowledgeStructureDebugFromStructure(structure, clusterCount, removedDuplicateClusters);
}

export { PATTERN_TO_LEARN };
