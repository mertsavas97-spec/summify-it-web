/**
 * SERVER ONLY — plan-aware soft limits on extracted document text.
 */

import type { PlanLimits } from "@/lib/plans/planLimits";
import { getPlanLimitNotice } from "@/lib/plans/uploadCopy";
import { cleanText } from "./cleanText";

const SECTION_SPLIT =
  /\n(?=#{1,3}\s+|---\s*Slide\s+\d+|--- Slide \d+|\n[A-Z][A-Za-z0-9\s\-–—:]{4,60}\n)/;

const PRIORITY_SCORES: { pattern: RegExp; score: number }[] = [
  { pattern: /\b(executive\s+summary|summary|abstract|overview)\b/i, score: 12 },
  { pattern: /\b(conclusion|key takeaway|in summary|takeaways)\b/i, score: 11 },
  { pattern: /\b(risk|warning|caution|liabilit)\b/i, score: 9 },
  { pattern: /\b(action item|next step|recommendation)\b/i, score: 9 },
  { pattern: /\b(timeline|chronolog|19\d{2}|20\d{2})\b/i, score: 8 },
  { pattern: /\b(cause|effect|because|led to|resulted)\b/i, score: 8 },
  { pattern: /\b(entity|stakeholder|revenue|profit|growth)\b/i, score: 6 },
];

export type PlanDocumentLimitResult = {
  text: string;
  fullExtractedCharacters: number;
  analyzedCharacters: number;
  extractedPages: number;
  wasTruncated: boolean;
  wasChunked: boolean;
  truncationStrategy: string | null;
  limitNotice: string | null;
};

function estimatePages(charCount: number, explicitPages?: number): number {
  if (explicitPages != null && explicitPages > 0) return explicitPages;
  return Math.max(1, Math.ceil(charCount / 3_000));
}

function scoreSection(text: string, index: number, total: number): number {
  let score = 0;
  for (const { pattern, score: w } of PRIORITY_SCORES) {
    if (pattern.test(text)) score += w;
  }
  if (index === 0) score += 15;
  if (index === total - 1 && total > 1) score += 12;
  const entityHits = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
  if (entityHits && entityHits.length >= 2) score += 4;
  if (/\d+([.,]\d+)?%?/.test(text)) score += 3;
  return score;
}

function splitSections(cleaned: string): string[] {
  const parts = cleaned.split(SECTION_SPLIT).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [cleaned];
}

function assembleWithinBudget(sections: { text: string; score: number }[], maxChars: number): string {
  const ordered = [...sections].sort((a, b) => b.score - a.score);
  const chunks: string[] = [];
  let used = 0;

  for (const section of ordered) {
    const piece = section.text.trim();
    if (!piece) continue;
    const separator = chunks.length > 0 ? "\n\n" : "";
    if (used + separator.length + piece.length > maxChars) {
      const remaining = maxChars - used - separator.length;
      if (remaining > 400) {
        chunks.push(`${piece.slice(0, remaining)}\n\n[Section trimmed for plan limits.]`);
        used = maxChars;
      }
      break;
    }
    chunks.push(piece);
    used += separator.length + piece.length;
  }

  return chunks.join("\n\n");
}

function softTruncate(cleaned: string, maxChars: number, strategy: string): string {
  if (cleaned.length <= maxChars) {
    return cleaned;
  }

  const sections = splitSections(cleaned).map((text, index, arr) => ({
    text,
    score: scoreSection(text, index, arr.length),
  }));

  if (sections.length <= 1) {
    const head = Math.floor(maxChars * 0.65);
    const tail = maxChars - head - 80;
    const headText = cleaned.slice(0, head);
    const tailText = tail > 0 ? cleaned.slice(-tail) : "";
    return `${headText}\n\n[…]\n\n${tailText}\n\n[Content prioritized for plan limits.]`;
  }

  return assembleWithinBudget(sections, maxChars);
}

function selectChunkedSections(cleaned: string, limits: PlanLimits): string {
  const sections = splitSections(cleaned);
  const segmentBudget = Math.min(
    limits.maxCharacters,
    Math.max(48_000, Math.floor(limits.maxCharacters * 0.4)),
  );
  const scored = sections.map((text, index, arr) => ({
    text,
    score: scoreSection(text, index, arr.length),
  }));
  return assembleWithinBudget(scored, segmentBudget);
}

/**
 * Apply plan page/character limits without rejecting the upload.
 * Extract first, then prioritize sections for analysis-sized output.
 */
export function applyPlanDocumentLimits(
  rawText: string,
  limits: PlanLimits,
  options?: { estimatedPages?: number },
): PlanDocumentLimitResult {
  const cleaned = cleanText(rawText);
  const fullExtractedCharacters = cleaned.length;
  const extractedPages = estimatePages(fullExtractedCharacters, options?.estimatedPages);

  const overPages = extractedPages > limits.maxPages;
  const overChars = fullExtractedCharacters > limits.maxCharacters;
  const useChunked =
    limits.supportsChunkedAnalysis &&
    fullExtractedCharacters > limits.maxCharacters * 0.35;

  let text = cleaned;
  let wasTruncated = false;
  let wasChunked = false;
  let truncationStrategy: string | null = null;

  if (useChunked) {
    text = selectChunkedSections(cleaned, limits);
    wasChunked = true;
    wasTruncated = text.length < fullExtractedCharacters;
    truncationStrategy = "chunked_priority_sections";
  } else if (overPages || overChars) {
    const charBudget = overPages
      ? Math.min(
          limits.maxCharacters,
          Math.floor(limits.maxCharacters * (limits.maxPages / extractedPages)),
        )
      : limits.maxCharacters;
    text = softTruncate(cleaned, charBudget, "priority_sections");
    wasTruncated = true;
    truncationStrategy = overPages
      ? "page_budget_priority_sections"
      : "character_budget_priority_sections";
  }

  const limitNotice =
    wasTruncated || wasChunked ? getPlanLimitNotice() : null;

  return {
    text,
    fullExtractedCharacters,
    analyzedCharacters: text.length,
    extractedPages,
    wasTruncated,
    wasChunked,
    truncationStrategy,
    limitNotice,
  };
}
