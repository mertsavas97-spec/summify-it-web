/**
 * Phase Learn 4 — deterministic source traceability for learn cards.
 */

import type { PersonaAdaptivePlan } from "@/types/adaptive-analysis";
import type {
  LearnSourceTrace,
  LearnSourceTraceConfidence,
  LearnSourceTraceDebugMeta,
  LearnSourceTraceType,
} from "@/types/adaptive-learn";
import type { AnalysisResult } from "@/server/ai/schemas";
import type { LearnCardOutput } from "@/types/text-analysis";
import type { LearnCandidateSource } from "./types";

const MAX_EXCERPT = 280;

export type SourceTraceSection = {
  id: string;
  sectionTitle: string;
  sourceType: LearnSourceTraceType;
  text: string;
  pageNumber?: number;
  timestampStart?: string;
  timestampEnd?: string;
};

export type CandidateTraceHint = {
  source?: LearnCandidateSource;
  groupTitle?: string;
};

export type AttachSourceTraceInput = {
  analysis: Pick<
    AnalysisResult,
    "title" | "summary" | "keyInsights" | "risksOrWarnings" | "actionItems" | "learnCards"
  >;
  personaAdaptivePlan?: PersonaAdaptivePlan;
  /** Optional raw extracted text (PDF pages, transcript) for excerpt grounding. */
  extractedText?: string;
  uiSectionLabels?: PersonaAdaptivePlan["uiSectionLabels"];
  candidateHints?: Map<string, CandidateTraceHint>;
};

export type AttachSourceTraceResult = {
  cards: LearnCardOutput[];
  stats: LearnSourceTraceDebugMeta;
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

function overlapScore(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared += 1;
  }
  return shared / Math.min(setA.size, setB.size);
}

function extractEntities(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ??
    [];
  return [...new Set(matches.map((m) => m.trim().toLowerCase()))];
}

function entityOverlap(a: string, b: string): number {
  const ea = new Set(extractEntities(a));
  const eb = new Set(extractEntities(b));
  if (ea.size === 0 || eb.size === 0) return 0;
  let shared = 0;
  for (const e of ea) if (eb.has(e)) shared += 1;
  return shared / Math.min(ea.size, eb.size);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length >= 24);
}

function parseTimestampRange(text: string): { start?: string; end?: string } {
  const stamps = text.match(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g) ?? [];
  if (stamps.length === 0) return {};
  const start = stamps[0]?.replace(/[\[\]]/g, "");
  const end = stamps[stamps.length - 1]?.replace(/[\[\]]/g, "");
  return { start, end };
}

function parsePageChunks(extractedText: string): SourceTraceSection[] {
  const sections: SourceTraceSection[] = [];
  const pageBlocks = extractedText.split(/\n(?:---\s*)?(?:Page|PAGE)\s*(\d{1,4})\s*(?:---)?\n/g);

  if (pageBlocks.length > 1) {
    for (let i = 1; i < pageBlocks.length; i += 2) {
      const pageNum = Number.parseInt(pageBlocks[i], 10);
      const body = normalizeText(pageBlocks[i + 1] ?? "");
      if (body.length >= 40 && Number.isFinite(pageNum)) {
        sections.push({
          id: `page_${pageNum}`,
          sectionTitle: `Page ${pageNum}`,
          sourceType: "extracted_text",
          text: body,
          pageNumber: pageNum,
        });
      }
    }
    if (sections.length > 0) return sections;
  }

  const bracketPages = [...extractedText.matchAll(/\[Page\s*(\d{1,4})\]/gi)];
  if (bracketPages.length > 0) {
    let lastIndex = 0;
    for (const match of bracketPages) {
      const idx = match.index ?? 0;
      const pageNum = Number.parseInt(match[1], 10);
      const chunk = normalizeText(extractedText.slice(lastIndex, idx));
      if (chunk.length >= 40 && Number.isFinite(pageNum)) {
        sections.push({
          id: `page_${pageNum}`,
          sectionTitle: `Page ${pageNum}`,
          sourceType: "extracted_text",
          text: chunk,
          pageNumber: pageNum,
        });
      }
      lastIndex = idx + match[0].length;
    }
    const tail = normalizeText(extractedText.slice(lastIndex));
    if (tail.length >= 40) {
      sections.push({
        id: "page_tail",
        sectionTitle: "Source document",
        sourceType: "extracted_text",
        text: tail,
      });
    }
    if (sections.length > 0) return sections;
  }

  if (extractedText.trim().length >= 80) {
    sections.push({
      id: "extracted_full",
      sectionTitle: "Source document",
      sourceType: "extracted_text",
      text: normalizeText(extractedText).slice(0, 12000),
    });
  }

  return sections;
}

