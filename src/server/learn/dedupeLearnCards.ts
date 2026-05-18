import {
  normalizeDeckText,
  presentationSemanticStems,
} from "@/server/presentation/presentationFragments";
import type { LearnCandidate } from "./types";

function normalizeKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
    .replace(/\s+/g, " ");
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

function deckStemOverlapRatio(a: string, b: string): number {
  const setA = presentationSemanticStems(a);
  const setB = presentationSemanticStems(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared += 1;
  }
  return shared / Math.min(setA.size, setB.size);
}

function extractTimestampKey(text: string): string | null {
  const m = text.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
  return m ? m[1] : null;
}

export type DedupeLearnOptions = {
  isPresentation?: boolean;
};

/**
 * Remove near-duplicate candidates while preserving highest-importance entries.
 */
export function dedupeLearnCandidates(
  ranked: LearnCandidate[],
  summary: string,
  maxOverlap = 0.62,
  extraCorpus: string[] = [],
  options?: DedupeLearnOptions,
): LearnCandidate[] {
  const isPresentation = options?.isPresentation === true;
  const overlapThreshold = isPresentation ? Math.min(maxOverlap, 0.52) : maxOverlap;

  const out: LearnCandidate[] = [];
  const corpus: string[] = [summary, ...extraCorpus];
  const usedTimestamps = new Set<string>();
  const usedDeckKeys = new Set<string>();

  for (const candidate of ranked) {
    const text = `${candidate.title} ${candidate.content}`;
    const compare = (other: string) =>
      isPresentation
        ? Math.max(overlapRatio(text, other), deckStemOverlapRatio(text, other))
        : overlapRatio(text, other);

    const tooClose = corpus.some((other) => compare(other) >= overlapThreshold);
    if (tooClose) continue;

    const titleKey = isPresentation
      ? normalizeDeckText(candidate.title)
      : normalizeKey(candidate.title);
    if (!titleKey || usedDeckKeys.has(titleKey)) continue;
    if (out.some((c) => (isPresentation ? normalizeDeckText(c.title) : normalizeKey(c.title)) === titleKey)) {
      continue;
    }

    if (isPresentation) {
      const stemDup = out.some((c) => deckStemOverlapRatio(text, `${c.title} ${c.content}`) >= 0.72);
      if (stemDup) continue;
    }

    const ts = extractTimestampKey(candidate.content);
    if (ts) {
      if (usedTimestamps.has(ts)) continue;
      usedTimestamps.add(ts);
    }

    const contentKey = (isPresentation ? normalizeDeckText(candidate.content) : normalizeKey(candidate.content)).slice(0, 80);
    if (out.some((c) => {
      const otherKey = (isPresentation ? normalizeDeckText(c.content) : normalizeKey(c.content)).slice(0, 80);
      return otherKey === contentKey;
    })) {
      continue;
    }

    out.push(candidate);
    corpus.push(text);
    usedDeckKeys.add(titleKey);
  }

  return out;
}
