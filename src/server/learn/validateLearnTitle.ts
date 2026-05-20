/**
 * Strict learn title validation — complete propositions only, no fragment composition.
 */

import type { LearnCardOutput } from "@/types/text-analysis";
import { capitalizedPhrases } from "./knowledgeStructure";
import type { ModeLearnStrategy } from "./modeLearnStrategies";

export const LEARN_TITLE_MAX = 110;

const CREATOR_MODE_IDS = new Set([
  "the-creator",
  "the-journalist",
  "script-breakdown",
  "podcast-summary",
  "youtube-intelligence",
]);

export function isCreatorIntelligenceMode(
  modeId?: string | null,
  strategy?: Pick<ModeLearnStrategy, "id" | "promptStyle">,
): boolean {
  const id = (modeId ?? "").trim().toLowerCase();
  if (CREATOR_MODE_IDS.has(id)) return true;
  if (strategy?.id === "creator" || strategy?.promptStyle === "creative_angle") return true;
  return false;
}

export function isStudentHistoricalStrategy(strategy?: ModeLearnStrategy): boolean {
  return (
    strategy?.id === "student_historical" ||
    strategy?.id.startsWith("student_historical") === true
  );
}

export function stripQuestionPrefixes(title: string): string {
  let t = title.trim();
  if (!t) return t;
  if (t.includes("---")) t = t.split("---")[0].trim();

  const prefixes = [
    /^how did\s+/i,
    /^how does\s+/i,
    /^why did\s+/i,
    /^why was\s+/i,
    /^what makes\s+/i,
    /^what angle does\s+/i,
    /^what point does\s+/i,
    /^what defines\s+/i,
    /^explain\s+/i,
  ];

  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const re of prefixes) {
      if (re.test(t)) {
        t = t.replace(re, "").trim();
        changed = true;
      }
    }
    if (!changed) break;
  }
  return t;
}

export function splitAnswerFromTitle(title: string): string {
  return title.split(/\s*---+\s*/)[0]?.trim() ?? title;
}

export type LearnTitleValidationReason =
  | "empty"
  | "too_short"
  | "ends_with_colon"
  | "double_question"
  | "orphan_connector"
  | "fragment_matter"
  | "fragment_angle"
  | "symbol_merge"
  | "lowercase_start"
  | "repeated_auxiliary"
  | "placeholder"
  | "banned_phrase"
  | "answer_leakage"
  | "incomplete_proposition"
  | "generic_subject";

export type LearnTitleValidationResult = {
  valid: boolean;
  reason?: LearnTitleValidationReason;
  title: string;
};

export type LearnTitleValidationStats = {
  invalidRejected: number;
  fallbackRegenerated: number;
  malformedPrevented: number;
  alignmentFailures: number;
};

const SEMANTIC_STOP = new Set([
  "the",
  "a",
  "an",
  "in",
  "on",
  "at",
  "to",
  "of",
  "and",
  "or",
  "for",
  "with",
  "this",
  "that",
  "source",
  "matter",
  "impact",
  "club",
  "period",
  "after",
  "before",
]);

const BANNED_FRAGMENT = [
  /\bmatter\s*\??\s*$/i,
  /\bmatter\s+in\s+this\s+source/i,
  /\bangle\s+does\b/i,
  /\bsource\s+emphasize/i,
  /\bchange\s+after:\s*$/i,
  /\bchange\s+after:\s+this\b/i,
  /\binvestigate\s+the\s+impact\s+matter/i,
  /\bpotential\s*&\s*financial/i,
  /\b↔\b/,
  /\s→\s/,
  /\?\s*\?/,
  /:\s*$/,
  /\b(how|why|what)\s+(how|why|what)\s/i,
  /\baccording to the source\b/i,
  /\bin this source\b/i,
  /\bwhat point does\b/i,
  /what is the most important idea about/i,
  /^what changed after (19|20)\d{2}\??$/i,
  /\brevenue model\??$/i,
  /^why was (the main subject|this event) a turning point\??$/i,
];

const INCOMPLETE_SUBJECT =
  /^(club|impact|potential|financial|corporate|period|source|matter|investigate)\b/i;

function semanticTokenCount(title: string): number {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SEMANTIC_STOP.has(w));
  return words.length;
}

function pickPrimaryEntity(text: string, documentTitle?: string): string {
  const ents = capitalizedPhrases(text);
  const proper = ents.find((e) => e.length >= 4 && !/^(The|This|That|Period|Source)$/i.test(e));
  if (proper) return proper;
  if (documentTitle && documentTitle.length >= 4) {
    const fromDoc = capitalizedPhrases(documentTitle)[0];
    if (fromDoc) return fromDoc;
    return documentTitle.slice(0, 48).trim();
  }
  return "the main subject";
}