function mapCandidateSourceToTraceType(source?: LearnCandidateSource): LearnSourceTraceType | undefined {
  switch (source) {
    case "insight":
      return "insight";
    case "summary":
      return "summary";
    case "risk":
    case "action":
      return "analysis_section";
    case "ai_card":
      return "learn_card";
    case "synthesized":
      return "synthesized";
    default:
      return undefined;
  }
}

export function buildSourceTraceSections(input: AttachSourceTraceInput): SourceTraceSection[] {
  const { analysis, personaAdaptivePlan, uiSectionLabels, extractedText } = input;
  const sections: SourceTraceSection[] = [];

  if (extractedText?.trim()) {
    sections.push(...parsePageChunks(extractedText));
  }

  const summaryLabel = uiSectionLabels?.summary ?? "Summary";
  if (analysis.summary?.trim()) {
    sections.push({
      id: "summary",
      sectionTitle: summaryLabel,
      sourceType: "summary",
      text: normalizeText(analysis.summary),
    });
  }

  const insightsLabel = uiSectionLabels?.keyInsights ?? "Key insights";
  analysis.keyInsights?.forEach((insight, i) => {
    const text = normalizeText(insight);
    if (text.length < 20) return;
    const ts = parseTimestampRange(insight);
    sections.push({
      id: `insight_${i}`,
      sectionTitle: `${insightsLabel} · ${i + 1}`,
      sourceType: "insight",
      text,
      timestampStart: ts.start,
      timestampEnd: ts.end,
    });
  });

  const risksLabel = uiSectionLabels?.risks ?? "Risks & warnings";
  analysis.risksOrWarnings?.forEach((risk, i) => {
    const text = normalizeText(risk);
    if (text.length < 20) return;
    sections.push({
      id: `risk_${i}`,
      sectionTitle: `${risksLabel} · ${i + 1}`,
      sourceType: "analysis_section",
      text,
    });
  });

  const actionsLabel = uiSectionLabels?.actions ?? "Action items";
  analysis.actionItems?.forEach((action, i) => {
    const text = normalizeText(action);
    if (text.length < 20) return;
    sections.push({
      id: `action_${i}`,
      sectionTitle: `${actionsLabel} · ${i + 1}`,
      sourceType: "analysis_section",
      text,
    });
  });

  personaAdaptivePlan?.sections?.forEach((section) => {
    const related = [
      ...analysis.keyInsights,
      analysis.summary,
      ...analysis.risksOrWarnings,
      ...analysis.actionItems,
    ]
      .filter((t) => overlapScore(section.title, t) > 0.2 || overlapScore(section.purpose, t) > 0.15)
      .join(" ");
    if (related.length < 40) return;
    sections.push({
      id: `plan_${section.id}`,
      sectionTitle: section.title,
      sourceType: "analysis_section",
      text: normalizeText(related).slice(0, 2000),
    });
  });

  analysis.learnCards?.forEach((card, i) => {
    const text = normalizeText(`${card.title} ${card.content}`);
    if (text.length < 20) return;
    sections.push({
      id: `provider_card_${i}`,
      sectionTitle: card.groupTitle ?? "Learn card (analysis)",
      sourceType: "learn_card",
      text,
    });
  });

  return sections;
}

function findBestExcerpt(cardText: string, sectionText: string): string | null {
  const sentences = splitSentences(sectionText);
  if (sentences.length === 0) return null;

  let best: { sentence: string; score: number } | null = null;
  for (const sentence of sentences) {
    const score = overlapScore(cardText, sentence) * 0.7 + entityOverlap(cardText, sentence) * 0.3;
    if (!best || score > best.score) {
      best = { sentence, score };
    }
  }

  if (!best || best.score < 0.12) return null;
  if (!sectionText.toLowerCase().includes(best.sentence.toLowerCase().slice(0, 40))) {
    return null;
  }

  let excerpt = best.sentence;
  const idx = sentences.indexOf(best.sentence);
  if (idx >= 0 && idx + 1 < sentences.length) {
    const pair = `${best.sentence} ${sentences[idx + 1]}`;
    if (pair.length <= MAX_EXCERPT && overlapScore(cardText, pair) > best.score) {
      excerpt = pair;
    }
  }

  return excerpt.length > MAX_EXCERPT ? `${excerpt.slice(0, MAX_EXCERPT - 1)}…` : excerpt;
}

