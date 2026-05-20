/**
 * Phase Learn 1 — deterministic learn card quality normalization.
 * Applied after card synthesis and before API/UI persistence.
 */

import type { LearnCardQualityStats } from "@/types/adaptive-learn";
import type { LearnCardOutput } from "@/types/text-analysis";
import {
  cognitiveQuestionKeyFromOutput,
  isSameCognitiveQuestion,
} from "./learnCognitiveDedup";
import { isWeakGenericLearnTitle, type KnowledgeStructure } from "./knowledgeStructure";
import { synthesizeKnowledgeStructureCandidates } from "./knowledgeStructureLearn";
import { resolveLearnStrategy } from "./applyModeLearnStrategy";
import {
  isBannedLearnTitle,
  isCreatorIntelligenceMode,
  rewriteTitleFromPattern,
  sanitizeLearnCardTitle,
  splitAnswerFromTitle,
  stripQuestionPrefixes,
} from "./learnTitleQuality";
import type { ModeLearnStrategy, ModeLearnStrategyInput, ModeStrategyPattern } from "./modeLearnStrategies";

export type { LearnCardQualityStats } from "@/types/adaptive-learn";

const MAX_TITLE_LENGTH = 110;
const CONTENT_COMPARE_LEN = 120;
const DEFAULT_TARGET_MIN = 6;
const DEFAULT_TARGET_MAX = 12;
const MAX_SAME_PATTERN = 3;

const PRESERVE_ACRONYMS = new Set([
  "AI",
  "PDF",
  "LLM",
  "RAG",
  "SEO",
  "ROI",
  "API",
  "URL",
  "USA",
  "UK",
  "EU",
  "GDP",
  "NASA",
  "UN",
]);

const GENERIC_TITLE_PATTERNS: RegExp[] = [
  /^what is the key insight\??$/i,
  /^key insight\??$/i,
  /^what is the (main |key )?takeaway\??$/i,
  /^explain this concept\??$/i,
  /^explain the concept\??$/i,
  /^why does this matter\??$/i,
  /^why it matters\??$/i,
  /^what should you remember\??$/i,
  /^what should i remember\??$/i,
  /^what memory hook helps recall\b/i,
  /^recall check\??$/i,
  /^core idea\??$/i,
  /^key point\??$/i,
  /^important concept\??$/i,
  /^overview of\b/i,
  /^understanding\b/i,
  /^the role of\b/i,
  /^this (concept|idea|topic)\b/i,
];

const GENERIC_TITLE_PREFIX = /^(explain|describe|what is|why does|why is|how does)\s+(this|the|a|an)\b/i;

const BROKEN_TITLE_TAIL =
  /\b(THE|OF|AND|TO|FOR|IN|ON|AT|BY|WITH|FROM|OR|AN|A|'S|ARC|MOVEMENT)\s*\.?\s*$/i;

const STOP_WORDS = new Set([
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
  "your",
  "visit",
  "notable",
  "examples",
  "movement",
  "figures",
  "buildings",
]);

export type LearnCardQualityContext = {
  documentTitle?: string;
  summary?: string;
  keyInsights?: string[];
  targetMin?: number;
  targetMax?: number;
  /** Phase Learn 2 — mode strategy (resolved from input if omitted). */
  strategy?: ModeLearnStrategy;
  strategyInput?: ModeLearnStrategyInput;
  knowledgeStructure?: KnowledgeStructure;
  intelligenceModeId?: string | null;
};

export type LearnCardQualityResult = {
  cards: LearnCardOutput[];
  stats: LearnCardQualityStats;
};

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEntities(text: string): string[] {
  const matches =
    text.match(/\b(?:[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,})\b/g) ??
    [];
  return [...new Set(matches.map((m) => m.trim()))].filter((m) => m.length >= 3);
}

function significantNouns(text: string, max = 8): string[] {
  const words = normalizeText(text)
    .split(" ")
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  return [...new Set(words)].slice(0, max);
}

function hasNamedEntity(text: string): boolean {
  return extractEntities(text).length > 0 || significantNouns(text, 4).length >= 2;
}

function isGenericTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 6) return true;
  if (isWeakGenericLearnTitle(t)) return true;
  if (GENERIC_TITLE_PATTERNS.some((p) => p.test(t))) return true;
  if (GENERIC_TITLE_PREFIX.test(t)) return true;
  if (/^explain\s+[A-Z]{2,}(\s+[A-Z]{2,})+/i.test(t)) return true;
  const screaming = (t.match(/\b[A-Z]{2,}\b/g) ?? []).filter((w) => !PRESERVE_ACRONYMS.has(w));
  if (screaming.length >= 3) return true;
  return false;
}

