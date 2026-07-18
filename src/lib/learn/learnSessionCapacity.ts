import type { DocumentProfileMetadata } from "@/types/intelligence";

/** Product limit: at most three Learn session versions per analysis. */
export const MAX_LEARN_SESSION_VERSIONS = 3;

export type LearnSessionCapacity = {
  maxVersions: number;
  reason: string | null;
  characterCount: number;
  learnCardCount: number;
};

type AssessInput = {
  extractedCharacters?: number | null;
  estimatedPages?: number | null;
  slideCount?: number | null;
  sourceQuality?: DocumentProfileMetadata["sourceQuality"] | null;
  sourceQualityNote?: string | null;
  learnCardCount: number;
};

/**
 * How many distinct Learn session versions this source can meaningfully support.
 * Short / thin sources stay at 1; medium sources up to 2; rich sources up to 3.
 */
export function assessLearnSessionCapacity(input: AssessInput): LearnSessionCapacity {
  const characterCount = Math.max(0, input.extractedCharacters ?? 0);
  const learnCardCount = Math.max(0, input.learnCardCount);
  const pages = input.estimatedPages ?? null;
  const slides = input.slideCount ?? null;
  const quality = input.sourceQuality ?? "ok";

  let maxVersions = MAX_LEARN_SESSION_VERSIONS;
  let reason: string | null = null;

  const tooThin =
    quality === "thin" ||
    quality === "fragmented" ||
    characterCount > 0 && characterCount < 1500 ||
    learnCardCount > 0 && learnCardCount < 4 ||
    (pages != null && pages > 0 && pages <= 2) ||
    (slides != null && slides > 0 && slides <= 4);

  const mediumOnly =
    characterCount > 0 && characterCount < 4000 ||
    learnCardCount > 0 && learnCardCount < 6 ||
    (pages != null && pages > 2 && pages <= 6) ||
    (slides != null && slides > 4 && slides <= 10);

  if (tooThin) {
    maxVersions = 1;
    reason =
      input.sourceQualityNote?.trim() ||
      "This source is short or light on detail, so Summify keeps one Learn session. Add a longer document to unlock Learn 2–3.";
  } else if (mediumOnly) {
    maxVersions = 2;
    reason =
      "This source supports up to two Learn versions. A longer document can unlock a third pass.";
  }

  maxVersions = Math.min(MAX_LEARN_SESSION_VERSIONS, Math.max(1, maxVersions));

  return {
    maxVersions,
    reason: maxVersions < MAX_LEARN_SESSION_VERSIONS ? reason : null,
    characterCount,
    learnCardCount,
  };
}

export function canCreateLearnVersion(
  capacity: LearnSessionCapacity,
  currentVersionCount: number,
): boolean {
  return currentVersionCount < capacity.maxVersions;
}