function scoreSection(
  card: LearnCardOutput,
  section: SourceTraceSection,
  hint?: CandidateTraceHint,
): number {
  const cardText = `${card.title} ${card.content}`;
  let score = overlapScore(cardText, section.text) * 0.55 + entityOverlap(cardText, section.text) * 0.35;

  if (hint?.groupTitle && overlapScore(hint.groupTitle, section.sectionTitle) > 0.25) {
    score += 0.15;
  }

  const preferred = mapCandidateSourceToTraceType(hint?.source);
  if (preferred && section.sourceType === preferred) score += 0.12;
  if (card.groupTitle && overlapScore(card.groupTitle, section.sectionTitle) > 0.3) score += 0.1;

  return score;
}

function traceOneCard(
  card: LearnCardOutput,
  sections: SourceTraceSection[],
  hint?: CandidateTraceHint,
): LearnSourceTrace | undefined {
  if (sections.length === 0) {
    return { sourceType: "synthesized", confidence: "low" };
  }

  let best: { section: SourceTraceSection; score: number } | null = null;
  for (const section of sections) {
    const score = scoreSection(card, section, hint);
    if (!best || score > best.score) best = { section, score };
  }

  if (!best || best.score < 0.14) {
    return {
      sourceType: "synthesized",
      sectionTitle: "From this analysis",
      confidence: "low",
    };
  }

  const excerpt = findBestExcerpt(`${card.title} ${card.content}`, best.section.text);
  let confidence: LearnSourceTraceConfidence = "low";
  if (best.score >= 0.42 && excerpt) confidence = "high";
  else if (best.score >= 0.22 && excerpt) confidence = "medium";
  else if (best.score >= 0.18) confidence = "medium";

  const trace: LearnSourceTrace = {
    sectionTitle: best.section.sectionTitle,
    sourceType: best.section.sourceType,
    confidence,
  };

  if (excerpt) trace.excerpt = excerpt;
  if (best.section.pageNumber != null) trace.pageNumber = best.section.pageNumber;
  if (best.section.timestampStart) trace.timestampStart = best.section.timestampStart;
  if (best.section.timestampEnd && best.section.timestampEnd !== best.section.timestampStart) {
    trace.timestampEnd = best.section.timestampEnd;
  }

  if (!excerpt && confidence !== "high") {
    trace.confidence = "low";
    if (!trace.sectionTitle) trace.sourceType = "synthesized";
  }

  return trace;
}

export function attachSourceTraceToLearnCards(
  cards: LearnCardOutput[],
  input: AttachSourceTraceInput,
): AttachSourceTraceResult {
  const sections = buildSourceTraceSections(input);
  const hints = input.candidateHints ?? new Map<string, CandidateTraceHint>();

  const stats: LearnSourceTraceDebugMeta = {
    tracedCardCount: 0,
    highConfidenceCount: 0,
    mediumConfidenceCount: 0,
    lowConfidenceCount: 0,
    missingTraceCount: 0,
  };

  const traced = cards.map((card, index) => {
    const hint =
      (card.cardId ? hints.get(card.cardId) : undefined) ??
      hints.get(`learn_${index}_${card.type}`);
    const sourceTrace = traceOneCard(card, sections, hint);
    if (!sourceTrace) {
      stats.missingTraceCount += 1;
      return card;
    }

    stats.tracedCardCount += 1;
    if (sourceTrace.confidence === "high") stats.highConfidenceCount += 1;
    else if (sourceTrace.confidence === "medium") stats.mediumConfidenceCount += 1;
    else stats.lowConfidenceCount += 1;

    return { ...card, sourceTrace };
  });

  return { cards: traced, stats };
}

export function sourceTraceDebugStats(
  stats: LearnSourceTraceDebugMeta,
): LearnSourceTraceDebugMeta | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return stats;
}

/** Compact context for review_items — preserves trace for practice UI. */
export function encodePracticeReviewContext(card: LearnCardOutput): string {
  const hasTrace = Boolean(card.sourceTrace?.excerpt || card.sourceTrace?.sectionTitle);
  const hasAnchor = Boolean(card.memoryAnchor?.text);
  if (!hasTrace && !hasAnchor) {
    return card.title;
  }
  return JSON.stringify({
    v: 1,
    label: card.title,
    trace: hasTrace ? card.sourceTrace : undefined,
    memoryAnchor: hasAnchor ? card.memoryAnchor : undefined,
  });
}

export type { ParsedPracticeContext } from "@/lib/learn/practiceReviewContext";
export { parsePracticeReviewContext } from "@/lib/learn/practiceReviewContext";
