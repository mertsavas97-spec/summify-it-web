import type { PracticeSessionCard } from "@/lib/learn/practiceSessionTypes";

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let s = hashSeed(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesTheme(card: PracticeSessionCard, theme: string): boolean {
  const needle = normalize(theme).slice(0, 40);
  if (!needle) return false;
  const hay = normalize(`${card.label ?? ""} ${card.prompt} ${card.answer}`);
  return hay.includes(needle) || needle.includes(normalize(card.label ?? card.prompt).slice(0, 24));
}

/**
 * Build a distinct Learn deck for a session version.
 * - Different `version` → different shuffle seed (new pass, not a wipe of v1)
 * - Optional weak themes float to the front for focused review
 */
export function orderPracticeCardsForVersion(
  cards: PracticeSessionCard[],
  options: {
    version: number;
    focusThemes?: string[];
  },
): PracticeSessionCard[] {
  if (cards.length === 0) return [];

  const seed = `learn-session-v${options.version}`;
  const shuffled = shuffleWithSeed(cards, seed);
  const themes = (options.focusThemes ?? []).map(normalize).filter(Boolean);

  if (themes.length === 0) return shuffled;

  const prioritized: PracticeSessionCard[] = [];
  const rest: PracticeSessionCard[] = [];

  for (const card of shuffled) {
    if (themes.some((theme) => matchesTheme(card, theme))) prioritized.push(card);
    else rest.push(card);
  }

  return [...prioritized, ...rest];
}
