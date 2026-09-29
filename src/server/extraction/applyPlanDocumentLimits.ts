/**
 * SERVER ONLY — plan-aware soft limits on extracted document text.
 */

import type { PlanLimits } from "@/lib/plans/planLimits";
import { getPlanLimitNotice } from "@/lib/plans/uploadCopy";
import { sampleEvenWindows } from "@/lib/analysis/sourceCoverage";
import { cleanText } from "./cleanText";

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

function windowsForBudget(maxChars: number): number {
  return Math.min(12, Math.max(4, Math.ceil(maxChars / 8_000)));
}

/**
 * Apply plan page/character limits without rejecting the upload.
 * When the source is over budget, keep equal slices in document order.
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

  if (useChunked || overPages || overChars) {
    const charBudget = overPages
      ? Math.min(
          limits.maxCharacters,
          Math.floor(limits.maxCharacters * (limits.maxPages / extractedPages)),
        )
      : limits.maxCharacters;
    text = sampleEvenWindows(cleaned, charBudget, windowsForBudget(charBudget));
    wasChunked = useChunked;
    wasTruncated = text.length < fullExtractedCharacters;
    truncationStrategy = wasTruncated ? "even_windows" : null;
  }

  const limitNotice = wasTruncated ? getPlanLimitNotice() : null;

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
