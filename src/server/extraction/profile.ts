import { EXTRACTION_CONFIG } from "./config";

export type ExtractionComplexity = "low" | "medium" | "high";

export type ExtractionProfile = {
  complexity: ExtractionComplexity;
  estimatedPages: number;
  paragraphCount: number;
  headingCount: number;
  sentenceCount: number;
  structureQuality: "sparse" | "moderate" | "structured";
};

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

/**
 * Lightweight heuristics for adaptive pipeline routing (future phases).
 */
export function profileExtractedText(text: string): ExtractionProfile {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  const headingCount =
    countMatches(text, /^#{1,6}\s/m) +
    countMatches(text, /^[A-Z][A-Za-z0-9\s\-–—]{2,60}$/gm);

  const sentenceCount = Math.max(
    1,
    countMatches(text, /[.!?]+(?:\s|$)/g),
  );

  const chars = text.length;
  const estimatedPages = Math.max(
    1,
    Math.ceil(chars / EXTRACTION_CONFIG.charsPerPageEstimate),
  );

  const avgSentenceLength = chars / sentenceCount;
  const sentenceDensity = sentenceCount / Math.max(1, estimatedPages);

  let complexity: ExtractionComplexity = "low";
  if (chars > 12_000 || paragraphCount > 40 || headingCount > 15) {
    complexity = "high";
  } else if (chars > 4_000 || paragraphCount > 12 || headingCount > 5) {
    complexity = "medium";
  }

  let structureQuality: ExtractionProfile["structureQuality"] = "sparse";
  if (headingCount >= 3 && paragraphCount >= 5) {
    structureQuality = "structured";
  } else if (paragraphCount >= 3 || headingCount >= 1) {
    structureQuality = "moderate";
  }

  // Very long average sentences may indicate poor extraction
  if (avgSentenceLength > 400 && structureQuality === "structured") {
    structureQuality = "moderate";
  }

  if (sentenceDensity > 25 && complexity === "low") {
    complexity = "medium";
  }

  return {
    complexity,
    estimatedPages,
    paragraphCount,
    headingCount,
    sentenceCount,
    structureQuality,
  };
}
