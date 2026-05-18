/**
 * SERVER ONLY — editorial titles & labels for presentation learn cards (deterministic).
 */

import type { LearnCardKind, LearnCandidate } from "./types";
import {
  fragmentQualityPenalty,
  isLowQualityPresentationFragment,
  normalizeDeckText,
  scorePresentationFragment,
} from "@/server/presentation/presentationFragments";

const INTERNAL_LIMIT_PATTERNS: Array<{ patterns: RegExp[]; title: string }> = [
  {
    patterns: [
      /source text is short/i,
      /source is short/i,
      /thin source/i,
      /text is short/i,
      /limited grounding/i,
      /not enough.+content/i,
    ],
    title: "Limited Strategic Context",
  },
  {
    patterns: [
      /slide deck format/i,
      /fragmented/i,
      /weak structural/i,
      /weak structure/i,
      /incomplete narrative/i,
      /narrative flow/i,
      /slide order/i,
    ],
    title: "Incomplete Narrative Flow",
  },
  {
    patterns: [
      /missing proof/i,
      /missing kpi/i,
      /lack(s)? (of )?evidence/i,
      /no (clear )?metrics/i,
      /execution detail/i,
    ],
    title: "Missing Execution Detail",
  },
  {
    patterns: [
      /audience/i,
      /unclear (who|audience)/i,
      /weak framing/i,
      /positioning/i,
    ],
    title: "Weak Audience Framing",
  },
  {
    patterns: [
      /does not provide enough/i,
      /coverage gap/i,
      /incomplete/i,
    ],
    title: "Limited Strategic Context",
  },
];

const CONCEPT_LIFTS: Array<{ match: RegExp; phrase: string }> = [
  { match: /\b(guerrilla|gerilla)\b/i, phrase: "Guerrilla" },
  { match: /\b(totem)\b/i, phrase: "Totem" },
  { match: /\b(mobil|mobile|taşınabilir|tasinabilir|portable)\b/i, phrase: "Portable" },
  { match: /\b(kampanya|campaign)\b/i, phrase: "Campaign" },
  { match: /\b(qr)\b/i, phrase: "QR" },
  { match: /\b(entegrasyon|integration|interactive)\b/i, phrase: "Interactive" },
  { match: /\b(personel|personnel|staffing|operational)\b/i, phrase: "Operational" },
  { match: /\b(aktivasyon|activation)\b/i, phrase: "Activation" },
  { match: /\b(pazarlama|marketing)\b/i, phrase: "Marketing" },
  { match: /\b(strateji|strategy|strategic)\b/i, phrase: "Strategic" },
  { match: /\b(marka|brand)\b/i, phrase: "Brand" },
  { match: /\b(dijital|digital)\b/i, phrase: "Digital" },
  { match: /\b(saha|field|retail)\b/i, phrase: "Field" },
  { match: /\b(ölçüm|measurement|kpi|metrics)\b/i, phrase: "Measurement" },
];

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "slide",
  "version",
  "mobil",
  "mobile",
  "list",
  "agenda",
]);

function titleCase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/^[A-Z]{2,}$/.test(w)) return w;
      if (w.length <= 3) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function forceEditorialCase(text: string): string {
  const t = titleCase(text.replace(/\s+/g, " ").trim());
  if (t === t.toUpperCase() && t.length > 4) {
    return titleCase(t.toLowerCase());
  }
  return t;
}

function significantTokens(text: string, max = 6): string[] {
  const norm = normalizeDeckText(text);
  return norm
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, max);
}

function collectConceptLifts(text: string): string[] {
  const phrases: string[] = [];
  for (const lift of CONCEPT_LIFTS) {
    if (lift.match.test(text)) phrases.push(lift.phrase);
  }
  return [...new Set(phrases)];
}

function buildLiftedPhrase(text: string): string | null {
  const lifts = collectConceptLifts(text);
  if (lifts.length >= 2) {
    if (lifts.includes("Portable") && lifts.includes("Totem")) {
      return "Portable Totem Activation";
    }
    if (lifts.includes("QR") && (lifts.includes("Interactive") || lifts.includes("Campaign"))) {
      return "Interactive Campaign Extensions";
    }
    if (lifts.includes("Operational") && lifts.includes("Activation")) {
      return "Operational Activation Planning";
    }
    if (lifts.includes("Guerrilla") && lifts.includes("Marketing")) {
      return "Guerrilla Marketing Concepts";
    }
    return lifts.slice(0, 3).join(" ");
  }
  if (lifts.length === 1) {
    const tokens = significantTokens(text, 2).filter(
      (t) => !lifts[0].toLowerCase().includes(t),
    );
    if (tokens.length > 0) {
      return `${lifts[0]} ${titleCase(tokens.join(" "))}`;
    }
    return lifts[0];
  }
  return null;
}

function abstractFromBody(rawTitle: string | undefined, body: string): string {
  const lifted = buildLiftedPhrase(`${rawTitle ?? ""} ${body}`);
  if (lifted && !isLowQualityPresentationFragment(lifted)) {
    return forceEditorialCase(lifted).slice(0, 56);
  }

  const tokens = significantTokens(body, 5);
  if (tokens.length >= 2) {
    return forceEditorialCase(tokens.join(" ")).slice(0, 56);
  }

  if (rawTitle && !isLowQualityPresentationFragment(rawTitle)) {
    return forceEditorialCase(rawTitle).slice(0, 56);
  }

  return forceEditorialCase(tokens[0] ?? "Deck Theme").slice(0, 56);
}

