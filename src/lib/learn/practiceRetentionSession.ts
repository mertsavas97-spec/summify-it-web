/**
 * Phase Learn 6.4 — practice session retention summaries and weak-card ordering.
 */

import type { PracticeSessionCard } from "@/lib/learn/practiceSessionTypes";
import {
  mergeRetentionDebug,
  retentionDebugFromStates,
  scoreCardRetention,
} from "@/lib/learn/retentionScoring";
import type {
  CardRetentionState,
  CardReviewOutcome,
  PracticeRetentionSummary,
} from "@/lib/learn/retentionTypes";
import type { LearnRetrievalType } from "@/types/adaptive-learn";

const RETRIEVAL_LABELS: Record<LearnRetrievalType, string> = {
  recognition: "recognition",
  recall: "factual recall",
  synthesis: "synthesis",
  comparison: "comparison",
  application: "application",
  chronology: "chronology",
  mechanism: "mechanism",
};

function conceptLabelFromCard(card: PracticeSessionCard): string {
  const anchor = card.memoryAnchor?.text?.trim();
  if (anchor && anchor.length <= 72) return anchor.replace(/\.$/, "");
  const title = card.label ?? card.prompt;
  const cleaned = title
    .replace(/^what (is|point|defines)\b/i, "")
    .replace(/^why did\b/i, "")
    .replace(/\?+$/, "")
    .trim();
  if (cleaned.length >= 12 && cleaned.length <= 72) return cleaned;
  if (card.sourceTrace?.sectionTitle) return card.sourceTrace.sectionTitle;
  return cleaned.slice(0, 56) || "This concept";
}

export function deriveWeakConcepts(
  cards: PracticeSessionCard[],
  outcomes: Record<string, CardReviewOutcome>,
  states: CardRetentionState[],
): string[] {
  const weakIds = new Set(
    states.filter((s) => s.retentionStrength === "weak" || s.reviewAgainCount > 0).map((s) => s.cardId),
  );

  const labels: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (!weakIds.has(card.id) && outcomes[card.id] !== "review_again") continue;
    const label = conceptLabelFromCard(card);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
    if (labels.length >= 5) break;
  }

  return labels;
}

export function deriveStrongConcepts(
  cards: PracticeSessionCard[],
  states: CardRetentionState[],
): string[] {
  const strongIds = new Set(
    states.filter((s) => s.retentionStrength === "strong" || s.retentionStrength === "stable").map((s) => s.cardId),
  );
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (!strongIds.has(card.id)) continue;
    const label = conceptLabelFromCard(card);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
    if (labels.length >= 4) break;
  }

  return labels;
}

function hardestRetrievalType(
  cards: PracticeSessionCard[],
  outcomes: Record<string, CardReviewOutcome>,
): LearnRetrievalType | undefined {
  const weights: Record<string, number> = {
    recognition: 1,
    recall: 2,
    chronology: 2,
    mechanism: 3,
    comparison: 3,
    application: 4,
    synthesis: 4,
  };

  let hardest: LearnRetrievalType | undefined;
  let max = 0;

  for (const card of cards) {
    if (outcomes[card.id] !== "review_again") continue;
    const t = card.retrievalType ?? "recall";
    const w = weights[t] ?? 2;
    if (w >= max) {
      max = w;
      hardest = t;
    }
  }

  if (hardest) return hardest;

  for (const card of cards) {
    const t = card.retrievalType ?? "recall";
    const w = weights[t] ?? 2;
    if (w > max) {
      max = w;
      hardest = t;
    }
  }

  return hardest;
}

