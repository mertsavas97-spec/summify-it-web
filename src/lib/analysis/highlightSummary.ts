import { stripAnalysisTimecodes } from "@/lib/analysis/stripTimecodes";

export type SummaryHighlightPart = {
  text: string;
  highlight: boolean;
};

type Candidate = {
  paragraph: number;
  start: number;
  end: number;
  sentenceStart: number;
  sentenceEnd: number;
  score: number;
  key: string;
  sentence: number;
};

const STOP = new Set([
  "a", "an", "the", "of", "and", "or", "to", "in", "on", "for", "with", "as",
  "by", "from", "that", "this", "these", "those", "is", "are", "was", "were",
  "be", "been", "being", "it", "its", "at", "into", "about", "over", "after",
  "before", "between", "their", "his", "her", "they", "them", "he", "she",
  "who", "which", "what", "when", "where", "how", "also", "such", "more",
  "most", "very", "just", "than", "then", "but", "not", "no", "can", "could",
  "would", "should", "may", "might", "will", "has", "have", "had", "do",
  "does", "did", "its", "our", "your", "there", "here", "during", "through",
  "within", "without", "across", "while", "because", "since", "until", "into",
  "ve", "bir", "bu", "şu", "o", "da", "de", "ile", "için", "gibi", "daha",
  "çok", "olan", "olarak", "sonra", "önce",
]);

const GENERIC = new Set([
  "important", "significance", "significant", "key", "main", "major", "notable",
  "various", "several", "different", "document", "video", "text", "summary",
  "author", "chapter", "section", "information", "process", "approach",
  "result", "results", "change", "changes", "problem", "problems", "people",
  "thing", "things", "example", "examples", "part", "parts", "point", "points",
  "way", "time", "history", "historical", "broader", "discussion", "overview",
  "context", "period", "source", "sources", "analysis", "content", "topic",
  "topics", "idea", "ideas", "concept", "concepts", "campaign", "later", "then",
  "also", "covers", "general", "overall", "modern", "early", "late", "regions",
]);

const NAME_BLOCK = new Set([
  "this", "that", "these", "those", "the", "summary", "document", "video",
  "text", "key", "main", "overall", "however", "therefore", "source",
  "analysis", "chapter", "section", "introduction", "conclusion", "youtube",
]);

const YEAR = /\b(?:1[5-9]\d{2}|20\d{2})(?:\s*[-–—]\s*(?:1[5-9]\d{2}|20\d{2}))?\b/g;
const QUANTITY =
  /(?:[$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|trillion|m|bn|k))?|\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s?(?:%|percent|million|billion|trillion))(?!\p{L})/giu;
const NAME =
  /\p{Lu}[\p{L}'’-]*(?:\s+(?:of|the|de|van|von|da|di|al|bin|ibn)\s+\p{Lu}[\p{L}'’-]*|\s+\p{Lu}[\p{L}'’-]*){1,4}/gu;

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsOf(value: string): string[] {
  return norm(value).match(/[\p{L}\p{N}'%-]+/gu) ?? [];
}

function sentenceRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const re = /[^.!?]+(?:[.!?]+|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match[0].trim().length === 0) continue;
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges.length > 0 ? ranges : [{ start: 0, end: text.length }];
}

function sentenceIndexAt(
  ranges: Array<{ start: number; end: number }>,
  offset: number,
): number {
  const index = ranges.findIndex((range) => offset >= range.start && offset < range.end);
  return index === -1 ? ranges.length - 1 : index;
}

function pushMatch(
  candidates: Candidate[],
  paragraph: number,
  text: string,
  ranges: Array<{ start: number; end: number }>,
  start: number,
  end: number,
  score: number,
  key: string,
) {
  const slice = text.slice(start, end);
  if (slice.trim().length < 3) return;
  const sentence = sentenceIndexAt(ranges, start);
  candidates.push({
    paragraph,
    start,
    end,
    sentenceStart: ranges[sentence].start,
    sentenceEnd: ranges[sentence].end,
    score,
    key: norm(key),
    sentence,
  });
}

function findPattern(
  candidates: Candidate[],
  paragraph: number,
  text: string,
  ranges: Array<{ start: number; end: number }>,
  pattern: RegExp,
  score: number,
  accept: (value: string) => boolean,
) {
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const value = match[0];
    if (!accept(value)) continue;
    pushMatch(candidates, paragraph, text, ranges, match.index, match.index + value.length, score, value);
  }
}

function addFactCandidates(
  candidates: Candidate[],
  paragraph: number,
  text: string,
  ranges: Array<{ start: number; end: number }>,
  corpus: string,
) {
  const inCorpus = (value: string) => corpus.includes(norm(value));
  findPattern(candidates, paragraph, text, ranges, YEAR, 9, (value) => {
    if (!inCorpus(value)) return false;
    return /[-–—]/.test(value) ? false : true;
  });
  findPattern(candidates, paragraph, text, ranges, YEAR, 13, (value) =>
    /[-–—]/.test(value) && inCorpus(value),
  );
  findPattern(candidates, paragraph, text, ranges, QUANTITY, 14, inCorpus);
}

function addNameCandidates(
  candidates: Candidate[],
  paragraph: number,
  text: string,
  ranges: Array<{ start: number; end: number }>,
  corpus: string,
) {
  findPattern(candidates, paragraph, text, ranges, NAME, 12, (value) => {
    const parts = value
      .split(/\s+/)
      .filter((part) => !/^(of|the|de|van|von|da|di|al|bin|ibn)$/i.test(part));
    if (parts.length < 2) return false;
    if (parts.every((part) => NAME_BLOCK.has(part.toLowerCase()))) return false;
    return corpus.includes(norm(value));
  });
  for (const candidate of candidates) {
    if (candidate.paragraph !== paragraph || candidate.score !== 12) continue;
    const words = text.slice(candidate.start, candidate.end).split(/\s+/).length;
    if (words >= 3) candidate.score = 13;
  }
}

function addPhraseCandidates(
  candidates: Candidate[],
  paragraph: number,
  text: string,
  ranges: Array<{ start: number; end: number }>,
  insights: string[],
) {
  const haystack = norm(text);
  for (const insight of insights) {
    const tokens = wordsOf(insight);
    for (let size = 4; size >= 3; size -= 1) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const window = tokens.slice(index, index + size);
        const meaningful = window.filter((word) => word.length > 2 && !STOP.has(word));
        if (meaningful.length < 2) continue;
        const genericCount = meaningful.filter((word) => GENERIC.has(word)).length;
        if (genericCount / meaningful.length > 0.5) continue;
        const phrase = window.join(" ");
        if (!haystack.includes(phrase)) continue;
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/-/g, "[-–—]");
        const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
        let match: RegExpExecArray | null;
        while ((match = re.exec(text))) {
          pushMatch(
            candidates,
            paragraph,
            text,
            ranges,
            match.index,
            match.index + match[0].length,
            6 + meaningful.length,
            match[0],
          );
        }
      }
    }
  }
}

