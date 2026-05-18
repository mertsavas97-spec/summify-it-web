import type { TextAnalysisMode } from "@/server/ai/schemas";
import { presentationTitlePenalty } from "./presentationSemanticTitles";
import { syntheticTitlePenalty } from "./refineLearnTitle";
import type { LearnCandidate, LearnCardKind } from "./types";

const NARRATOR_PATTERNS = [
  /the (speaker|video|presenter) (discusses|talks|covers|explains)/i,
  /this video (discusses|covers|explains)/i,
  /in this (video|talk|episode)/i,
];

const GENERIC_PATTERNS = [
  /important to note/i,
  /it is worth noting/i,
  /plays a key role/i,
  /significant impact/i,
  /various factors/i,
  /in today's world/i,
  /overall/i,
];

const MODE_KIND_BOOST: Record<TextAnalysisMode, Partial<Record<LearnCardKind, number>>> = {
  executive: { why_it_matters: 0.15, concept: 0.08 },
  academic: { concept: 0.18, misconception: 0.14, quiz: 0.08 },
  creator: { connection: 0.16, memory_hook: 0.14, concept: 0.06 },
  legal: { concept: 0.14, why_it_matters: 0.12, misconception: 0.1 },
};

function capitalizedTerms(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ?? [];
  return [...new Set(matches)].filter((t) => t.length > 2 && t.length < 40);
}

function genericPenalty(text: string): number {
  let penalty = 0;
  if (GENERIC_PATTERNS.some((p) => p.test(text))) penalty += 0.35;
  if (NARRATOR_PATTERNS.some((p) => p.test(text))) penalty += 0.28;
  return penalty;
}

function specificityScore(text: string, corpusEntities: Set<string>): number {
  const terms = capitalizedTerms(text);
  let score = Math.min(0.25, terms.length * 0.04);
  for (const t of terms) {
    if (corpusEntities.has(t.toLowerCase())) score += 0.06;
  }
  if (/\d/.test(text)) score += 0.08;
  if (text.length >= 80 && text.length <= 280) score += 0.06;
  return score;
}

function sourceBoost(source: LearnCandidate["source"]): number {
  switch (source) {
    case "ai_card":
      return 0.12;
    case "insight":
      return 0.1;
    case "risk":
      return 0.08;
    case "summary":
      return 0.04;
    case "action":
      return 0.06;
    case "synthesized":
      return 0.02;
    default:
      return 0;
  }
}

/**
 * Score candidates for importance (higher = keep).
 */
export function rankLearnCandidates(
  candidates: LearnCandidate[],
  mode: TextAnalysisMode,
  corpusEntities: Set<string>,
  options?: { isPresentation?: boolean },
): LearnCandidate[] {
  const isPresentation = options?.isPresentation === true;

  return candidates
    .map((c) => {
      const text = `${c.title} ${c.content}`;
      const modeBoost = MODE_KIND_BOOST[mode][c.kind] ?? 0;
      const fragmentPenalty = isPresentation
        ? presentationTitlePenalty(c.title, c.content)
        : 0;
      const importance =
        0.35 +
        specificityScore(text, corpusEntities) +
        sourceBoost(c.source) +
        modeBoost -
        genericPenalty(text) -
        syntheticTitlePenalty(c.title) -
        fragmentPenalty;

      return { ...c, importance: Math.max(0.05, Math.min(1, importance)) };
    })
    .sort((a, b) => b.importance - a.importance);
}