/**
 * Editorial misconception / risk card title — never expose extraction internals.
 */
export function refinePresentationMisconceptionTitle(content: string): string {
  const text = content.trim();
  for (const rule of INTERNAL_LIMIT_PATTERNS) {
    if (rule.patterns.some((p) => p.test(text))) {
      return rule.title;
    }
  }

  if (isLowQualityPresentationFragment(text)) {
    return "Incomplete Narrative Flow";
  }

  const lifted = buildLiftedPhrase(text);
  if (lifted) return forceEditorialCase(lifted).slice(0, 56);

  const tokens = significantTokens(text, 4);
  if (tokens.length >= 2) {
    return forceEditorialCase(`${tokens[0]} ${tokens[1]} Gap`).slice(0, 56);
  }

  return "Strategic Gap to Verify";
}

export function refinePresentationLearnTitle(
  candidate: LearnCandidate,
  corpusEntities: Set<string>,
): string {
  const rawTitle = candidate.title.trim();
  const content = candidate.content.trim();

  if (candidate.kind === "misconception") {
    return refinePresentationMisconceptionTitle(`${rawTitle} ${content}`);
  }

  const titleQuality = scorePresentationFragment(rawTitle);
  const useBody =
    titleQuality.isLowQuality ||
    rawTitle === rawTitle.toUpperCase() ||
    isLowQualityPresentationFragment(rawTitle);

  let phrase: string;
  if (useBody) {
    phrase = abstractFromBody(rawTitle, content);
  } else {
    phrase = forceEditorialCase(rawTitle);
    if (scorePresentationFragment(phrase).isLowQuality) {
      phrase = abstractFromBody(undefined, content);
    }
  }

  if (candidate.kind === "connection" && phrase.length < 12) {
    const parts = content.split(/\s+(?:↔|→|with)\s+/i);
    if (parts.length >= 2) {
      phrase = `${abstractFromBody(undefined, parts[0])} ↔ ${abstractFromBody(undefined, parts[1])}`;
    }
  }

  const entityHit = [...corpusEntities].find(
    (e) => e.length > 4 && content.toLowerCase().includes(e) && !STOP.has(e),
  );
  if (entityHit && phrase.length < 20 && !phrase.toLowerCase().includes(entityHit)) {
    phrase = `${forceEditorialCase(entityHit)} — ${phrase}`;
  }

  return forceEditorialCase(phrase).slice(0, 56);
}

export type SlideOutlineLabel = {
  displayLabel: string;
  semanticTitle?: string;
  confidence: "high" | "low";
};

/**
 * Slide outline label for preview panel.
 */
export function synthesizeSlideOutlineLabel(
  slideNumber: number,
  rawTitle?: string,
  previewText?: string,
): SlideOutlineLabel {
  const body = `${rawTitle ?? ""} ${previewText ?? ""}`.trim();
  const titleQuality = rawTitle ? scorePresentationFragment(rawTitle) : { isLowQuality: true, score: 1, reasons: [] };

  let semantic: string | undefined;
  let confidence: "high" | "low" = "low";

  if (rawTitle && !titleQuality.isLowQuality && rawTitle !== rawTitle.toUpperCase()) {
    semantic = forceEditorialCase(rawTitle);
    confidence = "high";
  } else {
    const lifted = buildLiftedPhrase(body);
    if (lifted && !isLowQualityPresentationFragment(lifted)) {
      semantic = forceEditorialCase(lifted);
      confidence = scorePresentationFragment(lifted).score < 0.35 ? "high" : "low";
    } else {
      const tokens = significantTokens(body, 4);
      if (tokens.length >= 2) {
        semantic = forceEditorialCase(tokens.join(" "));
        confidence = "low";
      }
    }
  }

  if (semantic && confidence === "high") {
    return {
      displayLabel: `Slide ${slideNumber} · ${semantic}`,
      semanticTitle: semantic,
      confidence,
    };
  }

  if (semantic && confidence === "low") {
    return {
      displayLabel: `Slide ${slideNumber} · ${semantic}`,
      semanticTitle: semantic,
      confidence,
    };
  }

  return {
    displayLabel: `Slide ${slideNumber}`,
    confidence: "low",
  };
}

export function presentationTitlePenalty(title: string, content: string): number {
  return fragmentQualityPenalty(`${title} ${content}`);
}

export function polishPresentationCardContent(
  kind: LearnCardKind,
  content: string,
): string {
  let text = content.trim();
  text = text.replace(/\bsource text\b/gi, "deck");
  text = text.replace(/\bslide deck format\b/gi, "narrative structure");
  text = text.replace(/\bthe source does not provide enough\b/gi, "The deck leaves gaps around");
  if (kind === "misconception" && /^potential risk:/i.test(text)) {
    text = text.replace(/^potential risk:\s*/i, "");
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}
