import type { CleanedDocument, DocumentProfile } from "@/core/types";

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  strategy: ["market", "expansion", "investment", "rollout"],
  legal: ["contract", "clause", "obligation", "jurisdiction"],
  research: ["methodology", "hypothesis", "citation", "study"],
};

function inferDomain(text: string): string {
  const lower = text.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return domain;
  }
  return "general";
}

function inferComplexity(wordCount: number): DocumentProfile["complexity"] {
  if (wordCount < 500) return "low";
  if (wordCount < 3000) return "medium";
  return "high";
}

/**
 * Mock document profiling for persona routing and knowledge compression.
 */
export function profileDocumentMock(
  cleaned: CleanedDocument,
  documentType: DocumentProfile["documentType"],
): DocumentProfile {
  const domain = inferDomain(cleaned.text);
  const complexity = inferComplexity(cleaned.wordCount);

  return {
    documentId: cleaned.documentId,
    documentType,
    domain,
    complexity,
    estimatedReadingMinutes: Math.ceil(cleaned.wordCount / 200),
    topics: [domain, documentType, complexity],
    profiledAt: new Date().toISOString(),
  };
}
