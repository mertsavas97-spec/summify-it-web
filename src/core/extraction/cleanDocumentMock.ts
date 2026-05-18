import type { CleanedDocument, ExtractedDocument } from "@/core/types";

/**
 * Mock normalization: whitespace collapse, header/footer removal, etc.
 */
export function cleanDocumentMock(
  extracted: ExtractedDocument,
): CleanedDocument {
  const text = extracted.rawText
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    documentId: extracted.documentId,
    text,
    wordCount,
    cleanedAt: new Date().toISOString(),
    removedNoiseRatio: 0.08,
  };
}