function fixScreamingCapsWord(word: string): string {
  if (PRESERVE_ACRONYMS.has(word)) return word;
  if (word.length <= 3 && /^[A-Z]+$/.test(word)) return word;
  if (/^[A-Z]{2,}$/.test(word)) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  return word;
}

function toSentenceCaseTitle(title: string): string {
  let t = title.trim().replace(/\s+/g, " ");
  if (!t) return t;

  t = t.replace(/\b([A-Za-z]+)\b/g, (word) => fixScreamingCapsWord(word));

  const smallWords = new Set([
    "the",
    "of",
    "and",
    "to",
    "for",
    "in",
    "on",
    "at",
    "by",
    "with",
    "from",
    "or",
    "an",
    "a",
    "vs",
    "versus",
  ]);

  const parts = t.split(/\s+/);
  const cased = parts.map((word, i) => {
    const lower = word.toLowerCase();
    if (i > 0 && smallWords.has(lower)) return lower;
    if (PRESERVE_ACRONYMS.has(word)) return word;
    if (/^[a-z]/.test(word) && word.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  let out = cased.join(" ");
  out = out.replace(/\s+'[Ss]\b/g, "'s");
  if (out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

function trimBrokenTitleTail(title: string): string {
  let t = title.trim();
  while (BROKEN_TITLE_TAIL.test(t) && t.split(/\s+/).length > 3) {
    t = t.replace(BROKEN_TITLE_TAIL, "").trim();
  }
  return t.replace(/[,;:]\s*$/, "").trim();
}

function phraseFromContent(content: string, documentTitle?: string): string | null {
  const entities = extractEntities(content);
  if (entities.length >= 2) {
    return `${entities[0]} and ${entities[1]}`.slice(0, MAX_TITLE_LENGTH);
  }
  if (entities.length === 1) {
    const nouns = significantNouns(content.replace(entities[0], ""), 2);
    if (nouns[0]) {
      return `${entities[0]} and ${nouns[0]}`.slice(0, MAX_TITLE_LENGTH);
    }
    return entities[0].slice(0, MAX_TITLE_LENGTH);
  }

  const nouns = significantNouns(content, 5);
  if (nouns.length >= 3) {
    return nouns.slice(0, 4).join(" ").slice(0, MAX_TITLE_LENGTH);
  }

  const firstSentence = content.split(/[.!?]/)[0]?.trim() ?? "";
  if (firstSentence.length >= 12) {
    return firstSentence.split(/\s+/).slice(0, 8).join(" ").slice(0, MAX_TITLE_LENGTH);
  }

  if (documentTitle && documentTitle.length > 5) {
    return documentTitle.slice(0, MAX_TITLE_LENGTH);
  }

  return null;
}

function rewriteGenericTitle(
  card: LearnCardOutput,
  documentTitle?: string,
  strategy?: ModeLearnStrategy,
  intelligenceModeId?: string | null,
): string | null {
  const content = card.content.trim();
  const phrase = phraseFromContent(content, documentTitle);
  if (!phrase) return null;

  const fromPattern = rewriteTitleFromPattern({ card, strategy, documentTitle });
  if (
    fromPattern &&
    !isBannedLearnTitle(fromPattern, {
      creatorMode: isCreatorIntelligenceMode(intelligenceModeId, strategy),
    })
  ) {
    return fromPattern.slice(0, MAX_TITLE_LENGTH);
  }

  switch (card.type) {
    case "memory_hook":
      if (extractEntities(content).length > 0) {
        return `What anchors recall of ${phrase}?`.slice(0, MAX_TITLE_LENGTH);
      }
      return `Memorable hook for ${phrase}`.slice(0, MAX_TITLE_LENGTH);
    case "why_it_matters":
    case "why":
      return `Why does ${phrase} matter?`.slice(0, MAX_TITLE_LENGTH);
    case "quiz": {
      const q = content.split("\n---\n")[0]?.trim() ?? content;
      if (q.endsWith("?") && !isGenericTitle(q)) return q.slice(0, MAX_TITLE_LENGTH);
      return `What claim does the source make about ${phrase}?`.slice(0, MAX_TITLE_LENGTH);
    }
    case "misconception":
      return `Common mistake about ${phrase}`.slice(0, MAX_TITLE_LENGTH);
    case "connection":
      return `${phrase}: how ideas connect`.slice(0, MAX_TITLE_LENGTH);
    default:
      if (extractEntities(content).length > 0) {
        return `What is ${phrase}?`.slice(0, MAX_TITLE_LENGTH);
      }
      return phrase.slice(0, MAX_TITLE_LENGTH);
  }
}

function normalizeCardTitle(
  card: LearnCardOutput,
  documentTitle?: string,
  strategy?: ModeLearnStrategy,
  intelligenceModeId?: string | null,
): { title: string; normalized: boolean } {
  let title = splitAnswerFromTitle(card.title);
  title = stripQuestionPrefixes(title);
  title = title.trim().replace(/^(insight|concept|quiz|memory hook|why):\s*/i, "");
  title = title.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  title = trimBrokenTitleTail(title);
  title = toSentenceCaseTitle(title);

  const wasGeneric = isGenericTitle(title) || isBannedLearnTitle(title, {
    creatorMode: isCreatorIntelligenceMode(intelligenceModeId, strategy),
  });
  if (wasGeneric) {
    const rewritten = rewriteGenericTitle(card, documentTitle, strategy, intelligenceModeId);
    if (rewritten && !isGenericTitle(rewritten)) {
      return { title: rewritten.slice(0, MAX_TITLE_LENGTH), normalized: true };
    }
  }

  title = sanitizeLearnCardTitle(
    { ...card, title },
    { documentTitle, strategy, intelligenceModeId },
  );

  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_TITLE_LENGTH - 1).trim()}…`;
  }

  return { title, normalized: wasGeneric || title !== card.title.trim() };
}

function passesTypeDiscipline(card: LearnCardOutput): boolean {
  const title = card.title.trim();
  const content = card.content.trim();
  if (!title || content.length < 24) return false;

  if (card.type === "misconception") {
    const hasContrast =
      /\b(myth|misconception|false|incorrect|not true|actually|contrary|mistake|confus)\b/i.test(
        `${title} ${content}`,
      );
    const fakeRisk =
      /approach critically|potential bias|further research|verify with a professional/i.test(
        content,
      );
    if (!hasContrast || fakeRisk) return false;
  }

  if (card.type === "memory_hook") {
    const isSummaryEcho =
      normalizeText(title).length > 12 &&
      normalizeText(content).startsWith(normalizeText(title).slice(0, 40));
    const hasHookSignal =
      /\b(remember|mnemonic|hook|analogy|like\s|as if|rhyme|acronym|anchor|phrase)\b/i.test(
        content,
      ) || content.length < 120;
    if (isSummaryEcho && !hasHookSignal) return false;
  }

  if (card.type === "why_it_matters" || card.type === "why") {
    const hasWhyLogic =
      /\b(because|therefore|so that|drives|matters|significance|impact|implication|reason|why)\b/i.test(
        content,
      );
    if (!hasWhyLogic && content.split(/\s+/).length < 18) return false;
  }

  if (card.type === "quiz") {
    const q = content.split("\n---\n")[0]?.trim() ?? content;
    if (!q.includes("?") && q.length < 20) return false;
    const answer = content.split("\n---\n")[1]?.trim() ?? "";
    if (answer && answer.length > 320) return false;
  }

  if (card.type === "concept") {
    if (isGenericTitle(title) && !hasNamedEntity(content)) return false;
  }

  return true;
}

function cardStrength(card: LearnCardOutput): number {
  let score = 0;
  if (!isGenericTitle(card.title)) score += 3;
  if (hasNamedEntity(card.title)) score += 2;
  if (hasNamedEntity(card.content)) score += 2;
  const len = card.content.length;
  if (len >= 40 && len <= 320) score += 1;
  if (card.memoryWeight != null && card.memoryWeight >= 0.55) score += 0.5;
  if (card.type === "quiz" && card.content.includes("---")) score += 1;
  if (card.learnPattern && card.learnPattern !== "fact_recall") score += 0.5;
  return score;
}

function patternKey(card: LearnCardOutput): string {
  return card.learnPattern ?? card.type;
}

function tokenOverlap(a: string, b: string): number {
  const setA = new Set(significantNouns(a, 12));
  const setB = new Set(significantNouns(b, 12));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared += 1;
  }
  return shared / Math.min(setA.size, setB.size);
}

function isNearDuplicate(a: LearnCardOutput, b: LearnCardOutput): boolean {
  if (isSameCognitiveQuestion(a, b)) return true;

  const titleA = normalizeText(a.title);
  const titleB = normalizeText(b.title);
  if (titleA && titleA === titleB) return true;

  const contentA = normalizeText(a.content.slice(0, CONTENT_COMPARE_LEN));
  const contentB = normalizeText(b.content.slice(0, CONTENT_COMPARE_LEN));
  if (contentA.length > 40 && contentA === contentB) return true;

  const combinedA = `${a.title} ${a.content.slice(0, CONTENT_COMPARE_LEN)}`;
  const combinedB = `${b.title} ${b.content.slice(0, CONTENT_COMPARE_LEN)}`;
  if (tokenOverlap(combinedA, combinedB) >= 0.78) return true;

  return false;
}

function dedupeCards(cards: LearnCardOutput[]): {
  cards: LearnCardOutput[];
  removed: number;
} {
  const kept: LearnCardOutput[] = [];
  let removed = 0;

  const sorted = [...cards].sort((a, b) => cardStrength(b) - cardStrength(a));

  for (const card of sorted) {
    const dupIndex = kept.findIndex((k) => isNearDuplicate(k, card));
    if (dupIndex >= 0) {
      removed += 1;
      if (cardStrength(card) > cardStrength(kept[dupIndex])) {
        kept[dupIndex] = card;
      }
      continue;
    }
    kept.push(card);
  }

  return { cards: kept, removed };
}

function enforcePatternDiversity(
  cards: LearnCardOutput[],
  targetMax: number,
  maxPerPattern = MAX_SAME_PATTERN,
  targetMin = DEFAULT_TARGET_MIN,
): LearnCardOutput[] {
  const out: LearnCardOutput[] = [];
  const used = new Set<string>();

  for (const card of cards) {
    if (out.length >= targetMin) break;
    const key = cognitiveQuestionKeyFromOutput(card);
    if (used.has(key)) continue;
    out.push(card);
    used.add(key);
  }

  const patternCounts = new Map<string, number>();
  for (const card of cards) {
    if (out.length >= targetMax) break;
    const cogKey = cognitiveQuestionKeyFromOutput(card);
    if (used.has(cogKey)) continue;
    const key = patternKey(card);
    const count = patternCounts.get(key) ?? 0;
    if (count >= maxPerPattern) continue;
    out.push(card);
    used.add(cogKey);
    patternCounts.set(key, count + 1);
  }

  for (const card of cards) {
    if (out.length >= targetMax) break;
    const cogKey = cognitiveQuestionKeyFromOutput(card);
    if (used.has(cogKey)) continue;
    out.push(card);
    used.add(cogKey);
  }

  return out.slice(0, targetMax);
}

function fallbackTitleForInsight(
  insight: string,
  strategy: ModeLearnStrategy | undefined,
): string | null {
  const trimmed = insight.trim();
  if (trimmed.length < 40) return null;
  const entities = extractEntities(trimmed);
  const subject = entities[0] ?? significantNouns(trimmed, 1)[0];
  if (!subject) return null;

  const priority = strategy?.fallbackPriorities[0];
  if (strategy?.promptStyle === "decision_recall") {
    return `What decision involves ${subject}?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (strategy?.promptStyle === "argument_reconstruction" || priority === "claim") {
    return `What claim does the source make about ${subject}?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (strategy?.promptStyle === "creative_angle") {
    return `What angle does ${subject} open?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (strategy?.promptStyle === "clause_recall") {
    return `What obligation involves ${subject}?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (strategy?.promptStyle === "mechanism_recall" || priority === "mechanism_breakdown") {
    return `How does ${subject} work in this source?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (priority === "cause_effect_chain" || strategy?.id.startsWith("student_historical")) {
    return `Why did ${subject} matter in this period?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (priority === "timeline_chain" || priority === "historical_anchor") {
    return `What happened regarding ${subject}?`.slice(0, MAX_TITLE_LENGTH);
  }
  if (priority === "timeline_chain" || priority === "historical_anchor") {
    return `Which period best captures the shift involving ${subject}?`.slice(0, MAX_TITLE_LENGTH);
  }
  return `Why does ${subject} matter in this document?`.slice(0, MAX_TITLE_LENGTH);
}

function learnPatternFromPriority(priority: ModeStrategyPattern): LearnCardOutput["learnPattern"] {
  const known = priority as LearnCardOutput["learnPattern"];
  if (
    typeof known === "string" &&
    [
      "timeline_chain",
      "cause_effect_chain",
      "terminology",
      "fact_recall",
      "mechanism_breakdown",
      "thematic_link",
      "quiz_application",
      "decision_consequence",
      "risk_opportunity",
      "tradeoff",
    ].includes(known)
  ) {
    return known;
  }
  return "terminology";
}

function buildFallbackCards(
  context: LearnCardQualityContext,
  existing: LearnCardOutput[],
): LearnCardOutput[] {
  const fallbacks: LearnCardOutput[] = [];
  const usedKeys = new Set(existing.map((c) => cognitiveQuestionKeyFromOutput(c)));
  const usedTitles = new Set(existing.map((c) => normalizeText(c.title)));
  const strategy = context.strategy;

  if (context.knowledgeStructure && strategy) {
    const structureCandidates = synthesizeKnowledgeStructureCandidates(
      {
        title: context.documentTitle ?? "Document",
        summary: context.summary ?? "",
        keyInsights: context.keyInsights ?? [],
        risksOrWarnings: [],
        actionItems: [],
        learnCards: existing,
      },
      context.knowledgeStructure,
      { strategy },
    );
    for (const c of structureCandidates) {
      if (fallbacks.length >= 8) break;
      const key = cognitiveQuestionKeyFromOutput({
        title: c.title,
        type: c.kind === "why_it_matters" ? "why_it_matters" : c.kind,
        learnPattern: c.learnPattern,
        content: c.content,
      });
      if (usedKeys.has(key) || usedTitles.has(normalizeText(c.title))) continue;
      fallbacks.push({
        type: c.kind === "why_it_matters" ? "why_it_matters" : (c.kind as LearnCardOutput["type"]),
        title: c.title,
        content: c.content,
        learnPattern: c.learnPattern,
        groupTitle: c.groupTitle,
      });
      usedKeys.add(key);
      usedTitles.add(normalizeText(c.title));
    }
  }

  const insights = context.keyInsights ?? [];
  for (const insight of insights) {
    if (fallbacks.length >= 6) break;
    const title = fallbackTitleForInsight(insight, strategy);
    if (!title || usedTitles.has(normalizeText(title))) {
      continue;
    }
    const cogKey = cognitiveQuestionKeyFromOutput({
      title,
      type: "concept",
      content: insight,
    });
    if (usedKeys.has(cogKey)) continue;
    const priority = strategy?.fallbackPriorities[0] ?? "terminology";

    fallbacks.push({
      type: strategy?.blockedKinds?.includes("quiz") ? "concept" : "concept",
      title,
      content: insight.trim().slice(0, 320),
      learnPattern: learnPatternFromPriority(priority),
    });
    usedTitles.add(normalizeText(title));
    usedKeys.add(cogKey);
  }

  if (fallbacks.length < 3 && context.summary) {
    const sentences = context.summary
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 50 && s.length <= 280);
    for (const sentence of sentences.slice(0, 2)) {
      const entities = extractEntities(sentence);
      if (entities.length === 0) continue;
      const title = `${entities[0]}: core idea`.slice(0, MAX_TITLE_LENGTH);
      if (usedTitles.has(normalizeText(title))) continue;
      fallbacks.push({
        type: "concept",
        title,
        content: sentence.slice(0, 320),
        learnPattern: "fact_recall",
      });
      usedTitles.add(normalizeText(title));
      if (fallbacks.length >= 2) break;
    }
  }

  return fallbacks;
}

function patternDistribution(cards: LearnCardOutput[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const card of cards) {
    const key = patternKey(card);
    dist[key] = (dist[key] ?? 0) + 1;
  }
  return dist;
}

/**
 * Normalize, filter, dedupe, and diversify learn cards deterministically.
 */
export function applyLearnCardQuality(
  cards: LearnCardOutput[],
  context: LearnCardQualityContext = {},
): LearnCardQualityResult {
  const strategy =
    context.strategy ??
    (context.strategyInput ? resolveLearnStrategy(context.strategyInput) : undefined);
  const enrichedContext = strategy ? { ...context, strategy } : context;

  const originalCardCount = cards.length;
  const targetMin = context.targetMin ?? DEFAULT_TARGET_MIN;
  const targetMax = context.targetMax ?? DEFAULT_TARGET_MAX;
  const maxPerPattern = strategy?.maxPerPattern ?? MAX_SAME_PATTERN;

  let normalizedTitleCount = 0;
  let removedGenericCount = 0;

  const normalized: LearnCardOutput[] = [];

  for (const card of cards) {
    const { title, normalized: didNormalize } = normalizeCardTitle(
      card,
      context.documentTitle,
      strategy,
      context.intelligenceModeId,
    );
    if (didNormalize) normalizedTitleCount += 1;

    const candidate: LearnCardOutput = { ...card, title };

    if (isGenericTitle(title)) {
      const rewritten = rewriteGenericTitle(
        candidate,
        enrichedContext.documentTitle,
        strategy,
        enrichedContext.intelligenceModeId,
      );
      if (!rewritten || isGenericTitle(rewritten)) {
        removedGenericCount += 1;
        continue;
      }
      candidate.title = rewritten;
      normalizedTitleCount += 1;
    }

    if (!passesTypeDiscipline(candidate)) {
      removedGenericCount += 1;
      continue;
    }

    if (!hasNamedEntity(candidate.title) && !hasNamedEntity(candidate.content)) {
      const phrase = phraseFromContent(candidate.content, context.documentTitle);
      if (!phrase) {
        removedGenericCount += 1;
        continue;
      }
    }

    normalized.push(candidate);
  }

  const { cards: deduped, removed: removedDuplicateCount } = dedupeCards(normalized);
  let filtered = enforcePatternDiversity(deduped, targetMax, maxPerPattern, targetMin);

  if (filtered.length < targetMin) {
    const fallbacks = buildFallbackCards(enrichedContext, filtered);
    const merged = dedupeCards([...filtered, ...fallbacks]).cards;
    filtered = enforcePatternDiversity(merged, targetMax, maxPerPattern, targetMin);
  }

  const stats: LearnCardQualityStats = {
    originalCardCount,
    filteredCardCount: filtered.length,
    removedGenericCount,
    removedDuplicateCount,
    normalizedTitleCount,
    finalPatternDistribution: patternDistribution(filtered),
  };

  return { cards: filtered, stats };
}

/** Light pass after reserve refill — dedupe only, no aggressive pattern culling. */
export function lightLearnCardQualityPass(
  cards: LearnCardOutput[],
  targetMax: number,
): LearnCardOutput[] {
  const { cards: deduped } = dedupeCards(cards);
  return deduped
    .filter((c) => !isGenericTitle(c.title) && !isWeakGenericLearnTitle(c.title))
    .slice(0, targetMax);
}

/** Dev-only stats for cognition / adaptive learn debug. */
export function learnCardQualityDebugStats(
  stats: LearnCardQualityStats,
): LearnCardQualityStats | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return stats;
}
