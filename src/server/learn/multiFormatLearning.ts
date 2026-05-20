/**
 * Phase Learn 6.5 — multi-format learning generation (deterministic).
 */

import type { PracticeRetentionHint } from "@/lib/learn/retentionTypes";
import type {
  LearnFormatItem,
  LearnFormatItemEntry,
  LearnFormatType,
  LearnMultiFormatDebugMeta,
  MultiFormatLearnOutput,
} from "@/lib/learn/multiFormatTypes";
import type { ModeLearnStrategyInput } from "./modeLearnStrategies";
import { extractKnowledgeStructure, type KnowledgeStructure } from "./knowledgeStructure";
import type { LearnCardOutput } from "@/types/text-analysis";

const STUDENT_MODE_IDS = new Set([
  "the-student",
  "exam-prep",
  "flashcard-builder",
  "quiz-generator",
  "concept-explainer",
  "deep-dive",
  "smart-notes",
]);
const EXECUTIVE_MODE_IDS = new Set([
  "executive-brief",
  "the-executive",
  "swot-analyzer",
  "market-analyst",
  "startup-advisor",
  "meeting-notes-ai",
  "action-items",
  "decision-mapper",
  "timeline-builder",
  "key-points",
  "general-summary",
]);
const CREATOR_MODE_IDS = new Set([
  "the-creator",
  "the-journalist",
  "script-breakdown",
  "podcast-summary",
  "youtube-intelligence",
]);
const LEGAL_MODE_IDS = new Set(["contract-analyzer", "contract-summary"]);
const TECHNICAL_MODE_IDS = new Set(["technical-decoder"]);
const RESEARCHER_MODE_IDS = new Set(["the-researcher", "deep-dive"]);

const YEAR = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
const YEAR_RANGE = /\b(1[0-9]{3}|20[0-2][0-9])\s*[–—-]\s*(1[0-9]{3}|20[0-2][0-9])\b/;

function capitalized(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ??
    [];
  return [...new Set(matches.map((m) => m.trim()))].filter((m) => m.length > 2);
}

function pickTrace(cards: LearnCardOutput[], index: number): LearnCardOutput["sourceTrace"] {
  return cards[index % Math.max(1, cards.length)]?.sourceTrace;
}

function pickAnchor(cards: LearnCardOutput[], index: number): LearnCardOutput["memoryAnchor"] {
  return cards[index % Math.max(1, cards.length)]?.memoryAnchor;
}

function relatedIds(cards: LearnCardOutput[], hint: string): string[] {
  const key = hint.toLowerCase().slice(0, 24);
  return cards
    .filter((c) => `${c.title} ${c.content}`.toLowerCase().includes(key))
    .map((c) => c.cardId ?? c.title)
    .slice(0, 3);
}

function normalizeModeId(modeId: string): string {
  return modeId.trim().toLowerCase();
}

function isHistorical(modeId: string, structureFamily?: string, documentDomain?: string): boolean {
  const sf = (structureFamily ?? "").toLowerCase();
  const domain = (documentDomain ?? "").toLowerCase();
  return (
    sf.includes("historical") ||
    sf.includes("history") ||
    domain.includes("historical") ||
    modeId.includes("historical") ||
    modeId.includes("timeline")
  );
}

function isTechnical(modeId: string, structureFamily?: string, documentDomain?: string): boolean {
  const sf = (structureFamily ?? "").toLowerCase();
  const domain = (documentDomain ?? "").toLowerCase();
  return (
    TECHNICAL_MODE_IDS.has(modeId) ||
    sf.includes("technical") ||
    sf.includes("scientific") ||
    domain.includes("technical") ||
    domain.includes("scientific")
  );
}

function isCreator(modeId: string, pipelineMode?: string): boolean {
  return CREATOR_MODE_IDS.has(modeId) || pipelineMode === "creator";
}

function isLegal(modeId: string, structureFamily?: string): boolean {
  return LEGAL_MODE_IDS.has(modeId) || (structureFamily ?? "").includes("legal");
}

function isExecutive(modeId: string, pipelineMode?: string): boolean {
  return EXECUTIVE_MODE_IDS.has(modeId) || pipelineMode === "executive";
}

