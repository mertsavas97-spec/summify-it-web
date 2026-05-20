/**
 * Phase Learn 6.3 — memory hooks & cognitive anchors (deterministic).
 */

import type { LearnCardMemoryAnchor, LearnMemoryAnchorsDebugMeta } from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import { calculateKnowledgeDensity } from "./knowledgeCompression";
import type { KnowledgeStructure } from "./knowledgeStructure";
import { capitalizedPhrases, isWeakGenericLearnTitle } from "./knowledgeStructure";
import type { ModeLearnStrategy } from "./modeLearnStrategies";

export type { LearnCardMemoryAnchor };

export type MemoryAnchorType =
  | "compression_phrase"
  | "contrast_anchor"
  | "timeline_anchor"
  | "emotional_anchor"
  | "symbolic_anchor"
  | "cause_effect_anchor"
  | "identity_anchor"
  | "mnemonic";

export type MemoryAnchor = {
  id: string;
  type: MemoryAnchorType;
  text: string;
  linkedCardIds: string[];
  strength: number;
  sourceConcepts: string[];
};

export type MemoryAnchorResult = {
  anchors: MemoryAnchor[];
  appliedCardCount: number;
  skippedCardCount: number;
  cards: LearnCardOutput[];
};

const BAD_HOOK =
  /^(remember|this is important|think about|key insight|note that|keep in mind|don't forget)/i;

const CHILDISH = /\b(lol|omg|btw|tbh|meme|rhyme time|pemdas hack)\b/i;

const YEAR = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;

const EMOTIONAL =
  /\b(crisis|resistance|transformation|identity|loss|recovery|pressure|turning point|rupture|legacy|tension|backlash)\b/i;

const CONTRAST =
  /\b(versus|vs\.|while|whereas|despite|however|contrast|paradox|coexist|instability|without)\b/i;

const SYMBOLIC = /\b(symbol|metaphor|emblem|identity|heritage|myth|arc|narrative)\b/i;

function stableCardId(card: LearnCardOutput, index: number): string {
  return card.cardId ?? `learn_${index}_${card.type}`;
}

function strengthLabel(n: number): LearnCardMemoryAnchor["strength"] {
  if (n >= 0.72) return "high";
  if (n >= 0.5) return "medium";
  return "low";
}

function isValidHook(text: string): boolean {
  const t = text.trim();
  if (t.length < 18 || t.length > 120) return false;
  if (BAD_HOOK.test(t)) return false;
  if (CHILDISH.test(t)) return false;
  if ((t.match(/\?/g) ?? []).length > 1) return false;
  if (/\b\w\s+→\s+the\s+/i.test(t)) return false;
  if (/^\s*however,\s/i.test(t)) return false;
  if (/\s+→\s*\.{0,2}$/.test(t)) return false;
  if (/\u2026/.test(t) && t.length < 50) return false;
  return true;
}

function preferredAnchorTypes(strategy: ModeLearnStrategy): MemoryAnchorType[] {
  const id = strategy.id;
  if (id === "student_historical") {
    return [
      "timeline_anchor",
      "cause_effect_anchor",
      "identity_anchor",
      "emotional_anchor",
      "contrast_anchor",
    ];
  }
  if (id === "student_scientific" || id === "technical") {
    return ["cause_effect_anchor", "compression_phrase", "contrast_anchor", "mnemonic"];
  }
  if (id === "executive" || id === "general") {
    return ["contrast_anchor", "compression_phrase", "cause_effect_anchor"];
  }
  if (id === "creator") {
    return ["emotional_anchor", "symbolic_anchor", "contrast_anchor", "compression_phrase"];
  }
  if (id === "legal") {
    return ["compression_phrase", "cause_effect_anchor", "contrast_anchor", "identity_anchor"];
  }
  if (id === "researcher") {
    return ["contrast_anchor", "compression_phrase", "cause_effect_anchor"];
  }
  if (id === "student_literary") {
    return ["symbolic_anchor", "emotional_anchor", "contrast_anchor", "identity_anchor"];
  }
  return ["compression_phrase", "contrast_anchor", "cause_effect_anchor", "emotional_anchor"];
}

function anchorSuitability(card: LearnCardOutput): number {
  const text = `${card.title} ${card.content}`;
  if (isWeakGenericLearnTitle(card.title)) return 0.1;
  if (BAD_HOOK.test(card.content)) return 0.15;

  let score = calculateKnowledgeDensity(card);
  if (card.type === "memory_hook") score += 0.15;
  if (card.type === "why_it_matters" || card.type === "connection") score += 0.12;
  if (EMOTIONAL.test(text)) score += 0.1;
  if (CONTRAST.test(text)) score += 0.08;
  if (capitalizedPhrases(text).length >= 2) score += 0.06;
  if (card.type === "quiz") score -= 0.2;

  return Math.min(1, score);
}

function extractContrastPair(text: string): [string, string] | null {
  const m = text.match(
    /\b([A-Za-z][\w\s]{2,28}?)\s+(?:vs\.?|versus|while|whereas|despite)\s+([A-Za-z][\w\s]{2,28})/i,
  );
  if (!m) return null;
  return [m[1].trim(), m[2].trim()];
}

function buildTimelineChainAnchor(structure: KnowledgeStructure): MemoryAnchor | null {
  const moments = structure.timelineMoments
    .map((m) => {
      const years = m.match(YEAR);
      const label = years?.[0] ?? m.split(/\s+/).slice(0, 4).join(" ");
      return label.length > 3 ? label : null;
    })
    .filter(Boolean) as string[];

  if (moments.length < 2) {
    const years = [
      ...new Set(
        structure.timelineMoments
          .join(" ")
          .match(YEAR) ?? [],
      ),
    ].slice(0, 4);
    if (years.length < 2) return null;
    const text = `${years.slice(0, -1).join(" → ")} → ${years[years.length - 1]}: arc in motion.`;
    if (!isValidHook(text)) return null;
    return {
      id: "anchor_timeline_chain",
      type: "timeline_anchor",
      text: text.slice(0, 110),
      linkedCardIds: [],
      strength: 0.78,
      sourceConcepts: years,
    };
  }

  const text = `${moments.slice(0, 4).join(" → ")}.`;
  if (!isValidHook(text)) return null;
  return {
    id: "anchor_timeline_chain",
    type: "timeline_anchor",
    text: text.slice(0, 110),
    linkedCardIds: [],
    strength: 0.8,
    sourceConcepts: moments,
  };
}

function buildContrastAnchorFromConflict(conflict: string, concepts: string[]): MemoryAnchor | null {
  const pair = extractContrastPair(conflict);
  if (pair) {
    const text = `${pair[0]} vs ${pair[1]} — tension the source keeps visible.`;
    if (!isValidHook(text)) return null;
    return {
      id: `anchor_contrast_${concepts[0] ?? "x"}`,
      type: "contrast_anchor",
      text: text.slice(0, 110),
      linkedCardIds: [],
      strength: 0.76,
      sourceConcepts: concepts.slice(0, 3),
    };
  }
  const ents = capitalizedPhrases(conflict);
  if (ents.length >= 1 && CONTRAST.test(conflict)) {
    const text = `${ents[0]}: pressure and promise pull in opposite directions.`;
    if (!isValidHook(text)) return null;
    return {
      id: "anchor_contrast_pressure",
      type: "contrast_anchor",
      text: text.slice(0, 110),
      linkedCardIds: [],
      strength: 0.68,
      sourceConcepts: ents.slice(0, 2),
    };
  }
  return null;
}

function buildCauseEffectAnchor(
  cause: string,
  effect: string,
  concepts: string[],
): MemoryAnchor | null {
  const c = cause.slice(0, 42).replace(/\?+$/, "");
  const e = effect.slice(0, 42).replace(/\?+$/, "");
  const text = `${c} → ${e}.`;
  if (!isValidHook(text)) return null;
  return {
    id: `anchor_causal_${concepts[0] ?? "link"}`,
    type: "cause_effect_anchor",
    text: text.slice(0, 110),
    linkedCardIds: [],
    strength: 0.74,
    sourceConcepts: concepts.slice(0, 3),
  };
}

function buildEmotionalAnchor(line: string, entity: string): MemoryAnchor | null {
  if (!EMOTIONAL.test(line)) return null;
  let text = "";
  if (/\bresistance\b/i.test(line)) {
    text = `${entity}: crisis met with collective resistance, not quiet acceptance.`;
  } else if (/\btransformation|shift|evolv/i.test(line)) {
    text = `${entity}'s story bends on transformation — identity rewritten under pressure.`;
  } else if (/\bcrisis|rupture\b/i.test(line)) {
    text = `Rupture point: ${entity} moves from routine conflict to lasting memory.`;
  } else if (/\brecovery|rebound\b/i.test(line)) {
    text = `${entity}: fall, then recovery — the arc is the lesson.`;
  } else {
    text = `${entity}: ${line.split(/[.!?]/)[0]?.slice(0, 56).trim() ?? "turning pressure"}.`;
  }
  if (!isValidHook(text)) return null;
  return {
    id: `anchor_emotional_${entity}`,
    type: "emotional_anchor",
    text: text.slice(0, 110),
    linkedCardIds: [],
    strength: 0.7,
    sourceConcepts: [entity],
  };
}

function buildIdentityAnchor(entity: string, line: string): MemoryAnchor | null {
  if (!/\b(identity|institution|era|club|movement|legacy|symbol)\b/i.test(line)) return null;
  const text = `${entity} = institutional identity under strain, not just a label.`;
  if (!isValidHook(text)) return null;
  return {
    id: `anchor_identity_${entity}`,
    type: "identity_anchor",
    text: text.slice(0, 110),
    linkedCardIds: [],
    strength: 0.72,
    sourceConcepts: [entity],
  };
}

function buildCompressionPhrase(card: LearnCardOutput): MemoryAnchor | null {
  const text = `${card.title} ${card.content}`;
  const ents = capitalizedPhrases(text);
  const contrast = extractContrastPair(text);

  if (contrast) {
    const hook = `${contrast[0]} + ${contrast[1]} = tension to remember.`;
    if (isValidHook(hook)) {
      return {
        id: "anchor_compress_contrast",
        type: "compression_phrase",
        text: hook.slice(0, 110),
        linkedCardIds: [],
        strength: 0.7,
        sourceConcepts: ents.slice(0, 2),
      };
    }
  }

  if (/\b(config|mismatch|failure|mechanism|pathway|silent)\b/i.test(text) && ents[0]) {
    const hook = `${ents[0]}: the silent failure path is misalignment, not noise.`;
    if (isValidHook(hook)) {
      return {
        id: "anchor_compress_tech",
        type: "compression_phrase",
        text: hook.slice(0, 110),
        linkedCardIds: [],
        strength: 0.68,
        sourceConcepts: ents.slice(0, 2),
      };
    }
  }

  if (/\b(growth|retention|revenue|margin|KPI)\b/i.test(text)) {
    const hook = "High growth without retention is a leaky bucket.";
    if (CONTRAST.test(text) || /\bwithout\b/i.test(text)) {
      return {
        id: "anchor_compress_biz",
        type: "compression_phrase",
        text: hook,
        linkedCardIds: [],
        strength: 0.75,
        sourceConcepts: ["growth", "retention"],
      };
    }
  }

  if (/\b(party|obligation|clause|condition|liability)\b/i.test(text)) {
    const hook = "Party + obligation + condition = clause risk.";
    if (isValidHook(hook)) {
      return {
        id: "anchor_compress_legal",
        type: "compression_phrase",
        text: hook,
        linkedCardIds: [],
        strength: 0.72,
        sourceConcepts: ents.slice(0, 3),
      };
    }
  }

  if (ents.length >= 2) {
    const clause = card.content.split(/[.!?]/).find((s) => s.trim().length >= 20 && s.length <= 80);
    if (clause) {
      const hook = `${ents[0]} ↔ ${ents[1]}: ${clause.trim().slice(0, 48)}.`;
      if (isValidHook(hook)) {
        return {
          id: "anchor_compress_pair",
          type: "compression_phrase",
          text: hook.slice(0, 110),
          linkedCardIds: [],
          strength: 0.62,
          sourceConcepts: ents.slice(0, 2),
        };
      }
    }
  }

  return null;
}

function buildSymbolicAnchor(line: string, entity: string): MemoryAnchor | null {
  if (!SYMBOLIC.test(line)) return null;
  const text = `${entity} works as symbol — meaning exceeds the literal event.`;
  if (!isValidHook(text)) return null;
  return {
    id: `anchor_symbol_${entity}`,
    type: "symbolic_anchor",
    text: text.slice(0, 110),
    linkedCardIds: [],
    strength: 0.66,
    sourceConcepts: [entity],
  };
}

function refineTitleWithAnchor(card: LearnCardOutput, anchor: LearnCardMemoryAnchor): string {
  const entity = capitalizedPhrases(`${card.title} ${card.content}`)[0];
  if (anchor.type === "timeline_anchor" && entity) {
    if (/what point|what defines|political meaning/i.test(card.title)) {
      return `Why did this period reshape ${entity}'s story?`.slice(0, 72);
    }
  }
  if (anchor.type === "emotional_anchor" && /\b3\s+temmuz|july|temmuz\b/i.test(`${card.title} ${card.content}`)) {
    return "Why did 3 July become a civil resistance memory?".slice(0, 72);
  }
  if (anchor.type === "identity_anchor" && entity && isWeakGenericLearnTitle(card.title)) {
    return `What tension defines the ${entity} era in this source?`.slice(0, 72);
  }
  if (anchor.type === "contrast_anchor" && !card.title.endsWith("?")) {
    return `What contradiction does the source highlight around ${entity ?? "this period"}?`.slice(
      0,
      72,
    );
  }
  if (anchor.strength === "high" && card.title.length > 58) {
    return card.title.replace(/^what point does the source emphasize about\b/i, "Why does").slice(
      0,
      72,
    );
  }
  return card.title;
}

function pickAnchorForCard(
  card: LearnCardOutput,
  index: number,
  structure: KnowledgeStructure,
  preferred: MemoryAnchorType[],
  pool: MemoryAnchor[],
): { anchor: MemoryAnchor; cardAnchor: LearnCardMemoryAnchor } | null {
  const cardId = stableCardId(card, index);
  const text = `${card.title} ${card.content}`;
  const ents = capitalizedPhrases(text);
  const entity = ents[0] ?? structure.majorThemes[0] ?? "the subject";

  const candidates: MemoryAnchor[] = [];

  for (const chain of structure.causalChains) {
    if (
      text.toLowerCase().includes(chain.cause.slice(0, 24).toLowerCase()) ||
      text.toLowerCase().includes(chain.effect.slice(0, 24).toLowerCase())
    ) {
      const built = buildCauseEffectAnchor(chain.cause, chain.effect, ents);
      if (built) candidates.push(built);
    }
  }

  for (const conflict of structure.conflicts) {
    if (overlap(text, conflict)) {
      const built = buildContrastAnchorFromConflict(conflict, ents);
      if (built) candidates.push(built);
    }
  }

  const emotional = buildEmotionalAnchor(text, entity);
  if (emotional) candidates.push(emotional);
  const identity = buildIdentityAnchor(entity, text);
  if (identity) candidates.push(identity);
  const symbolic = buildSymbolicAnchor(text, entity);
  if (symbolic) candidates.push(symbolic);
  const compression = buildCompressionPhrase(card);
  if (compression) candidates.push(compression);

  for (const a of pool) {
    if (a.linkedCardIds.length === 0 && preferred.includes(a.type)) candidates.push(a);
  }

  const ranked = candidates
    .filter((a) => preferred.includes(a.type) || a.strength >= 0.74)
    .sort((a, b) => b.strength - a.strength);

  const winner = ranked[0];
  if (!winner || winner.strength < 0.55) return null;

  const cardAnchor: LearnCardMemoryAnchor = {
    type: winner.type,
    text: winner.text,
    strength: strengthLabel(winner.strength),
  };

  return {
    anchor: { ...winner, linkedCardIds: [cardId] },
    cardAnchor,
  };
}

function overlap(a: string, b: string): boolean {
  const slice = b.toLowerCase().slice(0, 40);
  return slice.length > 10 && a.toLowerCase().includes(slice);
}

function maxAnchorsForSet(cardCount: number): number {
  if (cardCount <= 4) return 1;
  if (cardCount <= 8) return 3;
  if (cardCount <= 12) return 4;
  return 5;
}

export type ApplyMemoryAnchorsOptions = {
  strategy: ModeLearnStrategy;
  documentTitle?: string;
};

/**
 * Apply optional memory anchors to learn cards (post-compression, pre-source-trace).
 */
export function applyMemoryAnchorsToLearnCards(
  cards: LearnCardOutput[],
  structure: KnowledgeStructure,
  options: ApplyMemoryAnchorsOptions,
): MemoryAnchorResult {
  const preferred = preferredAnchorTypes(options.strategy);
  const pool: MemoryAnchor[] = [];

  const timeline = buildTimelineChainAnchor(structure);
  if (timeline) pool.push(timeline);

  if (structure.majorThemes.length >= 2) {
    const arc = `${structure.majorThemes[0]}: rise–rupture–resistance arc across the source.`;
    if (isValidHook(arc) && preferred.includes("emotional_anchor")) {
      pool.push({
        id: "anchor_narrative_arc",
        type: "emotional_anchor",
        text: arc.slice(0, 110),
        linkedCardIds: [],
        strength: 0.73,
        sourceConcepts: structure.majorThemes.slice(0, 2),
      });
    }
  }

  const scored = cards
    .map((card, index) => ({ card, index, suit: anchorSuitability(card) }))
    .sort((a, b) => b.suit - a.suit);

  const maxAnchors = maxAnchorsForSet(cards.length);
  const anchors: MemoryAnchor[] = [];
  const usedTypes = new Set<MemoryAnchorType>();
  let appliedCardCount = 0;

  const output = cards.map((c) => ({ ...c }));

  for (const { card, index, suit } of scored) {
    if (appliedCardCount >= maxAnchors) continue;
    if (suit < 0.42) continue;

    const picked = pickAnchorForCard(card, index, structure, preferred, pool);
    if (!picked) continue;

    if (usedTypes.has(picked.cardAnchor.type) && picked.cardAnchor.strength !== "high") {
      continue;
    }

    const out = output[index];
    out.memoryAnchor = picked.cardAnchor;
    if (picked.cardAnchor.strength !== "low") {
      out.title = refineTitleWithAnchor(out, picked.cardAnchor);
    }

    anchors.push(picked.anchor);
    usedTypes.add(picked.cardAnchor.type);
    appliedCardCount += 1;
  }

  return {
    anchors,
    appliedCardCount,
    skippedCardCount: cards.length - appliedCardCount,
    cards: output,
  };
}

export function learnMemoryAnchorsDebugStats(
  result: MemoryAnchorResult,
): LearnMemoryAnchorsDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;

  const anchorTypes: Record<string, number> = {};
  let highStrengthCount = 0;
  for (const card of result.cards) {
    if (!card.memoryAnchor) continue;
    const t = card.memoryAnchor.type;
    anchorTypes[t] = (anchorTypes[t] ?? 0) + 1;
    if (card.memoryAnchor.strength === "high") highStrengthCount += 1;
  }

  return {
    anchorCount: result.anchors.length,
    appliedCardCount: result.appliedCardCount,
    skippedCardCount: result.skippedCardCount,
    anchorTypes,
    highStrengthCount,
  };
}
