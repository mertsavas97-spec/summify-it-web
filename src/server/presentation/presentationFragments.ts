/**
 * SERVER ONLY — detect low-quality slide-deck fragments (deterministic).
 */

const GENERIC_DECK_LABELS = new Set([
  "to do list",
  "todo list",
  "agenda",
  "personel",
  "personnel",
  "qr entegrasyon",
  "qr integration",
  "slide",
  "version",
  "versiyon",
  "mobil",
  "mobile",
  "overview",
  "summary",
  "contents",
  "thank you",
  "questions",
  "appendix",
  "notes",
  "title slide",
]);

const VERB_PATTERN =
  /\b(is|are|was|were|be|been|have|has|had|do|does|did|will|would|can|could|should|may|might|must|need|needs|enable|enables|drive|drives|build|builds|create|creates|show|shows|use|uses|help|helps|improve|improves|support|supports|deliver|delivers|plan|plans|target|targets|measure|measures|grow|grows|reduce|reduces|launch|launches)\b/i;

export type FragmentQuality = {
  score: number;
  isLowQuality: boolean;
  reasons: string[];
};

function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedLabel(text: string): string {
  return foldText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  return foldText(text).split(/\s+/).filter(Boolean).length;
}

function uppercaseRatio(text: string): number {
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 4) return 0;
  const upper = letters.replace(/[^A-ZÀ-ÖØ-Þ]/g, "").length;
  return upper / letters.length;
}

function punctuationRatio(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const punct = trimmed.replace(/[^\-–—/\\|•●·:;,.\s]/g, "").length;
  return punct / trimmed.length;
}

function separatorHeavy(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  const sep = (t.match(/[-–—/\\|•●·]/g) ?? []).length;
  return sep >= 2 && sep / t.length > 0.12;
}

function isMostlyBullets(text: string): boolean {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const bulletLines = lines.filter((l) => /^[-•●·▪◦]\s/.test(l) || /^\d+[.)]\s/.test(l));
  return bulletLines.length >= Math.max(2, Math.ceil(lines.length * 0.7));
}

function lacksVerbContext(text: string): boolean {
  const words = wordCount(text);
  if (words <= 3) return true;
  if (words <= 8 && !VERB_PATTERN.test(text)) return true;
  return false;
}

function isGenericDeckLabel(text: string): boolean {
  const label = normalizedLabel(text);
  if (!label) return true;
  if (GENERIC_DECK_LABELS.has(label)) return true;
  for (const generic of GENERIC_DECK_LABELS) {
    if (label === generic || label.startsWith(`${generic} `)) return true;
  }
  return false;
}

/**
 * Score fragment quality (0 = strong, 1 = very weak).
 */
export function scorePresentationFragment(text: string): FragmentQuality {
  const trimmed = foldText(text);
  const reasons: string[] = [];
  let score = 0;

  if (!trimmed) {
    return { score: 1, isLowQuality: true, reasons: ["empty"] };
  }

  if (wordCount(trimmed) <= 3) {
    score += 0.35;
    reasons.push("too_short");
  }

  if (uppercaseRatio(trimmed) >= 0.72 && trimmed.length >= 5) {
    score += 0.3;
    reasons.push("all_caps");
  }

  if (isGenericDeckLabel(trimmed)) {
    score += 0.4;
    reasons.push("generic_label");
  }

  if (separatorHeavy(trimmed)) {
    score += 0.25;
    reasons.push("separator_heavy");
  }

  if (punctuationRatio(trimmed) > 0.22) {
    score += 0.15;
    reasons.push("high_punctuation");
  }

  if (isMostlyBullets(trimmed)) {
    score += 0.2;
    reasons.push("bullet_only");
  }

  if (lacksVerbContext(trimmed)) {
    score += 0.2;
    reasons.push("no_verb_context");
  }

  const finalScore = Math.min(1, score);
  return {
    score: finalScore,
    isLowQuality: finalScore >= 0.45,
    reasons,
  };
}

export function isLowQualityPresentationFragment(text: string): boolean {
  return scorePresentationFragment(text).isLowQuality;
}

/** Normalize deck text for dedupe / topic overlap. */
export function normalizeDeckText(text: string): string {
  return normalizedLabel(text);
}

/** Stem set for semantic dedupe (drops generics and very short tokens). */
export function presentationSemanticStems(text: string): Set<string> {
  const stems = new Set<string>();
  const normalized = normalizeDeckText(text);
  for (const token of normalized.split(/\s+/)) {
    if (token.length < 4) continue;
    if (GENERIC_DECK_LABELS.has(token)) continue;
    stems.add(token);
  }
  return stems;
}

export function fragmentQualityPenalty(text: string): number {
  const { score, isLowQuality } = scorePresentationFragment(text);
  if (isLowQuality) return 0.25 + score * 0.35;
  if (score > 0.25) return score * 0.15;
  return 0;
}

export function filterDeckTopics(topics: string[]): string[] {
  return topics.filter((t) => !isLowQualityPresentationFragment(t));
}