/** Resolve recommended format types for mode/domain/structure. */
export function getRecommendedLearnFormats(input: {
  modeId: string;
  documentDomain?: string;
  structureFamily?: string;
  pipelineMode?: string;
  knowledgeStructure?: KnowledgeStructure;
}): LearnFormatType[] {
  const modeId = normalizeModeId(input.modeId);
  const sf = input.structureFamily;
  const domain = input.documentDomain;
  const pipe = input.pipelineMode;

  if (isLegal(modeId, sf)) {
    return ["decision_map", "concept_map", "rapid_review", "flashcards"];
  }
  if (isTechnical(modeId, sf, domain)) {
    return ["mechanism_flow", "concept_map", "oral_quiz", "flashcards"];
  }
  if (isCreator(modeId, pipe)) {
    return ["narrative_chain", "rapid_review", "oral_quiz", "flashcards"];
  }
  if (isExecutive(modeId, pipe)) {
    return ["decision_map", "rapid_review", "concept_map", "flashcards"];
  }
  if (RESEARCHER_MODE_IDS.has(modeId) && !STUDENT_MODE_IDS.has(modeId)) {
    return ["rapid_review", "concept_map", "oral_quiz", "flashcards"];
  }

  if (isHistorical(modeId, sf, domain) || STUDENT_MODE_IDS.has(modeId) || pipe === "academic") {
    return ["timeline", "narrative_chain", "rapid_review", "flashcards"];
  }

  return ["flashcards", "rapid_review", "concept_map"];
}

function buildTimelineFormat(
  structure: KnowledgeStructure,
  cards: LearnCardOutput[],
  summary: string,
): LearnFormatItem | null {
  const entries: LearnFormatItemEntry[] = [];
  const seen = new Set<string>();

  for (const moment of structure.timelineMoments) {
    const range = moment.match(YEAR_RANGE);
    const years = moment.match(YEAR);
    const label = range
      ? `${range[1]}–${range[2]}`
      : years?.[0]
        ? years[0]
        : moment.slice(0, 32).replace(/\?+$/, "");
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const detail = moment.slice(0, 220);
    entries.push({
      id: `tl_${entries.length}`,
      label,
      detail,
      relatedCardIds: relatedIds(cards, detail),
      sourceTrace: pickTrace(cards, entries.length),
    });
    if (entries.length >= 8) break;
  }

  const corpus = summary;
  const rangeMatches = corpus.matchAll(YEAR_RANGE);
  for (const m of rangeMatches) {
    const label = `${m[1]}–${m[2]}`;
    if (seen.has(label)) continue;
    seen.add(label);
    const snippet = corpus.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + 120);
    entries.push({
      id: `tl_${entries.length}`,
      label,
      detail: snippet.trim(),
      relatedCardIds: relatedIds(cards, label),
    });
    if (entries.length >= 8) break;
  }

  if (entries.length === 0) return null;

  return {
    id: "format_timeline",
    type: "timeline",
    title: "Timeline",
    description: "Chronological moments from the source (dates only when present in text).",
    items: entries,
  };
}

function buildNarrativeChain(
  structure: KnowledgeStructure,
  cards: LearnCardOutput[],
): LearnFormatItem | null {
  const stages = ["Setup", "Rupture", "Response", "Consequence", "Outlook"];
  const sources = [
    ...structure.transformations.slice(0, 2),
    ...structure.conflicts.slice(0, 2),
    ...structure.causalChains.map((c) => `${c.cause} → ${c.effect}`).slice(0, 2),
  ];

  if (sources.length < 2 && structure.majorThemes.length < 2) {
    const arc = structure.majorThemes.slice(0, 3).join(" → ");
    if (arc.length < 20) return null;
    return {
      id: "format_narrative",
      type: "narrative_chain",
      title: "Narrative chain",
      description: arc,
      items: structure.majorThemes.slice(0, 5).map((t, i) => ({
        id: `nar_${i}`,
        label: stages[i] ?? `Stage ${i + 1}`,
        detail: t,
        relatedCardIds: relatedIds(cards, t),
        memoryAnchor: pickAnchor(cards, i),
      })),
    };
  }

  const items: LearnFormatItemEntry[] = [];
  for (let i = 0; i < Math.min(stages.length, sources.length); i++) {
    items.push({
      id: `nar_${i}`,
      label: stages[i],
      detail: sources[i].slice(0, 240),
      relatedCardIds: relatedIds(cards, sources[i]),
      sourceTrace: pickTrace(cards, i),
      memoryAnchor: pickAnchor(cards, i),
    });
  }

  if (items.length < 2) return null;

  const chainLabel = items.map((x) => x.label).join(" → ");

  return {
    id: "format_narrative",
    type: "narrative_chain",
    title: "Narrative chain",
    description: chainLabel,
    items,
  };
}

