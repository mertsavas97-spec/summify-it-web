import type { DocumentInput, ExtractedDocument } from "@/core/types";

const MOCK_BODY = `Section 3.2 — Market Expansion Strategy

The proposed expansion into EMEA markets requires coordinated investment across sales, localization, and compliance. Initial projections suggest a 14-month payback period under base-case assumptions.

Key dependencies include regulatory approval in two jurisdictions and hiring of regional leadership by Q3.`;

/**
 * Mock text extraction. Replace with PDF/DOCX parsers + OCR pipeline.
 */
export function extractDocumentMock(input: DocumentInput): ExtractedDocument {
  const pageEstimate = Math.max(1, Math.round(input.sizeBytes / 50_000));

  return {
    documentId: input.id,
    rawText: MOCK_BODY,
    pageCount: pageEstimate,
    extractedAt: new Date().toISOString(),
    metadata: {
      source: "mock",
      fileName: input.fileName,
      documentType: input.documentType,
    },
  };
}
