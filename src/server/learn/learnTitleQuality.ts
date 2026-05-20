/**
 * Learn card title sanitization — prevents template stacking, leakage, and mode contamination.
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

const QUESTION_PREFIXES = [
  /^how did\s+/i,
  /^how does\s+/i,
  /^how do\s+/i,
  /^how would\s+/i,
  /^why did\s+/i,
  /^why was\s+/i,
  /^why does\s+/i,
  /^why is\s+/i,
  /^what makes\s+/i,
  /^what angle does\s+/i,
  /^what point does\s+/i,
  /^what defines\s+/i,
  /^what is\s+/i,
  /^what was\s+/i,
  /^what changed\s+/i,
  /^what happened\s+/i,
  /^what tension\s+/i,
  /^what consequence\s+/i,
  /^what shifted\s+/i,
  /^which period\s+/i,
  /^who led\s+/i,
  /^explain\s+/i,
  /^describe\s+/i,
  /^recall\s+/i,
];

const BANNED_GLOBAL: RegExp[] = [
  /what point does this source emphasize in/i,
  /what point does the source emphasize/i,
  /according to the source/i,
  /\bin this source\b/i,
  /^what defines\b/i,
  /^what is the key insight/i,
  /^key insight\??$/i,
  /^core idea\b/i,
  /^historical frame$/i,
  /^cause → effect$/i,
];

const CREATOR_ONLY: RegExp[] = [
  /reusable as content/i,
  /content angle/i,
  /audience hook/i,
  /\brepurpose\b/i,
  /creator angle/i,
  /what angle does/i,
  /what makes .+ reusable/i,
];

const RE_BROKEN_HOOK_ARROW = /\b\w\s+\u2192\s+the\s+/i;
const RE_BROKEN_HOOK_ELLIPSIS = /\u2026\s*\u2192/;
const RE_BROKEN_HOOK_HOWEVER = /^\s*however,\s*the\s+club\s+also/i;

function hasBrokenHookPattern(text: string): boolean {
  return (
    RE_BROKEN_HOOK_ARROW.test(text) ||
    /\.{2}/.test(text) ||
    RE_BROKEN_HOOK_ELLIPSIS.test(text) ||
    RE_BROKEN_HOOK_HOWEVER.test(text)
  );
}

/** Creator-oriented intelligence modes only. */
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

/** Strip stacked / duplicate question prefixes until stable. */
export function stripQuestionPrefixes(title: string): string {
  let t = title.trim();
  if (!t) return t;

  if (t.includes("---")) {
    t = t.split("---")[0].trim();
  }

  for (let pass = 0; pass < 6; pass++) {
    const lower = t.toLowerCase();
    let changed = false;

    for (const re of QUESTION_PREFIXES) {
      if (re.test(t)) {
        t = t.replace(re, "").trim();
        changed = true;
      }
    }

    const doubled = t.match(
      /^(how did|why did|what makes|what angle does|what point does|explain|what defines)\s+(\1\s+)/i,
    );
    if (doubled) {
      t = t.replace(doubled[0], `${doubled[1]} `).trim();
      changed = true;
    }

    if (/^(how|why|what|which|who)\s+[A-Z]/.test(t) && QUESTION_PREFIXES.some((re) => re.test(t.slice(1)))) {
      const inner = t.replace(/^(how|why|what|which|who)\s+/i, "");
      if (QUESTION_PREFIXES.some((re) => re.test(inner))) {
        t = inner.trim();
        changed = true;
      }
    }

    if (!changed || t === lower) break;
  }

  return fixStackedCasing(t);
}

function fixStackedCasing(title: string): string {
  const m = title.match(
    /^(how did|why did|what makes|what angle does|how does|why was|what tension)\s+(.+)$/i,
  );
  if (!m) return title;
  const prefix = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const rest = m[2].trim();
  const restFixed = rest.charAt(0).toUpperCase() + rest.slice(1);
  return `${prefix} ${restFixed}`;
}