function pickEventSnippet(content: string): string | null {
  if (/\b3\s*july|july\s*3\b/i.test(content)) return "3 July";
  const year = content.match(/\b(19|20)\d{2}(?:\s*[–-]\s*(19|20)\d{2})?\b/);
  if (year) return year[0];
  const sentence = content.split(/[.!?]/).find((s) => s.trim().length >= 20 && s.length <= 90);
  if (!sentence) return null;
  const ents = capitalizedPhrases(sentence);
  return ents[0] ?? null;
}

/** Deterministic safe question templates — variables must be complete noun phrases. */
export function buildSafeLearnTitle(input: {
  card: LearnCardOutput;
  strategy?: ModeLearnStrategy;
  documentTitle?: string;
}): string {
  const { card, strategy, documentTitle } = input;
  const content = card.content.trim();
  const text = `${card.title} ${content}`;
  const entity = pickPrimaryEntity(text, documentTitle);
  const event = pickEventSnippet(content);
  const pattern = card.learnPattern ?? "";

  if (isStudentHistoricalStrategy(strategy)) {
    if (/\b3\s*july|july\s*3\b/i.test(text)) {
      return "Why was 3 July more than a sports scandal?";
    }
    if (pattern.includes("timeline") || /\b\d{4}\b/.test(text)) {
      if (event) return `Why was ${event} a turning point?`;
      return `What changed after the pivotal moment for ${entity}?`;
    }
    if (/\bconflict|tension|crisis|pressure|versus|rupture\b/i.test(text)) {
      return `What tension defined the ${entity} era?`;
    }
    if (/\bcoexist|success.*pressure|sporting.*politic/i.test(text)) {
      return "How did sporting success coexist with political pressure?";
    }
    if (/\bstadium|financial|revenue|debt|model\b/i.test(text)) {
      return `How did the stadium project reshape ${entity}'s finances?`;
    }
    if (/\bidentity|civil|institution|more than\b/i.test(text)) {
      return `Why does the source frame ${entity} as a civil identity, not only a sports club?`;
    }
    if (pattern.includes("cause") || /\bled to|because|resulted\b/i.test(text)) {
      return `How did the crisis reshape ${entity}?`;
    }
    if (event) return `Why did ${event} become a turning point for ${entity}?`;
    return `Why did ${entity} matter beyond sports alone?`;
  }

  if (card.type === "why_it_matters" || pattern.includes("cause")) {
    return `Why did ${entity} become decisive in this document?`;
  }
  if (pattern.includes("timeline") || /\b\d{4}\b/.test(text)) {
    return event
      ? `What changed after ${event}?`
      : `What marked the main turning point for ${entity}?`;
  }
  if (/\bconflict|tension|crisis\b/i.test(text)) {
    return `What tension shaped ${entity} during this period?`;
  }
  if (/\btransform|shift|evolv|revenue|model\b/i.test(text)) {
    return `How did ${entity}'s role transform over time?`;
  }

  return `What is the most important idea about ${entity}?`;
}

export function validateLearnTitle(
  title: string,
  options?: { creatorMode?: boolean },
): LearnTitleValidationResult {
  let t = title.trim().replace(/\s+/g, " ");
  if (t.includes("---")) t = t.split("---")[0].trim();
  if (!t) return { valid: false, reason: "empty", title: t };

  if (t.length < 12) return { valid: false, reason: "too_short", title: t };
  if (/:\s*$/.test(t)) return { valid: false, reason: "ends_with_colon", title: t };
  if ((t.match(/\?/g) ?? []).length > 1) return { valid: false, reason: "double_question", title: t };
  if (/^(and|or|but|with|after|before|because)\s/i.test(t)) {
    return { valid: false, reason: "orphan_connector", title: t };
  }
  if (semanticTokenCount(t) < 2) return { valid: false, reason: "too_short", title: t };
  if (/^[a-z]/.test(t) && !/^(e\.g\.|i\.e\.)/i.test(t)) {
    return { valid: false, reason: "lowercase_start", title: t };
  }
  if (/\b(matter|angle)\s*\??\s*$/i.test(t) && !/\bwhy|what|how\b/i.test(t)) {
    return { valid: false, reason: "fragment_matter", title: t };
  }
  if (/\bangle\s+does\b/i.test(t)) return { valid: false, reason: "fragment_angle", title: t };
  if (/↔|\s→\s|&\s*\w+\s*&/.test(t)) return { valid: false, reason: "symbol_merge", title: t };
  if (/\b(how|why|what|did|does|was|were)\s+(how|why|what|did|does|was|were)\b/i.test(t)) {
    return { valid: false, reason: "repeated_auxiliary", title: t };
  }
  if (/\b(TBD|TODO|___|something|this topic|the subject)\b/i.test(t)) {
    return { valid: false, reason: "placeholder", title: t };
  }
  if (INCOMPLETE_SUBJECT.test(t) && semanticTokenCount(t) < 3) {
    return { valid: false, reason: "generic_subject", title: t };
  }
  if (/\b\w+\s+matter\s+in\s+this\s+source/i.test(t)) {
    return { valid: false, reason: "fragment_matter", title: t };
  }

  for (const re of BANNED_FRAGMENT) {
    if (re.test(t)) return { valid: false, reason: "banned_phrase", title: t };
  }

  if (!options?.creatorMode) {
    if (/reusable as content|content angle|repurpose/i.test(t)) {
      return { valid: false, reason: "banned_phrase", title: t };
    }
  }

  if (!/\?/.test(t) && !/^(growth|anchor|recall)/i.test(t)) {
    if (t.split(/\s+/).length < 4) return { valid: false, reason: "incomplete_proposition", title: t };
  }

  return { valid: true, title: t.slice(0, LEARN_TITLE_MAX) };
}

