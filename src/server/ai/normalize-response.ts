import type { AnalysisResult, LearnCardOutput } from "./schemas";
import { LEARN_CARD_OUTPUT_TYPES } from "./schemas";
import type { TextAnalysisMode } from "./schemas";

const LIMITS = {
  keyInsights: 6,
  risksOrWarnings: 5,
  actionItems: 6,
  learnCards: 5,
} as const;

const DEFAULT_RISK_MESSAGE =
  "The source does not provide enough clear risk signals.";

const GENERIC_PHRASE_PATTERNS = [
  /engaging experience/i,
  /enhance productivity/i,
  /improve engagement/i,
  /drive innovation/i,
  /best practices/i,
  /leverage synergies/i,
  /holistic approach/i,
  /moving forward/i,
  /at the end of the day/i,
];

export type NormalizeOptions = {
  mode?: TextAnalysisMode;
};

function normalizeKey(item: string): string {
  return item.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeKey(text)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

function overlapRatio(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared += 1;
  }
  return shared / Math.min(setA.size, setB.size);
}

function isMostlyGenericPhrase(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 20) return false;
  return GENERIC_PHRASE_PATTERNS.some((p) => p.test(trimmed));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 320);
}

/** Remove empty strings and case-insensitive duplicates while preserving order. */
export function dedupeStringList(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

function dedupeAgainstCorpus(
  items: string[],
  corpus: string[],
  maxOverlap = 0.72,
): string[] {
  return items.filter((item) => {
    if (isMostlyGenericPhrase(item) && item.length < 120) return false;
    return !corpus.some((other) => overlapRatio(item, other) >= maxOverlap);
  });
}

function isValidLearnCard(card: LearnCardOutput): boolean {
  return (
    LEARN_CARD_OUTPUT_TYPES.includes(card.type) &&
    card.title.trim().length > 0 &&
    card.content.trim().length > 0
  );
}

function learnCardRepeatsSummary(card: LearnCardOutput, summary: string): boolean {
  const combined = `${card.title} ${card.content}`;
  return overlapRatio(combined, summary) >= 0.65;
}

function normalizeLearnCards(
  cards: LearnCardOutput[],
  summary: string,
  strictSummaryDedupe = true,
): LearnCardOutput[] {
  const seenTitles = new Set<string>();
  const seenContent = new Set<string>();
  const out: LearnCardOutput[] = [];

  for (const card of cards) {
    const normalized: LearnCardOutput = {
      type: card.type,
      title: card.title.trim(),
      content: card.content.trim(),
    };
    if (!isValidLearnCard(normalized)) continue;
    if (strictSummaryDedupe && learnCardRepeatsSummary(normalized, summary)) continue;

    const titleKey = normalizeKey(normalized.title);
    const contentKey = normalizeKey(normalized.content);
    if (seenTitles.has(titleKey) || seenContent.has(contentKey)) continue;

    seenTitles.add(titleKey);
    seenContent.add(contentKey);
    out.push(normalized);
    if (out.length >= LIMITS.learnCards) break;
  }

  return out;
}

function deriveKeyInsights(
  result: AnalysisResult,
  rawInsights: string[],
): string[] {
  const candidates: string[] = [];

  for (const insight of dedupeStringList(rawInsights)) {
    candidates.push(insight);
  }

  for (const card of result.learnCards) {
    if (card.content.length > 30) {
      candidates.push(`${card.title}: ${card.content.slice(0, 200).trim()}`);
    }
  }

  for (const action of result.actionItems) {
    if (action.trim().length > 20) candidates.push(action.trim());
  }

  for (const sentence of splitSentences(result.summary)) {
    candidates.push(sentence);
  }

  if (result.title.trim().length > 5) {
    candidates.push(`Central topic: ${result.title.trim()}`);
  }

  const deduped = dedupeStringList(candidates);
  return deduped.slice(0, 3);
}

function deriveActionItems(
  result: AnalysisResult,
  mode?: TextAnalysisMode,
): string[] {
  const fromSummary = splitSentences(result.summary).slice(0, 2);
  if (fromSummary.length > 0) {
    return fromSummary.map(
      (s) => `Follow up on: ${s.charAt(0).toLowerCase()}${s.slice(1)}`,
    );
  }

  if (mode === "creator") {
    return [
      "Pull 1–2 hooks from the summary for short-form posts.",
      "Map one story angle from the source into a thread or carousel outline.",
    ];
  }
  if (mode === "executive") {
    return ["Review the summary for decisions that need owner assignment."];
  }
  if (mode === "academic") {
    return ["Re-read the summary and note claims that need citation checks."];
  }
  if (mode === "legal") {
    return ["Flag any obligations in the summary that need legal review."];
  }

  return ["Review the summary and note follow-ups mentioned in the source."];
}

function repairLearnCards(result: AnalysisResult): LearnCardOutput[] {
  const relaxed = normalizeLearnCards(result.learnCards, result.summary, false);
  if (relaxed.length > 0) return relaxed.slice(0, LIMITS.learnCards);

  const sentences = splitSentences(result.summary);
  const cards: LearnCardOutput[] = [];

  if (sentences[0]) {
    cards.push({
      type: "concept",
      title: result.title.slice(0, 72) || "Core idea",
      content: sentences[0],
    });
  }
  if (sentences[1]) {
    cards.push({
      type: "why",
      title: "Why it matters",
      content: sentences[1],
    });
  }

  return cards.slice(0, 2);
}

function repairEmptySections(
  result: AnalysisResult,
  raw: AnalysisResult,
  options?: NormalizeOptions,
): AnalysisResult {
  let keyInsights = result.keyInsights;
  if (keyInsights.length === 0) {
    keyInsights = deriveKeyInsights(result, raw.keyInsights);
  }
  if (keyInsights.length === 0) {
    keyInsights = deriveKeyInsights(result, []);
  }

  let risksOrWarnings = result.risksOrWarnings;
  if (risksOrWarnings.length === 0) {
    risksOrWarnings = dedupeStringList(raw.risksOrWarnings);
  }
  if (risksOrWarnings.length === 0) {
    risksOrWarnings = [DEFAULT_RISK_MESSAGE];
  }

  let actionItems = result.actionItems;
  if (actionItems.length === 0) {
    actionItems = dedupeStringList(raw.actionItems);
  }
  if (actionItems.length === 0) {
    actionItems = deriveActionItems(result, options?.mode);
  }

  let learnCards = result.learnCards;
  if (learnCards.length === 0) {
    learnCards = repairLearnCards({ ...result, learnCards: raw.learnCards });
  }

  return {
    title: result.title,
    summary: result.summary,
    keyInsights: keyInsights.slice(0, LIMITS.keyInsights),
    risksOrWarnings: risksOrWarnings.slice(0, LIMITS.risksOrWarnings),
    actionItems: actionItems.slice(0, LIMITS.actionItems),
    learnCards: learnCards.slice(0, LIMITS.learnCards),
  };
}

function crossSectionDedupe(
  result: AnalysisResult,
  raw: AnalysisResult,
): AnalysisResult {
  const summary = result.summary.trim();
  const corpus = [summary];

  let keyInsights = dedupeAgainstCorpus(
    dedupeStringList(result.keyInsights),
    corpus,
    0.78,
  );
  if (keyInsights.length === 0 && raw.keyInsights.length > 0) {
    keyInsights = dedupeStringList(raw.keyInsights).slice(0, LIMITS.keyInsights);
  }
  corpus.push(...keyInsights);

  const risksOrWarnings = dedupeAgainstCorpus(
    dedupeStringList(result.risksOrWarnings),
    corpus,
    0.82,
  );
  corpus.push(...risksOrWarnings);

  const actionItems = dedupeAgainstCorpus(
    dedupeStringList(result.actionItems),
    corpus,
    0.78,
  );

  const learnCards = normalizeLearnCards(result.learnCards, summary);

  return {
    title: result.title.trim(),
    summary,
    keyInsights,
    risksOrWarnings,
    actionItems,
    learnCards,
  };
}

/**
 * Post-validation repair — no second AI call. Fills empty arrays conservatively.
 * Repair fallbacks are written in English; primary language enforcement is via prompts.
 */
export function normalizeAnalysisResult(
  result: AnalysisResult,
  options?: NormalizeOptions,
): AnalysisResult {
  const raw: AnalysisResult = {
    title: result.title.trim(),
    summary: result.summary.trim(),
    keyInsights: [...result.keyInsights],
    risksOrWarnings: [...result.risksOrWarnings],
    actionItems: [...result.actionItems],
    learnCards: result.learnCards.map((c) => ({ ...c })),
  };

  const deduped = crossSectionDedupe(raw, raw);
  return repairEmptySections(deduped, raw, options);
}

export function isUsableAnalysisCore(result: AnalysisResult): boolean {
  return result.title.trim().length > 0 && result.summary.trim().length > 0;
}
