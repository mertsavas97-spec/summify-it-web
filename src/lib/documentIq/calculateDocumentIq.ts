export type DocumentIqInput = {
  extractedText: string;
  /** Optional source metadata (pages, type, etc). Kept generic for Phase 1. */
  metadata?: Record<string, unknown> | null;
};

export type DocumentIqResult = {
  iqScore: number;
  label: string;
  iqLabel: string;
  readability: number;
  complexity: number;
  density: number;
  actionability: number;
  charCount: number;
  estimatedReadingMinutes: number;
  whyThisScore: {
    positives: string[];
    negatives: string[];
  };
  detectedDocumentType: {
    type: string;
    confidence: number;
  };
  recommendedIntelligenceModeIds: string[];
};

const STOPWORDS_EN = new Set(
  [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "then",
    "else",
    "for",
    "to",
    "of",
    "in",
    "on",
    "with",
    "as",
    "by",
    "at",
    "from",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "it",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "we",
    "they",
    "he",
    "she",
    "them",
    "his",
    "her",
    "their",
    "our",
    "your",
    "my",
    "me",
    "us",
    "not",
    "no",
    "yes",
    "can",
    "could",
    "would",
    "should",
    "may",
    "might",
    "must",
    "will",
    "just",
    "also",
    "about",
    "into",
    "over",
    "under",
    "than",
    "so",
    "such",
    "very",
    "more",
    "most",
    "some",
    "any",
    "each",
    "all",
  ].map((w) => w.toLowerCase()),
);

const STOPWORDS_TR = new Set(
  [
    "ve",
    "veya",
    "ya",
    "ile",
    "için",
    "gibi",
    "olarak",
    "da",
    "de",
    "bu",
    "şu",
    "o",
    "bir",
    "daha",
    "en",
    "çok",
    "az",
    "mı",
    "mi",
    "mu",
    "mü",
    "ama",
    "fakat",
    "çünkü",
    "ki",
    "ise",
    "diye",
    "içinde",
    "üzerinde",
    "altında",
    "sonra",
    "önce",
    "ben",
    "sen",
    "biz",
    "siz",
    "onlar",
  ].map((w) => w.toLowerCase()),
);

const ACTION_SIGNALS_EN = [
  "should",
  "must",
  "need",
  "needs",
  "action",
  "decision",
  "decide",
  "risk",
  "opportunity",
  "requirement",
  "required",
  "step",
  "next",
  "plan",
  "recommendation",
  "recommend",
  "mitigate",
  "ensure",
  "deadline",
  "owner",
  "priority",
].map((s) => s.toLowerCase());

const ACTION_SIGNALS_TR = [
  "gerekir",
  "gerekli",
  "karar",
  "risk",
  "fırsat",
  "aksiyon",
  "öneri",
  "adım",
  "plan",
  "hedef",
  "yapılmalı",
  "zorunlu",
  "mutlaka",
  "öncelik",
  "takvim",
].map((s) => s.toLowerCase());

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number) {
  return Math.round(clamp(value));
}

function safeDivide(n: number, d: number) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0;
  return n / d;
}