export function validateQuestionAnswerAlignment(card: LearnCardOutput): boolean {
  const title = card.title.toLowerCase();
  const content = card.content.toLowerCase();

  if (/^why\b|\bwhy did\b|\bwhy was\b/.test(title)) {
    return (
      /\bbecause|led to|resulted|therefore|thus|matter|significance|tension|crisis|identity\b/i.test(
        content,
      ) || content.length >= 80
    );
  }
  if (/^how\b|\bhow did\b/.test(title)) {
    return (
      /\b(change|shift|transform|process|led|after|before|model|growth|decline|reshape)\b/i.test(
        content,
      ) || content.length >= 80
    );
  }
  if (/^what changed\b|^what happened\b/.test(title)) {
    return /\b(after|before|during|\d{4}|became|shifted)\b/i.test(content);
  }
  if (/^what\b/.test(title) && /\bdefined\b/.test(title)) {
    return /\b(is|was|means|refers|characterized)\b/i.test(content);
  }
  return true;
}

export function ensureValidLearnTitle(
  card: LearnCardOutput,
  options?: {
    strategy?: ModeLearnStrategy;
    documentTitle?: string;
    intelligenceModeId?: string | null;
  },
): { title: string; regenerated: boolean; aligned: boolean } {
  const creatorMode = isCreatorIntelligenceMode(options?.intelligenceModeId, options?.strategy);
  let regenerated = false;

  let result = validateLearnTitle(card.title, { creatorMode });
  if (!result.valid) {
    const safe = buildSafeLearnTitle({
      card,
      strategy: options?.strategy,
      documentTitle: options?.documentTitle,
    });
    result = validateLearnTitle(safe, { creatorMode });
    regenerated = true;
    if (!result.valid) {
      result = { valid: true, title: safe.slice(0, LEARN_TITLE_MAX) };
    }
  }

  const aligned = validateQuestionAnswerAlignment({ ...card, title: result.title });
  return { title: result.title, regenerated, aligned };
}

export function applyStrictTitleValidation(
  cards: LearnCardOutput[],
  options?: {
    strategy?: ModeLearnStrategy;
    documentTitle?: string;
    intelligenceModeId?: string | null;
  },
): { cards: LearnCardOutput[]; stats: LearnTitleValidationStats } {
  const stats: LearnTitleValidationStats = {
    invalidRejected: 0,
    fallbackRegenerated: 0,
    malformedPrevented: 0,
    alignmentFailures: 0,
  };

  const out: LearnCardOutput[] = [];

  for (const card of cards) {
    const before = validateLearnTitle(card.title, {
      creatorMode: isCreatorIntelligenceMode(options?.intelligenceModeId, options?.strategy),
    });
    if (!before.valid) stats.invalidRejected += 1;

    const { title, regenerated, aligned } = ensureValidLearnTitle(card, options);
    if (regenerated) stats.fallbackRegenerated += 1;
    if (!before.valid) stats.malformedPrevented += 1;
    if (!aligned) stats.alignmentFailures += 1;

    const after = validateLearnTitle(title, {
      creatorMode: isCreatorIntelligenceMode(options?.intelligenceModeId, options?.strategy),
    });
    if (!after.valid) continue;

    if (!validateQuestionAnswerAlignment({ ...card, title })) {
      stats.alignmentFailures += 1;
      continue;
    }

    out.push({ ...card, title });
  }

  return { cards: out, stats };
}

export function learnTitleValidationDebugStats(
  stats: LearnTitleValidationStats,
): LearnTitleValidationStats | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  return stats;
}
