import type { DocumentProfile, KnowledgeLayer } from "@/core/types";

/**
 * Mock compressed knowledge layer — replaces embedding + chunk summarization.
 */
export function createKnowledgeLayerMock(
  profile: DocumentProfile,
  cleanedText: string,
): KnowledgeLayer {
  const sentences = cleanedText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 5);

  return {
    documentId: profile.documentId,
    compressedFacts: sentences.length > 0 ? sentences : ["Document processed (mock)."],
    entities: [profile.domain, ...profile.topics],
    sectionMap: [
      {
        title: "Primary content",
        summary: sentences[0] ?? "No extractable sections in mock.",
      },
    ],
    tokenEstimate: Math.ceil(cleanedText.length / 4),
    createdAt: new Date().toISOString(),
  };
}