function buildConceptMap(
  structure: KnowledgeStructure,
  cards: LearnCardOutput[],
): LearnFormatItem | null {
  const central = structure.majorThemes[0] ?? capitalized(cards[0]?.title ?? "")[0];
  if (!central) return null;

  const items: LearnFormatItemEntry[] = [
    {
      id: "cm_central",
      label: central,
      detail: "Central concept",
      relatedCardIds: relatedIds(cards, central),
    },
  ];

  const relations = ["expresses", "combines", "responds to", "symbolizes", "connects to"];
  const related = [
    ...structure.majorThemes.slice(1, 4),
    ...structure.nodes.filter((n) => n.type === "entity").slice(0, 3).map((n) => n.label),
    ...structure.nodes.filter((n) => n.type === "theme").slice(1, 3).map((n) => n.label),
  ];

  for (let i = 0; i < Math.min(6, related.length); i++) {
    const label = related[i].slice(0, 56);
    if (label.toLowerCase() === central.toLowerCase()) continue;
    items.push({
      id: `cm_${i}`,
      label,
      detail: `${relations[i % relations.length]} ${central}`,
      relatedCardIds: relatedIds(cards, label),
      sourceTrace: pickTrace(cards, i + 1),
    });
  }

  if (items.length < 2) return null;

  return {
    id: "format_concept_map",
    type: "concept_map",
    title: "Concept map",
    description: `Grouped relationships around ${central}.`,
    items,
  };
}

function buildRapidReview(
  cards: LearnCardOutput[],
  summary: { title: string; summary: string; keyInsights: string[] },
  retention?: PracticeRetentionHint | null,
): LearnFormatItem {
  const weak = new Set(retention?.weakConcepts ?? []);
  const items: LearnFormatItemEntry[] = [];

  const remember = cards
    .filter((c) => {
      if (weak.size === 0) return true;
      const blob = `${c.title} ${c.content}`.toLowerCase();
      return [...weak].some((w) => blob.includes(w.toLowerCase().slice(0, 20)));
    })
    .slice(0, 5);

  remember.forEach((c, i) => {
    items.push({
      id: `rr_remember_${i}`,
      label: `Remember: ${c.title.slice(0, 56)}`,
      detail: c.content.slice(0, 180),
      relatedCardIds: c.cardId ? [c.cardId] : undefined,
      memoryAnchor: c.memoryAnchor,
      sourceTrace: c.sourceTrace,
    });
  });

  summary.keyInsights.slice(0, 3).forEach((insight, i) => {
    items.push({
      id: `rr_q_${i}`,
      label: `Likely question ${i + 1}`,
      detail: `What does the source claim about: ${insight.slice(0, 100)}?`,
      relatedCardIds: relatedIds(cards, insight),
    });
  });

  const misconceptions = cards.filter((c) => c.type === "misconception").slice(0, 2);
  misconceptions.forEach((c, i) => {
    items.push({
      id: `rr_conf_${i}`,
      label: `Common confusion ${i + 1}`,
      detail: c.content.slice(0, 160),
      relatedCardIds: c.cardId ? [c.cardId] : undefined,
    });
  });

  if (misconceptions.length === 0 && summary.keyInsights.length >= 2) {
    items.push({
      id: "rr_conf_0",
      label: "Common confusion",
      detail: `Do not confuse: ${summary.keyInsights[0].slice(0, 80)} vs ${summary.keyInsights[1].slice(0, 80)}`,
    });
  }

  items.push({
    id: "rr_summary",
    label: "One-sentence summary",
    detail: summary.summary.split(/(?<=[.!?])\s+/)[0]?.slice(0, 280) ?? summary.title,
  });

  return {
    id: "format_rapid_review",
    type: "rapid_review",
    title: "Rapid review",
    description: weak.size > 0 ? "Emphasizes concepts you marked for review." : "Concise revision sheet.",
    items: items.slice(0, 11),
  };
}

