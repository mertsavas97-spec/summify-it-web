import type { PodcastToneProfile } from "@/lib/podcast/podcast-types";

/** Auto-detect podcast conversation tone from document type guess. */
export function resolvePodcastTone(documentTypeGuess?: string | null): PodcastToneProfile {
  const doc = (documentTypeGuess ?? "").toLowerCase();

  if (doc.includes("academic_paper") || doc.includes("research")) return "academic";
  if (doc.includes("article") || doc.includes("news") || doc.includes("blog")) return "casual";
  if (doc.includes("narrative") || doc.includes("biography")) return "storytelling";
  if (doc.includes("business_report") || doc.includes("marketing_deck")) return "executive";

  return "casual";
}