export function buildSuggestedNextStep(
  summary: Pick<
    PracticeRetentionSummary,
    "weakCount" | "strongCount" | "hardestRetrievalType" | "weakConcepts" | "suggestedReviewCount"
  >,
): string {
  if (summary.suggestedReviewCount === 0) {
    return "Solid pass — revisit this analysis later or try a harder mode.";
  }

  const hardestKey = summary.hardestRetrievalType as LearnRetrievalType | undefined;
  const hardest = hardestKey ? RETRIEVAL_LABELS[hardestKey] : "mixed recall";

  if (summary.weakCount > 0 && summary.strongCount > 0) {
    return `You handled some ideas well, but ${hardest} cards need another pass.`;
  }

  if (summary.weakCount > 0) {
    return `Focus on ${hardest} — several concepts are still shaky.`;
  }

  if (summary.weakConcepts.length > 0) {
    return "Review weak cards once more, then regenerate a tighter practice set.";
  }

  return "Run Review weak cards to reinforce developing concepts.";
}

export function buildPracticeRetentionSummary(input: {
  analysisId: string;
  cards: PracticeSessionCard[];
  outcomes: Record<string, CardReviewOutcome>;
  states: CardRetentionState[];
}): PracticeRetentionSummary {
  const states = input.states;
  const debug = retentionDebugFromStates(states);
  const hardest = hardestRetrievalType(input.cards, input.outcomes);
  const weakConcepts = deriveWeakConcepts(input.cards, input.outcomes, states);
  const strongConcepts = deriveStrongConcepts(input.cards, states);

  const cardPrompts: Record<string, string> = {};
  for (const card of input.cards) {
    cardPrompts[card.id] = card.prompt;
  }

  const summary: PracticeRetentionSummary = {
    analysisId: input.analysisId,
    completedAt: new Date().toISOString(),
    sessionReviewedCount: Object.values(input.outcomes).filter((o) => o !== "skipped").length,
    cardStates: states,
    cardPrompts,
    strongConcepts,
    weakConcepts,
    hardestRetrievalType: hardest,
    suggestedNextStep: "",
    weakCount: debug.weakCount,
    developingCount: debug.developingCount,
    stableCount: debug.stableCount,
    strongCount: debug.strongCount,
    suggestedReviewCount: debug.suggestedReviewCount,
  };

  summary.suggestedNextStep = buildSuggestedNextStep(summary);
  mergeRetentionDebug(debug, hardest);

  return summary;
}

export function recordOutcomeForCard(
  card: PracticeSessionCard,
  outcome: CardReviewOutcome,
  previousStates: Record<string, CardRetentionState>,
  analysisId: string,
): CardRetentionState {
  const { state } = scoreCardRetention({
    cardId: card.id,
    outcome,
    recallDifficulty: card.recallDifficulty,
    retrievalType: card.retrievalType,
    cognitiveLevel: card.cognitiveLevel,
    previous: previousStates[card.id],
    analysisId,
  });
  return state;
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

/** Reorder weak cards: priority first, then easy → hard for scaffolding. */
export function orderWeakCardsForReview(
  cards: PracticeSessionCard[],
  statesById: Record<string, CardRetentionState>,
  weakCardIds: string[],
): PracticeSessionCard[] {
  const weakSet = new Set(weakCardIds);
  const weak = cards.filter((c) => weakSet.has(c.id));

  return [...weak].sort((a, b) => {
    const sa = statesById[a.id];
    const sb = statesById[b.id];
    const pa = sa?.reviewPriority ?? 50;
    const pb = sb?.reviewPriority ?? 50;
    if (pb !== pa) return pb - pa;

    const da = DIFFICULTY_ORDER[a.recallDifficulty ?? "medium"] ?? 1;
    const db = DIFFICULTY_ORDER[b.recallDifficulty ?? "medium"] ?? 1;
    if (da !== db) return da - db;

    const ra = sa?.reviewAgainCount ?? 0;
    const rb = sb?.reviewAgainCount ?? 0;
    return rb - ra;
  });
}

export function mapOutcomeToReviewRating(
  outcome: CardReviewOutcome,
): "again" | "good" | null {
  if (outcome === "got_it") return "good";
  if (outcome === "review_again") return "again";
  return null;
}

export function isReviewItemId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