function buildOralQuiz(
  cards: LearnCardOutput[],
  retention?: PracticeRetentionHint | null,
): LearnFormatItem {
  const weakIds = new Set(retention?.weakCardIds ?? []);
  const pool = [...cards].sort((a, b) => {
    const aw = weakIds.has(a.cardId ?? "") ? 1 : 0;
    const bw = weakIds.has(b.cardId ?? "") ? 1 : 0;
    if (bw !== aw) return bw - aw;
    const diff = { easy: 0, medium: 1, hard: 2 };
    return (diff[a.recallDifficulty ?? "medium"] ?? 1) - (diff[b.recallDifficulty ?? "medium"] ?? 1);
  });

  const items: LearnFormatItemEntry[] = pool.slice(0, 8).map((c, i) => {
    const isQuiz = c.type === "quiz" && c.content.includes("---");
    const question = isQuiz
      ? c.content.split("\n---\n")[0]?.trim()
      : c.title.endsWith("?")
        ? c.title
        : `Why does ${c.title.slice(0, 48)} matter in this source?`;
    const answer = isQuiz ? c.content.split("\n---\n")[1]?.trim() : c.content.slice(0, 200);

    return {
      id: `oq_${i}`,
      label: question.slice(0, 90),
      detail: answer,
      relatedCardIds: c.cardId ? [c.cardId] : undefined,
      sourceTrace: c.sourceTrace,
    };
  });

  return {
    id: "format_oral_quiz",
    type: "oral_quiz",
    title: "Oral quiz",
    description: "Short spoken-style prompts; answers checkable after reveal.",
    items,
  };
}

function buildDecisionMap(
  summary: { risksOrWarnings: string[]; actionItems: string[]; keyInsights: string[] },
  cards: LearnCardOutput[],
): LearnFormatItem | null {
  const items: LearnFormatItemEntry[] = [];

  summary.actionItems.slice(0, 3).forEach((action, i) => {
    items.push({
      id: `dm_dec_${i}`,
      label: "Decision",
      detail: action.slice(0, 240),
      relatedCardIds: relatedIds(cards, action),
    });
  });

  summary.risksOrWarnings.slice(0, 3).forEach((risk, i) => {
    items.push({
      id: `dm_risk_${i}`,
      label: "Risk",
      detail: risk.slice(0, 240),
    });
  });

  const tradeoff = cards.find((c) => /versus|vs\.|trade|tradeoff|however/i.test(`${c.title} ${c.content}`));
  if (tradeoff) {
    items.push({
      id: "dm_trade",
      label: "Tradeoff",
      detail: `${tradeoff.title}: ${tradeoff.content.slice(0, 200)}`,
      relatedCardIds: tradeoff.cardId ? [tradeoff.cardId] : undefined,
    });
  }

  summary.keyInsights.slice(0, 1).forEach((insight, i) => {
    items.push({
      id: `dm_follow_${i}`,
      label: "Follow-up",
      detail: `Validate or monitor: ${insight.slice(0, 180)}`,
    });
  });

  if (items.length === 0) return null;

  return {
    id: "format_decision_map",
    type: "decision_map",
    title: "Decision map",
    description: "Decisions, risks, and tradeoffs from the analysis.",
    items,
  };
}

function buildMechanismFlow(cards: LearnCardOutput[]): LearnFormatItem | null {
  const mechanistic = cards.filter((c) =>
    /process|mechanism|step|config|api|workflow|input|output|failure|pathway/i.test(
      `${c.title} ${c.content}`,
    ),
  );
  if (mechanistic.length < 2 && cards.length < 3) return null;

  const pool = mechanistic.length >= 2 ? mechanistic : cards.slice(0, 5);
  const labels = ["Input", "Process", "Trigger", "Output", "Failure mode"];
  const items: LearnFormatItemEntry[] = [];

  for (let i = 0; i < Math.min(labels.length, pool.length); i++) {
    const c = pool[i];
    items.push({
      id: `mf_${i}`,
      label: labels[i],
      detail: `${c.title}: ${c.content.slice(0, 180)}`,
      relatedCardIds: c.cardId ? [c.cardId] : undefined,
      sourceTrace: c.sourceTrace,
    });
  }

  if (items.length < 3) return null;

  return {
    id: "format_mechanism",
    type: "mechanism_flow",
    title: "Mechanism flow",
    description: "Input → process → outcome (from technical patterns in source).",
    items,
  };
}