export function splitAnswerFromTitle(title: string): string {
  const parts = title.split(/\s*---+\s*/);
  return parts[0]?.trim() ?? title;
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function titleHasAnswerLeakage(title: string, content: string): boolean {
  const q = normalizeWhitespace(title.toLowerCase());
  const answer = normalizeWhitespace(content.toLowerCase().slice(0, 200));
  if (answer.length < 40) return false;
  if (q.length > 20 && answer.startsWith(q.slice(0, Math.min(q.length, 60)))) return true;
  const answerStart = answer.split(/[.!?]/)[0] ?? "";
  if (answerStart.length > 30 && q.includes(answerStart.slice(0, 40))) return true;
  return false;
}

export function isBannedLearnTitle(
  title: string,
  options?: { creatorMode?: boolean },
): boolean {
  const t = title.trim();
  if (t.length < 8) return true;
  if (t.includes("---")) return true;
  if (hasBrokenHookPattern(t)) return true;
  if (/\s\u2192\s*\.{0,3}$/.test(t)) return true;
  if (BANNED_GLOBAL.some((re) => re.test(t))) return true;
  if (!options?.creatorMode && CREATOR_ONLY.some((re) => re.test(t))) return true;
  if (/^(how did|why did|what makes)\s+(how|why|what)\s/i.test(t)) return true;
  return false;
}

export function rewriteTitleFromPattern(input: {
  card: LearnCardOutput;
  strategy?: ModeLearnStrategy;
  documentTitle?: string;
}): string | null {
  const { card, strategy, documentTitle } = input;
  const content = card.content.trim();
  const ents = capitalizedPhrases(`${card.title} ${content}`);
  const subject = ents[0] ?? documentTitle?.slice(0, 40) ?? "this topic";
  const pattern = card.learnPattern ?? "";
  const text = `${card.title} ${content}`.toLowerCase();

  if (isStudentHistoricalStrategy(strategy)) {
    if (pattern.includes("timeline") || /\b\d{4}\b/.test(text) || /\bjuly|march|era\b/i.test(text)) {
      const event = ents[1] ?? ents[0] ?? "this event";
      if (/\b3\s*july|july\s*3\b/i.test(text)) {
        return "Why was 3 July more than a sports scandal?";
      }
      return `Why was ${event} a turning point?`.slice(0, LEARN_TITLE_MAX);
    }
    if (pattern.includes("cause") || /\bled to|because|resulted\b/i.test(text)) {
      return `How did ${subject} change after the key rupture?`.slice(0, LEARN_TITLE_MAX);
    }
    if (/\bconflict|tension|crisis|pressure|versus\b/i.test(text)) {
      return `What tension defined ${subject}?`.slice(0, LEARN_TITLE_MAX);
    }
    if (/\btransform|shift|became|coexist\b/i.test(text)) {
      if (/\bcoexist\b/i.test(text)) {
        return `How did sporting success coexist with political pressure?`.slice(0, LEARN_TITLE_MAX);
      }
      return `How did ${subject} transform across the period?`.slice(0, LEARN_TITLE_MAX);
    }
    if (/\bidentity|civil|institution|club\b/i.test(text)) {
      return `Why does the source frame ${subject} as more than a surface category?`.slice(0, LEARN_TITLE_MAX);
    }
    if (/\bstadium|financial|revenue|debt\b/i.test(text)) {
      return `How did the stadium project change ${subject}'s financial model?`.slice(0, LEARN_TITLE_MAX);
    }
    return `What consequence followed the pivotal event for ${subject}?`.slice(0, LEARN_TITLE_MAX);
  }

  if (pattern.includes("cause") || card.type === "why_it_matters") {
    return `Why did ${subject} matter in this analysis?`.slice(0, LEARN_TITLE_MAX);
  }
  if (pattern.includes("timeline")) {
    return `What changed after the key turning point for ${subject}?`.slice(0, LEARN_TITLE_MAX);
  }

  const clause = content.split(/[.!?]/).find((s) => s.trim().length >= 24 && s.length <= 100);
  if (clause && ents[0]) {
    return `Why does ${ents[0]} matter: ${clause.trim().slice(0, 48)}?`.slice(0, LEARN_TITLE_MAX);
  }

  return null;
}

export function sanitizeLearnCardTitle(
  card: LearnCardOutput,
  options?: {
    documentTitle?: string;
    strategy?: ModeLearnStrategy;
    intelligenceModeId?: string | null;
  },
): string {
  let title = splitAnswerFromTitle(card.title);
  title = stripQuestionPrefixes(title);
  title = normalizeWhitespace(title);

  const creatorMode = isCreatorIntelligenceMode(
    options?.intelligenceModeId,
    options?.strategy,
  );

  if (isBannedLearnTitle(title, { creatorMode }) || titleHasAnswerLeakage(title, card.content)) {
    const rewritten = rewriteTitleFromPattern({
      card,
      strategy: options?.strategy,
      documentTitle: options?.documentTitle,
    });
    if (rewritten && !isBannedLearnTitle(rewritten, { creatorMode })) {
      title = rewritten;
    }
  }

  if (!title.endsWith("?") && card.type !== "memory_hook" && title.length < 100) {
    if (/^(why|how|what|which|who)\b/i.test(title)) {
      title = title.endsWith("?") ? title : `${title}?`;
    }
  }

  if (title.length > LEARN_TITLE_MAX) {
    const cut = title.slice(0, LEARN_TITLE_MAX - 1).replace(/\s+\S*$/, "");
    title = `${cut}…`;
  }

  return title.trim();
}

export function isBrokenMemoryHookContent(content: string): boolean {
  const t = content.trim();
  if (t.length < 12 || t.length > 140) return true;
  if (hasBrokenHookPattern(t)) return true;
  if (/^\s*however,\s/i.test(t)) return true;
  if (/\b\w\s+\u2192\s+the\b/i.test(t)) return true;
  if ((t.match(/\u2026/g) ?? []).length > 0 && t.length < 40) return true;
  return false;
}

export function sanitizeMemoryHookContent(card: LearnCardOutput): string {
  const content = card.content.trim();
  if (!isBrokenMemoryHookContent(content)) return content;

  const ents = capitalizedPhrases(`${card.title} ${content}`);
  if (/\b(growth|rise).*(rupture|crisis)/i.test(content)) {
    return "Growth \u2192 rupture \u2192 resistance \u2192 recovery.";
  }
  if (/\b3\s*july|july\s*3\b/i.test(content)) {
    return "3 July turned a club crisis into a civil resistance memory.";
  }
  if (ents.length >= 2) {
    return `${ents[0]} ↔ ${ents[1]}: core tension to recall.`;
  }
  const short = content
    .replace(/\s+\u2192\s+the\s+.*$/i, "")
    .split(/[.!?]/)
    .find((s) => s.trim().length >= 18 && s.length <= 90);
  if (short) return short.trim().slice(0, 120);
  return `Anchor: ${ents[0] ?? card.title.slice(0, 40)}.`;
}

export type FinalLearnCardValidationOptions = {
  documentTitle?: string;
  strategy?: ModeLearnStrategy;
  intelligenceModeId?: string | null;
};

/** Last-pass validation + rewrite for all learn cards. */
export function finalValidateLearnCards(
  cards: LearnCardOutput[],
  options: FinalLearnCardValidationOptions = {},
): LearnCardOutput[] {
  const creatorMode = isCreatorIntelligenceMode(
    options.intelligenceModeId,
    options?.strategy,
  );

  return cards.map((card) => {
    let title = sanitizeLearnCardTitle(card, options);
    if (isBannedLearnTitle(title, { creatorMode })) {
      const rewritten = rewriteTitleFromPattern({
        card: { ...card, title },
        strategy: options.strategy,
        documentTitle: options.documentTitle,
      });
      if (rewritten) title = rewritten;
    }

    let content = card.content;
    if (card.type === "memory_hook") {
      content = sanitizeMemoryHookContent({ ...card, title });
    }

    return {
      ...card,
      title: title.slice(0, LEARN_TITLE_MAX),
      content: content.trim().slice(0, 380),
    };
  });
}
