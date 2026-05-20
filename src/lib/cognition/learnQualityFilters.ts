/**
 * Phase 11D — reject low-information learn candidates before ranking.
 */

type LearnCardKindFilter =
  | "concept"
  | "why_it_matters"
  | "memory_hook"
  | "quiz"
  | "connection"
  | "misconception";

const REJECT_CONTENT = [
  /\breaders should understand\b/i,
  /\bfurther research may help\b/i,
  /\bthis could be important\b/i,
  /\bit is important to note\b/i,
  /\bapproach critically\b/i,
  /\bconsider (potential )?bias\b/i,
  /\bcomprehensive understanding\b/i,
  /\bgenerally speaking\b/i,
  /\bin today's (world|environment)\b/i,
  /\bthe (document|source) (discusses|explains|covers)\b/i,
  /\bthis (document|section) (discusses|explains)\b/i,
];

const WEAK_WHY = [
  /^why it matters$/i,
  /^importance of\b/i,
  /^understanding\b/i,
  /^overview of\b/i,
];

const FAKE_MYTH = [
  /^(myth|misconception|clarify the risk)/i,
  /approach critically/i,
  /potential bias/i,
];

/** True if candidate should be dropped entirely. */
export function isLowQualityLearnCandidate(input: {
  title: string;
  content: string;
  kind: LearnCardKindFilter;
}): boolean {
  const combined = `${input.title} ${input.content}`.trim();
  if (combined.length < 28) return true;

  if (REJECT_CONTENT.some((p) => p.test(combined))) return true;

  if (input.kind === "why_it_matters" && WEAK_WHY.some((p) => p.test(input.title.trim()))) {
    return true;
  }

  if (input.kind === "misconception" && FAKE_MYTH.some((p) => p.test(input.title))) {
    return true;
  }

  // Obvious summary paraphrase: title is substring of first sentence with little delta
  const titleNorm = input.title.toLowerCase().replace(/[^\w\s]/g, "");
  const contentNorm = input.content.toLowerCase().replace(/[^\w\s]/g, "");
  if (titleNorm.length > 20 && contentNorm.startsWith(titleNorm.slice(0, Math.min(40, titleNorm.length)))) {
    const extra = contentNorm.length - titleNorm.length;
    if (extra < 40) return true;
  }

  return false;
}

export function filterLearnCandidates<
  T extends { title: string; content: string; kind: LearnCardKindFilter },
>(
  candidates: T[],
): T[] {
  return candidates.filter((c) => !isLowQualityLearnCandidate(c));
}