function normalizeText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[\t\u00A0]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function splitSentences(text: string) {
  const parts = text
    .split(/(?<=[.!?。！？])\s+|\n{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : text.split(/\n+/g).map((s) => s.trim()).filter(Boolean);
}

function tokenizeWords(text: string) {
  // Keep Turkish chars. Remove punctuation but allow apostrophes in contractions.
  const cleaned = text
    .replace(/[^\p{L}\p{N}'’\s-]+/gu, " ")
    .replace(/[_]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  if (!cleaned) return [];
  return cleaned
    .split(/\s+/g)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ""))
    .filter(Boolean);
}

function getIqLabel(iqScore: number): string {
  if (iqScore <= 39) return "Low structure";
  if (iqScore <= 59) return "Moderate document";
  if (iqScore <= 79) return "Strong analysis fit";
  return "Excellent analysis fit";
}

function estimateReadingMinutesFromCharCount(charCount: number) {
  // Approximation rules from spec:
  // - 220 words/minute
  // - 5 chars/word
  const estimatedWords = charCount / 5;
  const minutes = estimatedWords / 220;
  return Math.max(1, Math.round(minutes));
}

function countRegexMatches(text: string, re: RegExp) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function detectDocumentType({
  text,
  paragraphs,
  avgParagraphWords,
  bulletCount,
  tableSignalCount,
  headingSignalCount,
  citationCount,
}: {
  text: string;
  paragraphs: string[];
  avgParagraphWords: number;
  bulletCount: number;
  tableSignalCount: number;
  headingSignalCount: number;
  citationCount: number;
}): { type: string; confidence: number } {
  const lower = text.toLowerCase();

  const legalKeywords = [
    "hereby",
    "whereas",
    "party",
    "parties",
    "agreement",
    "shall",
    "warranty",
    "indemnify",
    "liability",
    "governing law",
    "jurisdiction",
    "termination",
    "confidential",
  ];
  const academicKeywords = [
    "abstract",
    "introduction",
    "method",
    "methods",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references",
    "bibliography",
    "doi",
  ];
  const meetingKeywords = [
    "agenda",
    "attendees",
    "action items",
    "next steps",
    "minutes",
    "notes",
    "decisions",
  ];

  const legalHits = legalKeywords.reduce((sum, k) => sum + (lower.includes(k) ? 1 : 0), 0);
  const academicHits = academicKeywords.reduce((sum, k) => sum + (lower.includes(k) ? 1 : 0), 0);
  const meetingHits = meetingKeywords.reduce((sum, k) => sum + (lower.includes(k) ? 1 : 0), 0);

  const hasSlides = countRegexMatches(text, /^\s*(slide|agenda)\s+\d+\b/im) > 0;
  const hasManyBullets = bulletCount >= 18;
  const hasShortParagraphs = avgParagraphWords > 0 && avgParagraphWords <= 35;
  const hasLongParagraphs = avgParagraphWords >= 80;

  const scores: Array<{ type: string; score: number }> = [
    {
      type: "Legal Document",
      score: legalHits * 14 + (headingSignalCount >= 6 ? 8 : 0) + (hasLongParagraphs ? 10 : 0),
    },
    {
      type: "Research Paper",
      score:
        academicHits * 12 +
        (citationCount >= 8 ? 20 : citationCount >= 4 ? 10 : 0) +
        (headingSignalCount >= 8 ? 10 : 0) +
        (tableSignalCount >= 2 ? 8 : 0),
    },
    {
      type: "Lecture Notes",
      score:
        (hasManyBullets ? 20 : 0) +
        (hasShortParagraphs ? 12 : 0) +
        (headingSignalCount >= 6 ? 8 : 0) +
        (lower.includes("lecture") || lower.includes("week ") ? 10 : 0),
    },
    {
      type: "Meeting Notes",
      score: meetingHits * 16 + (hasManyBullets ? 8 : 0) + (headingSignalCount >= 4 ? 6 : 0),
    },
    {
      type: "Presentation",
      score: (hasSlides ? 26 : 0) + (hasManyBullets ? 14 : 0) + (paragraphs.length >= 10 ? 6 : 0),
    },
    {
      type: "Technical Documentation",
      score:
        (countRegexMatches(text, /^\s*#+\s+.+/gm) >= 6 ? 10 : 0) +
        (countRegexMatches(text, /\b(api|endpoint|request|response|payload|parameter|install|configuration)\b/gi) >= 10
          ? 20
          : 0) +
        (tableSignalCount >= 1 ? 8 : 0),
    },
    {
      type: "Business Report",
      score:
        (countRegexMatches(text, /\b(executive summary|kpi|revenue|margin|forecast|q\d|quarter)\b/gi) >= 3
          ? 22
          : 0) +
        (tableSignalCount >= 1 ? 10 : 0) +
        (headingSignalCount >= 6 ? 6 : 0),
    },
    {
      type: "Article",
      score:
        (headingSignalCount >= 4 ? 8 : 0) +
        (hasShortParagraphs ? 10 : 0) +
        (citationCount === 0 ? 6 : 0),
    },
    {
      type: "Book Chapter",
      score:
        (hasLongParagraphs ? 14 : 0) +
        (headingSignalCount >= 2 ? 6 : 0) +
        (citationCount <= 2 ? 6 : 0),
    },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0] ?? { type: "Article", score: 1 };
  const second = scores[1] ?? { type: best.type, score: 0 };
  const total = scores.reduce((sum, s) => sum + Math.max(0, s.score), 0) || 1;
  const margin = Math.max(0, best.score - second.score);
  const baseConfidence = clamp((best.score / total) * 140, 30, 96);
  const marginBoost = clamp(margin * 1.8, 0, 18);
  const confidence = roundScore(baseConfidence + marginBoost);

  return { type: best.type, confidence };
}

function buildWhyThisScore({
  readability,
  complexity,
  density,
  actionability,
}: {
  readability: number;
  complexity: number;
  density: number;
  actionability: number;
}): { positives: string[]; negatives: string[] } {
  const positives: string[] = [];
  const negatives: string[] = [];

  if (readability >= 70) positives.push("Clear section structure");
  else if (readability >= 55) positives.push("Readable overall flow");
  else negatives.push("Weak structure / long blocks");

  if (density >= 72) positives.push("High information density");
  else if (density >= 55) positives.push("Moderate information density");
  else negatives.push("Low information density");

  if (complexity >= 75) positives.push("Advanced terminology and concepts");
  else if (complexity <= 35) positives.push("Accessible complexity");
  else positives.push("Moderate complexity");

  if (actionability >= 70) positives.push("Action-oriented content");
  else if (actionability <= 35) negatives.push("Limited action-oriented content");

  return { positives, negatives };
}

function mapIqScoreToBetterLabel({
  readability,
  complexity,
  density,
  actionability,
}: {
  readability: number;
  complexity: number;
  density: number;
  actionability: number;
}): string {
  // Heuristic label mapping from the same four metrics.
  if (complexity >= 75 && density >= 70) return "Dense Technical Material";
  if (actionability >= 70 && readability >= 55) return "Action-Oriented Document";
  if (readability >= 72 && density >= 65 && complexity <= 60) return "Study Friendly";
  if (complexity >= 65 && density >= 60) return "Research Ready";
  if (readability >= 68 && actionability >= 55 && density >= 50) return "Executive Friendly";
  if (readability >= 60 && density <= 52 && actionability <= 45) return "Narrative Content";
  if (readability >= 70 && density <= 55 && bulletCountish(actionability, density, complexity)) {
    // small nudge toward presentation style when dense/action low but readability high.
    return "Presentation Ready";
  }
  if (complexity >= 60 && density >= 55) return "Academic Source";
  return "Study Friendly";
}

function bulletCountish(actionability: number, density: number, complexity: number) {
  // tiny helper to avoid introducing new inputs into label mapping.
  return actionability < 50 && density < 60 && complexity < 60;
}

function recommendIntelligenceModes({
  detectedType,
  actionability,
  complexity,
  density,
}: {
  detectedType: string;
  actionability: number;
  complexity: number;
  density: number;
}): string[] {
  // Uses existing mode ids (some may be locked; recommendations can still show them).
  const base: string[] = [];

  if (detectedType === "Research Paper") {
    base.push("the-student", "deep-dive", "the-researcher");
  } else if (detectedType === "Business Report") {
    base.push("executive-brief", "deep-dive", "general-summary");
  } else if (detectedType === "Lecture Notes") {
    base.push("the-student", "quiz-generator", "exam-prep");
  } else if (detectedType === "Technical Documentation") {
    base.push("deep-dive", "general-summary", "key-points");
  } else if (detectedType === "Legal Document") {
    base.push("contract-analyzer", "deep-dive", "general-summary");
  } else if (detectedType === "Presentation") {
    base.push("executive-brief", "key-points", "general-summary");
  } else if (detectedType === "Meeting Notes") {
    base.push("executive-brief", "key-points", "general-summary");
  } else {
    base.push("general-summary", "deep-dive", "the-student");
  }

  // Adjust for strong action signals
  if (actionability >= 70 && !base.includes("executive-brief")) {
    base.unshift("executive-brief");
  }
  // Adjust for high complexity + density
  if (complexity >= 72 && density >= 70 && !base.includes("deep-dive")) {
    base.unshift("deep-dive");
  }

  // Unique + top 3
  return Array.from(new Set(base)).slice(0, 3);
}

export function calculateDocumentIq({ extractedText }: DocumentIqInput): DocumentIqResult {
  const text = normalizeText(extractedText);
  const charCount = text.length;

  const paragraphs = text.split(/\n{2,}/g).filter((p) => p.trim().length > 0);
  const lineBreaks = (text.match(/\n/g) ?? []).length;
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgParagraphWords = safeDivide(wordCount, paragraphCount);

  const avgSentenceLen = safeDivide(wordCount, sentenceCount);
  const avgWordLen = safeDivide(words.reduce((sum, w) => sum + w.length, 0), Math.max(1, wordCount));
  const uniqueWordCount = new Set(words.map((w) => w.toLowerCase())).size;
  const uniqueWordRatio = safeDivide(uniqueWordCount, Math.max(1, wordCount));
  const longWordRatio = safeDivide(words.filter((w) => w.length >= 9).length, Math.max(1, wordCount));
  const numericRatio = safeDivide(words.filter((w) => /\d/.test(w)).length, Math.max(1, wordCount));
  const uppercaseTokenRatio = safeDivide(
    words.filter((w) => /[A-ZÇĞİÖŞÜ]/.test(w) && w.toUpperCase() === w && w.length >= 2).length,
    Math.max(1, wordCount),
  );

  const stopwords = (w: string) => {
    const lw = w.toLowerCase();
    return STOPWORDS_EN.has(lw) || STOPWORDS_TR.has(lw);
  };
  const stopwordRatio = safeDivide(words.filter(stopwords).length, Math.max(1, wordCount));

  // Repetition: measure how concentrated the most common words are.
  const freq = new Map<string, number>();
  for (const w of words) {
    const lw = w.toLowerCase();
    freq.set(lw, (freq.get(lw) ?? 0) + 1);
  }
  const sorted = Array.from(freq.values()).sort((a, b) => b - a);
  const top10Share = safeDivide(sorted.slice(0, 10).reduce((a, b) => a + b, 0), Math.max(1, wordCount));

  // Technical-looking tokens: hyphenated terms, camelCase-ish, or with separators.
  const technicalRatio = safeDivide(
    words.filter((w) => /[A-Za-z]{3,}[A-Z][a-z]/.test(w) || /\w+-\w+/.test(w) || /\w+\/.+/.test(w)).length,
    Math.max(1, wordCount),
  );

  // Actionability keyword hits
  const lowered = text.toLowerCase();
  const actionHits =
    ACTION_SIGNALS_EN.reduce((sum, s) => sum + (lowered.includes(s) ? 1 : 0), 0) +
    ACTION_SIGNALS_TR.reduce((sum, s) => sum + (lowered.includes(s) ? 1 : 0), 0);
  const actionHitRate = safeDivide(actionHits, 18); // normalize by approximate list size

  // --- Readability (higher = clearer structure)
  // targets: avgSentenceLen ~ 16-22, avgWordLen ~ 4-6, healthy paragraphing and line breaks.
  const sentenceLenPenalty = clamp(Math.abs(avgSentenceLen - 18) * 2.2, 0, 40);
  const wordLenPenalty = clamp(Math.abs(avgWordLen - 5) * 7, 0, 25);
  const paragraphBonus = clamp(Math.log2(paragraphCount + 1) * 12, 0, 24);
  const lineBreakBonus = clamp(Math.log2(lineBreaks + 1) * 6, 0, 18);
  const denseBlockPenalty = paragraphs.length <= 1 && lineBreaks < 2 ? 18 : 0;
  const readabilityRaw = 72 + paragraphBonus + lineBreakBonus - sentenceLenPenalty - wordLenPenalty - denseBlockPenalty;
  const readability = roundScore(readabilityRaw);

  // --- Complexity (higher = more complex)
  const complexityRaw =
    20 +
    longWordRatio * 55 +
    uppercaseTokenRatio * 55 +
    numericRatio * 35 +
    technicalRatio * 45 +
    clamp(uniqueWordRatio * 35, 0, 35);
  const complexity = roundScore(complexityRaw);

  // --- Density (higher = more information-dense)
  // Higher unique ratio and lower repetition increase density; too many stopwords reduces.
  const densityRaw =
    25 +
    uniqueWordRatio * 55 -
    top10Share * 35 -
    stopwordRatio * 25 +
    clamp(safeDivide(wordCount, paragraphCount) / 40, 0, 1) * 20;
  const density = roundScore(densityRaw);

  // --- Actionability (higher = more action/decision language)
  const actionabilityRaw = 15 + actionHitRate * 70 + clamp(numericRatio * 30, 0, 20);
  const actionability = roundScore(actionabilityRaw);

  const iqScore = roundScore(
    readability * 0.25 +
      complexity * 0.25 +
      density * 0.3 +
      actionability * 0.2,
  );

  const bulletCount = countRegexMatches(text, /^\s*(?:[-*•‣–—]|\d+\.|\(?[a-zA-Z]\)|\([0-9]+\))\s+/gm);
  const tableSignalCount = countRegexMatches(text, /^\s*\|.+\|\s*$/gm) + countRegexMatches(text, /\t{2,}/g);
  const headingSignalCount =
    countRegexMatches(text, /^\s*#+\s+.+$/gm) +
    countRegexMatches(text, /^\s*(?:\d+\.){1,4}\s+\p{L}.+/gmu) +
    countRegexMatches(text, /^\s*[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{6,}$/gm);
  const citationCount =
    countRegexMatches(text, /\[(?:\d{1,3}|\d{4})\]/g) +
    countRegexMatches(text, /\([A-Z][A-Za-z\-]+,\s*\d{4}\)/g) +
    countRegexMatches(text, /\b(?:doi:|arxiv:)\S+/gi);

  const detectedDocumentType = detectDocumentType({
    text,
    paragraphs,
    avgParagraphWords,
    bulletCount,
    tableSignalCount,
    headingSignalCount,
    citationCount,
  });

  const whyThisScore = buildWhyThisScore({ readability, complexity, density, actionability });
  const iqLabel = mapIqScoreToBetterLabel({ readability, complexity, density, actionability });
  const estimatedReadingMinutes = estimateReadingMinutesFromCharCount(charCount);
  const recommendedIntelligenceModeIds = recommendIntelligenceModes({
    detectedType: detectedDocumentType.type,
    actionability,
    complexity,
    density,
  });

  return {
    iqScore,
    label: getIqLabel(iqScore),
    iqLabel,
    readability,
    complexity,
    density,
    actionability,
    charCount,
    estimatedReadingMinutes,
    whyThisScore,
    detectedDocumentType,
    recommendedIntelligenceModeIds,
  };
}