function buildFlashcardsFormat(cards: LearnCardOutput[]): LearnFormatItem {
  return {
    id: "format_flashcards",
    type: "flashcards",
    title: "Flashcards",
    description: "Primary practice cards — use Start practice above.",
    items: cards.slice(0, 12).map((c, i) => ({
      id: `fc_${i}`,
      label: c.title.slice(0, 72),
      detail: c.content.slice(0, 200),
      relatedCardIds: c.cardId ? [c.cardId] : undefined,
      sourceTrace: c.sourceTrace,
      memoryAnchor: c.memoryAnchor,
    })),
  };
}

export type BuildMultiFormatInput = {
  modeId: string;
  documentDomain?: string;
  structureFamily?: string;
  pipelineMode?: string;
  personaId?: string;
  learnCards: LearnCardOutput[];
  summary: {
    title: string;
    summary: string;
    keyInsights: string[];
    risksOrWarnings: string[];
    actionItems: string[];
  };
  knowledgeStructure?: KnowledgeStructure;
  retentionHint?: PracticeRetentionHint | null;
};

export function buildMultiFormatLearn(input: BuildMultiFormatInput): MultiFormatLearnOutput {
  const structure =
    input.knowledgeStructure ??
    extractKnowledgeStructure({
      title: input.summary.title,
      summary: input.summary.summary,
      keyInsights: input.summary.keyInsights,
      risksOrWarnings: input.summary.risksOrWarnings,
    });

  const recommended = getRecommendedLearnFormats({
    modeId: input.modeId,
    documentDomain: input.documentDomain,
    structureFamily: input.structureFamily,
    pipelineMode: input.pipelineMode,
    knowledgeStructure: structure,
  });

  const cards = input.learnCards;
  const formats: LearnFormatItem[] = [];
  const builders: Partial<Record<LearnFormatType, () => LearnFormatItem | null>> = {
    timeline: () => buildTimelineFormat(structure, cards, input.summary.summary),
    narrative_chain: () => buildNarrativeChain(structure, cards),
    concept_map: () => buildConceptMap(structure, cards),
    rapid_review: () => buildRapidReview(cards, input.summary, input.retentionHint),
    oral_quiz: () => buildOralQuiz(cards, input.retentionHint),
    decision_map: () => buildDecisionMap(input.summary, cards),
    mechanism_flow: () => buildMechanismFlow(cards),
    flashcards: () => buildFlashcardsFormat(cards),
  };

  for (const type of recommended) {
    const built = builders[type]?.();
    if (built && built.items.length > 0) formats.push(built);
  }

  if (!formats.some((f) => f.type === "flashcards")) {
    formats.push(buildFlashcardsFormat(cards));
  }

  const recommendedFormat = recommended[0] ?? "flashcards";

  return { recommendedFormat, formats };
}

export function buildMultiFormatLearnForSavedAnalysis(saved: {
  intelligence_mode: string | null;
  document_type: string | null;
  summary: BuildMultiFormatInput["summary"];
  learn_cards: LearnCardOutput[];
  metadata?: { structureFamily?: string } | null;
}): MultiFormatLearnOutput {
  const strategyInput: ModeLearnStrategyInput = {
    modeId: saved.intelligence_mode,
    structureFamily: saved.metadata?.structureFamily,
    domain: saved.document_type,
  };

  return buildMultiFormatLearn({
    modeId: saved.intelligence_mode ?? "general-summary",
    documentDomain: saved.document_type ?? undefined,
    structureFamily: strategyInput.structureFamily ?? undefined,
    pipelineMode: undefined,
    learnCards: saved.learn_cards ?? [],
    summary: saved.summary,
  });
}

export function learnMultiFormatDebugStats(output: MultiFormatLearnOutput): LearnMultiFormatDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;

  const timeline = output.formats.find((f) => f.type === "timeline");
  const conceptMap = output.formats.find((f) => f.type === "concept_map");
  const rapid = output.formats.find((f) => f.type === "rapid_review");

  return {
    recommendedFormats: output.formats.map((f) => f.type),
    generatedFormatCount: output.formats.length,
    timelineItemCount: timeline?.items.length ?? 0,
    conceptMapNodeCount: conceptMap?.items.length ?? 0,
    rapidReviewItemCount: rapid?.items.length ?? 0,
  };
}