function selectCandidates(candidates: Candidate[], sentenceCount: number): Candidate[] {
  const maxHighlights = Math.min(8, Math.max(3, Math.round(sentenceCount * 0.55)));
  const perParagraph = new Map<number, number>();
  const ranked = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.paragraph !== b.paragraph) return a.paragraph - b.paragraph;
    return a.start - b.start;
  });
  const chosen: Candidate[] = [];
  const usedSentences = new Set<string>();

  for (const candidate of ranked) {
    if (chosen.length >= maxHighlights) break;
    if (candidate.score < 9) continue;
    const sentenceKey = `${candidate.paragraph}:${candidate.sentence}`;
    if (usedSentences.has(sentenceKey)) continue;
    if ((perParagraph.get(candidate.paragraph) ?? 0) >= 3) continue;
    const sentence = {
      ...candidate,
      start: candidate.sentenceStart,
      end: candidate.sentenceEnd,
    };
    chosen.push(sentence);
    usedSentences.add(sentenceKey);
    perParagraph.set(candidate.paragraph, (perParagraph.get(candidate.paragraph) ?? 0) + 1);
  }

  return chosen;
}

function partsFromSpans(text: string, spans: Array<{ start: number; end: number }>): SummaryHighlightPart[] {
  if (spans.length === 0) return [{ text, highlight: false }];
  const ordered = [...spans].sort((a, b) => a.start - b.start);
  const parts: SummaryHighlightPart[] = [];
  let cursor = 0;
  for (const span of ordered) {
    if (span.start > cursor) {
      parts.push({ text: text.slice(cursor, span.start), highlight: false });
    }
    parts.push({ text: text.slice(span.start, span.end), highlight: true });
    cursor = span.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false });
  return parts.filter((part) => part.text.length > 0);
}

/** Highlight insight-backed sentences, not the single name or year inside them. */
export function highlightSummaryParagraphs(
  paragraphs: string[],
  insights: string[],
): SummaryHighlightPart[][] {
  const cleanParagraphs = paragraphs.map((paragraph) => stripAnalysisTimecodes(paragraph));
  const cleanInsights = insights.map((insight) => stripAnalysisTimecodes(insight)).filter(Boolean);
  if (cleanInsights.length === 0) {
    return cleanParagraphs.map((paragraph) => [{ text: paragraph, highlight: false }]);
  }

  const corpus = norm(cleanInsights.join(" \n "));
  const candidates: Candidate[] = [];
  let sentenceCount = 0;

  cleanParagraphs.forEach((paragraph, paragraphIndex) => {
    const ranges = sentenceRanges(paragraph);
    sentenceCount += ranges.filter((range) => paragraph.slice(range.start, range.end).trim().length > 24).length;
    addFactCandidates(candidates, paragraphIndex, paragraph, ranges, corpus);
    addNameCandidates(candidates, paragraphIndex, paragraph, ranges, corpus);
    addPhraseCandidates(candidates, paragraphIndex, paragraph, ranges, cleanInsights);
  });

  const chosen = selectCandidates(candidates, Math.max(sentenceCount, 1));
  return cleanParagraphs.map((paragraph, paragraphIndex) =>
    partsFromSpans(
      paragraph,
      chosen
        .filter((item) => item.paragraph === paragraphIndex)
        .map((item) => ({ start: item.start, end: item.end })),
    ),
  );
}

export function splitSummaryParagraphs(summary: string): string[] {
  const trimmed = stripAnalysisTimecodes(summary);
  if (!trimmed) return [];

  const byBreak = trimmed
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (byBreak.length > 1) return byBreak;

  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 3) return [trimmed];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(sentences.slice(i, i + 3).join(" "));
  }
  return paragraphs;
}
