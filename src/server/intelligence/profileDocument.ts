import type { TextAnalysisMode } from "@/server/ai/schemas";
import {
  classifyDocumentType,
  suggestModeForDocumentType,
} from "./documentTypes";
import type {
  ComplexityLevel,
  DocumentProfile,
  StructureQualityLevel,
  SourceQualityFlag,
} from "./types";

const LEGAL_KEYWORDS = ["agreement", "contract", "clause", "shall", "indemnify"];
const ACADEMIC_KEYWORDS = ["abstract", "methodology", "hypothesis", "citation"];
const BUSINESS_KEYWORDS = ["revenue", "strategy", "quarter", "roadmap", "kpi"];
const DECK_KEYWORDS = ["slide", "deck", "agenda slide"];
const MEETING_KEYWORDS = ["meeting", "minutes", "action item", "attendees"];

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
}

function detectHeadings(text: string): string[] {
  const markdown = text.match(/^#{1,6}\s+.+$/gm) ?? [];
  const caps = text.match(/^[A-Z][A-Za-z0-9\s\-–—:]{2,72}$/gm) ?? [];
  return [...markdown, ...caps].map((h) => h.trim()).slice(0, 20);
}

function inferComplexity(
  chars: number,
  paragraphCount: number,
  headingCount: number,
): ComplexityLevel {
  if (chars > 12_000 || paragraphCount > 40 || headingCount > 15) return "high";
  if (chars > 4_000 || paragraphCount > 12 || headingCount > 5) return "medium";
  return "low";
}

function inferStructureQuality(
  headingCount: number,
  paragraphCount: number,
  avgSentenceLength: number,
): StructureQualityLevel {
  if (headingCount >= 3 && paragraphCount >= 5) return "strong";
  if (paragraphCount >= 3 || headingCount >= 1) {
    if (avgSentenceLength > 400) return "medium";
    return "medium";
  }
  return "weak";
}

function inferSourceQuality(
  chars: number,
  paragraphCount: number,
  structureQuality: StructureQualityLevel,
): SourceQualityFlag {
  if (structureQuality === "weak" && chars < 3_500) return "fragmented";
  if (chars < 1_500 || (paragraphCount < 3 && chars < 3_000)) return "thin";
  return "ok";
}

export type ProfileDocumentOptions = {
  isWebArticle?: boolean;
  isYoutubeTranscript?: boolean;
  isPresentation?: boolean;
  slideTitles?: string[];
};

/**
 * Lightweight document profile from cleaned extracted text (no AI).
 */
export function profileDocument(
  cleanedText: string,
  selectedMode: TextAnalysisMode,
  options?: ProfileDocumentOptions,
): DocumentProfile {
  const text = cleanedText.trim();
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 20);
  const paragraphCount = Math.max(1, paragraphs.length);
  const headingCount = detectHeadings(text).length;
  const sentenceCount = Math.max(1, countMatches(text, /[.!?]+(?:\s|$)/g));
  const chars = text.length;
  const avgSentenceLength = chars / sentenceCount;

  const documentTypeGuess = classifyDocumentType(text, {
    isWebArticle: options?.isWebArticle,
    isYoutubeTranscript: options?.isYoutubeTranscript,
    isPresentation: options?.isPresentation,
    slideTitles: options?.slideTitles,
  });
  const complexity = inferComplexity(chars, paragraphCount, headingCount);
  const structureQuality = inferStructureQuality(
    headingCount,
    paragraphCount,
    avgSentenceLength,
  );
  const sourceQuality = inferSourceQuality(chars, paragraphCount, structureQuality);

  const words = Math.max(1, chars / 5);
  const estimatedReadingTimeMinutes = Math.max(1, Math.round(words / 200));

  const detectedSignals: string[] = [];
  if (headingCount > 0) detectedSignals.push(`${headingCount} headings`);
  if (scoreKeywords(text, LEGAL_KEYWORDS) >= 2) detectedSignals.push("legal terms");
  if (scoreKeywords(text, ACADEMIC_KEYWORDS) >= 2) detectedSignals.push("academic terms");
  if (scoreKeywords(text, BUSINESS_KEYWORDS) >= 2) detectedSignals.push("business terms");
  if (scoreKeywords(text, DECK_KEYWORDS) >= 2) detectedSignals.push("deck-like language");
  if (scoreKeywords(text, MEETING_KEYWORDS) >= 2) detectedSignals.push("meeting language");
  if (countMatches(text, /(?:table of contents|contents)\s*\n/i) > 0) {
    detectedSignals.push("toc pattern");
  }
  if (sourceQuality !== "ok") detectedSignals.push(`${sourceQuality} source`);
  if (options?.isYoutubeTranscript) detectedSignals.push("spoken transcript");
  if (options?.isPresentation) detectedSignals.push("slide deck");

  const suggestedMode = suggestModeForDocumentType(documentTypeGuess, selectedMode);
  const needsChunking = chars > 12_000 || (complexity === "high" && chars > 8_000);

  let sourceQualityNote: string | undefined;
  if (options?.isYoutubeTranscript) {
    sourceQualityNote =
      "Spoken transcript — may include filler, repetition, or missing punctuation.";
  } else if (options?.isPresentation) {
    sourceQualityNote =
      "Slide deck — text is fragmented across slides; infer narrative from slide order.";
  } else if (sourceQuality === "thin") {
    sourceQualityNote =
      "Source text is short — analysis may have limited grounding.";
  } else if (sourceQuality === "fragmented") {
    sourceQualityNote =
      "Source text looks fragmented or low-structure — verify insights against the original.";
  }

  return {
    documentTypeGuess,
    complexity,
    structureQuality,
    estimatedReadingTimeMinutes,
    detectedSignals: detectedSignals.slice(0, 6),
    suggestedMode,
    needsChunking,
    sourceQuality,
    sourceQualityNote,
  };
}
