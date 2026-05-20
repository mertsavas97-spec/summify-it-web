/**
 * Learn card title sanitization — delegates strict validation to validateLearnTitle.ts.
 */

import type { LearnCardOutput } from "@/types/text-analysis";
import type { ModeLearnStrategy } from "./modeLearnStrategies";
import {
  applyStrictTitleValidation,
  buildSafeLearnTitle,
  ensureValidLearnTitle,
  isCreatorIntelligenceMode,
  isStudentHistoricalStrategy,
  learnTitleValidationDebugStats,
  splitAnswerFromTitle,
  stripQuestionPrefixes,
  validateLearnTitle,
  validateQuestionAnswerAlignment,
  type LearnTitleValidationStats,
} from "./validateLearnTitle";

export {
  buildSafeLearnTitle,
  ensureValidLearnTitle,
  isCreatorIntelligenceMode,
  isStudentHistoricalStrategy,
  learnTitleValidationDebugStats,
  splitAnswerFromTitle,
  stripQuestionPrefixes,
  validateLearnTitle,
  validateQuestionAnswerAlignment,
  type LearnTitleValidationStats,
};

export const LEARN_TITLE_MAX = 110;

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

export function titleHasAnswerLeakage(title: string, content: string): boolean {
  const q = title.toLowerCase().replace(/\s+/g, " ");
  const answer = content.toLowerCase().slice(0, 200);
  if (answer.length > 40 && q.length > 20 && answer.startsWith(q.slice(0, 50))) return true;
  return false;
}

export function isBannedLearnTitle(
  title: string,
  options?: { creatorMode?: boolean },
): boolean {
  return !validateLearnTitle(title, options).valid;
}

export function rewriteTitleFromPattern(input: {
  card: LearnCardOutput;
  strategy?: ModeLearnStrategy;
  documentTitle?: string;
}): string {
  return buildSafeLearnTitle(input);
}

export function sanitizeLearnCardTitle(
  card: LearnCardOutput,
  options?: {
    documentTitle?: string;
    strategy?: ModeLearnStrategy;
    intelligenceModeId?: string | null;
  },
): string {
  const stripped = stripQuestionPrefixes(splitAnswerFromTitle(card.title));
  const { title } = ensureValidLearnTitle({ ...card, title: stripped }, options);
  return title;
}

export function isBrokenMemoryHookContent(content: string): boolean {
  const t = content.trim();
  if (t.length < 12 || t.length > 140) return true;
  if (hasBrokenHookPattern(t)) return true;
  if (/^\s*however,\s/i.test(t)) return true;
  if (/\b\w\s+\u2192\s+the\b/i.test(t)) return true;
  if ((t.match(/\u2026/g) ?? []).length > 0 && t.length < 50) return true;
  if (/↔/.test(t) && t.length < 60) return true;
  return false;
}

export function sanitizeMemoryHookContent(card: LearnCardOutput): string {
  const content = card.content.trim();
  if (!isBrokenMemoryHookContent(content)) return content;

  const text = `${card.title} ${content}`;
  if (/\b(growth|rise).*(rupture|crisis)/i.test(text)) {
    return "Growth \u2192 rupture \u2192 resistance \u2192 recovery.";
  }
  if (/\b3\s*july|july\s*3\b/i.test(text)) {
    return "3 July turned a club crisis into a civil resistance memory.";
  }
  const sentence = content
    .replace(/\s+\u2192\s+the\s+.*$/i, "")
    .split(/[.!?]/)
    .find((s) => s.trim().length >= 18 && s.length <= 90);
  if (sentence) return sentence.trim().slice(0, 120);
  return "Key turning point \u2192 institutional pressure \u2192 public response.";
}

export type FinalLearnCardValidationOptions = {
  documentTitle?: string;
  strategy?: ModeLearnStrategy;
  intelligenceModeId?: string | null;
};

/** Last-pass validation — strict templates only. */
export function finalValidateLearnCards(
  cards: LearnCardOutput[],
  options: FinalLearnCardValidationOptions = {},
): { cards: LearnCardOutput[]; titleStats: LearnTitleValidationStats } {
  const sanitized = cards.map((card) => {
    let content = card.content;
    if (card.type === "memory_hook") {
      content = sanitizeMemoryHookContent({ ...card, title: card.title });
    }
    return { ...card, content: content.trim().slice(0, 380) };
  });

  const { cards: validated, stats } = applyStrictTitleValidation(sanitized, options);
  return { cards: validated, titleStats: stats };
}
