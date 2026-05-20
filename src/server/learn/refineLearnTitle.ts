/**
 * SERVER ONLY — deterministic semantic title refinement for learn cards.
 * No extra AI calls.
 */

import { buildSafeLearnTitle, stripQuestionPrefixes, validateLearnTitle } from "./validateLearnTitle";
import type { LearnCandidate } from "./types";

const SYNTHETIC_TITLE_PATTERNS: RegExp[] = [
  /^action implication$/i,
  /^clarify the risk/i,
  /^linked ideas$/i,
  /^anchor phrase$/i,
  /^recall check$/i,
  /^core idea \d+$/i,
  /^key point$/i,
  /^key insight$/i,
  /^insight\b/i,
  /^importance of\b/i,
  /^overview of\b/i,
  /^understanding\b/i,
  /^the role of\b/i,
  /^why it matters$/i,
  /^concept\b/i,
  /^lesson \d+$/i,
  /^takeaway$/i,
  /^note$/i,
];

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
  "speaker",
  "discusses",
  "discussed",
  "talks",
  "video",
  "transcript",
]);

function titleCase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 3 && /^[a-z]+$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function stripTimestamps(text: string): string {
  return text.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/g, "").trim();
}

function stripQuotes(text: string): string {
  return text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
}

export function isSyntheticTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 4) return true;
  if (SYNTHETIC_TITLE_PATTERNS.some((p) => p.test(t))) return true;
  if (/^insight:\s/i.test(t)) return true;
  if (/^(concept|quiz|memory hook|why):\s/i.test(t)) return true;
  if (/^(the |a |an )?(speaker|video|presenter)\b/i.test(t)) return true;
  return false;
}

function capitalizedPhrases(text: string): string[] {
  const clean = stripTimestamps(stripQuotes(text));
  const matches =
    clean.match(
      /\b[A-Z][a-z]+(?:\s+(?:of|in|on|the|and|as|for|to)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g,
    ) ?? [];
  return [...new Set(matches)].filter((p) => p.length >= 6 && p.length <= 48);
}

function significantWords(text: string, max = 6): string[] {
  const clean = stripTimestamps(stripQuotes(text))
    .replace(/[^\w\s'-]/g, " ")
    .toLowerCase();
  const words = clean.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  return [...new Set(words)].slice(0, max);
}

function phraseFromEntities(content: string, entities: Set<string>): string | null {
  const lower = content.toLowerCase();
  const hits: string[] = [];
  for (const e of entities) {
    if (e.length < 4) continue;
    if (lower.includes(e)) {
      const original = content.match(new RegExp(`\\b${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
      if (original) hits.push(original[0]);
    }
  }
  if (hits.length >= 2) {
    return titleCase(`${hits[0]} & ${hits[1]}`).slice(0, 56);
  }
  if (hits.length === 1) {
    const rest = significantWords(content.replace(hits[0], ""), 3);
    if (rest.length > 0) {
      return titleCase(`${hits[0]} & ${rest[0]}`).slice(0, 56);
    }
    return titleCase(hits[0]).slice(0, 56);
  }
  return null;
}

function extractEditorialPhrase(content: string, entities: Set<string>): string {
  const clean = stripTimestamps(stripQuotes(content));

  const entityPhrase = phraseFromEntities(clean, entities);
  if (entityPhrase && entityPhrase.length >= 8) return entityPhrase;

  const caps = capitalizedPhrases(clean);
  if (caps.length > 0) {
    const best = caps.sort((a, b) => b.length - a.length)[0];
    return titleCase(best).slice(0, 56);
  }

  const contrast = clean.match(
    /\b([A-Za-z][\w-]+(?:\s+[A-Za-z][\w-]+){0,2})\s+(?:vs\.?|versus|against|not)\s+([A-Za-z][\w-]+(?:\s+[A-Za-z][\w-]+){0,2})\b/i,
  );
  if (contrast) {
    return titleCase(`${contrast[1]} vs ${contrast[2]}`).slice(0, 56);
  }

  const words = significantWords(clean, 7);
  if (words.length >= 3) {
    return titleCase(words.join(" ")).slice(0, 56);
  }

  const fallback = clean.split(/[.!?]/)[0]?.trim() ?? clean;
  const trimmed = fallback.split(/\s+/).slice(0, 8).join(" ");
  return titleCase(trimmed).slice(0, 56) || "Key idea";
}

function refineByKind(
  candidate: LearnCandidate,
  entities: Set<string>,
): string {
  const content = stripTimestamps(candidate.content);

  switch (candidate.kind) {
    case "connection": {
      const ents = capitalizedPhrases(content);
      if (ents.length >= 2) {
        return `How did ${ents[0]} relate to ${ents[1]}?`.slice(0, 72);
      }
      if (ents.length === 1) {
        return `What linked ${ents[0]} to the wider conflict?`.slice(0, 72);
      }
      return `How do the main forces in this narrative interact?`.slice(0, 72);
    }
    case "misconception":
      return extractEditorialPhrase(
        content.replace(/^(potential risk|misconception|myth):\s*/i, ""),
        entities,
      );
    case "memory_hook": {
      const short = content.split(/[.!?]/).find((s) => s.trim().length >= 12 && s.length <= 72);
      if (short) return extractEditorialPhrase(short, entities);
      return extractEditorialPhrase(content, entities);
    }
    case "quiz": {
      const q = content.split("\n---\n")[0] ?? content;
      const entity = capitalizedPhrases(q)[0];
      if (entity) return titleCase(entity).slice(0, 56);
      return extractEditorialPhrase(q.replace(/\?.*$/, ""), entities).slice(0, 56);
    }
    case "why_it_matters":
      return extractEditorialPhrase(content, entities);
  }

  return extractEditorialPhrase(content, entities);
}

/**
 * Refine a learn card title to editorial, source-grounded phrasing.
 */
export function refineSemanticTitle(
  candidate: LearnCandidate,
  corpusEntities: Set<string>,
  documentTitle?: string,
): string {
  let title = stripQuestionPrefixes(candidate.title.trim());
  title = title.replace(TITLE_PREFIX_PATTERN, "").trim();
  title = stripQuotes(title);

  if (!isSyntheticTitle(title) && validateLearnTitle(title).valid) {
    return title.slice(0, 72);
  }

  const fromContent = refineByKind(candidate, corpusEntities);
  if (fromContent && validateLearnTitle(fromContent).valid) {
    return fromContent;
  }

  const safe = buildSafeLearnTitle({
    card: {
      type: candidate.kind === "why_it_matters" ? "why_it_matters" : candidate.kind,
      title: candidate.title,
      content: candidate.content,
    },
    documentTitle,
  });
  if (validateLearnTitle(safe).valid) return safe.slice(0, 72);

  if (documentTitle && documentTitle.length > 5) {
    return titleCase(documentTitle).slice(0, 56);
  }

  return fromContent || titleCase(significantWords(candidate.content, 4).join(" ")).slice(0, 56);
}

const TITLE_PREFIX_PATTERN =
  /^(insight|concept|key point|key insight|quiz|memory hook|takeaway|lesson|note|why):\s*/i;

export function syntheticTitlePenalty(title: string): number {
  if (isSyntheticTitle(title)) return 0.45;
  if (title.length < 8) return 0.2;
  if (/^(the|a|an)\s+(speaker|video)\b/i.test(title)) return 0.35;
  return 0;
}
