import type { PracticeRetentionHint } from "@/lib/learn/retentionTypes";
import type { GeneratedReviewItem } from "@/types/memory";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesWeakConcept(item: GeneratedReviewItem, concepts: string[]): boolean {
  const blob = normalize(`${item.prompt} ${item.answer} ${item.context ?? ""}`);
  return concepts.some((c) => {
    const fragment = normalize(c).slice(0, 28);
    return fragment.length >= 8 && blob.includes(fragment);
  });
}

function promptMatches(item: GeneratedReviewItem, prompts: string[]): boolean {
  const p = normalize(item.prompt);
  return prompts.some((hint) => {
    const h = normalize(hint);
    return h.length >= 12 && (p === h || p.includes(h.slice(0, 40)) || h.includes(p.slice(0, 40)));
  });
}

/**
 * Re-prioritize generated review items using session-local retention hints.
 */
export function prioritizeReviewItemsByRetention(
  items: GeneratedReviewItem[],
  hint?: PracticeRetentionHint | null,
): GeneratedReviewItem[] {
  if (!hint || items.length <= 1) return items;

  const weakConcepts = hint.weakConcepts ?? [];
  const gotItPrompts = hint.gotItPrompts ?? [];
  const weakPrompts = hint.weakPrompts ?? [];

  const scored = items.map((item, index) => {
    let score = 50;
    if (promptMatches(item, weakPrompts)) score += 40;
    if (promptMatches(item, gotItPrompts)) score -= 35;
    if (matchesWeakConcept(item, weakConcepts)) score += 28;
    if (/recognition|easy/i.test(item.prompt)) score -= 5;
    if (/synthesis|compare|why|how did/i.test(item.prompt)) score += 8;
    return { item, score, index };
  });

  const easyAnchor = scored.find((s) => /recognition|what is|core/i.test(s.item.prompt));
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const out: GeneratedReviewItem[] = [];

  if (easyAnchor && !out.includes(easyAnchor.item)) {
    out.push(easyAnchor.item);
  }

  for (const entry of sorted) {
    if (out.includes(entry.item)) continue;
    out.push(entry.item);
  }

  return out.length > 0 ? out : items;
}
