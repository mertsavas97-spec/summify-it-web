export type PodcastSourceProfile = {
  sourceKind?: "pasted-text" | "file" | "presentation" | "url" | "youtube" | null;
  estimatedPages?: number | null;
  extractedCharacterCount?: number | null;
  youtubeDurationMinutes?: number | null;
  transcriptCharacterCount?: number | null;
  meaningfulAnalysisCandidateCount?: number | null;
};

/**
 * Podcast suitability tier — determines how the podcast should be structured.
 * - unsuitable: source too short, recommend Audio Study instead
 * - short: quick discussion (3-6 min)
 * - standard: normal discussion (6-12 min)
 * - deep-dive: extended discussion (12-20 min)
 * - chaptered: very long source, may need chapter breaks
 */
export type PodcastSuitabilityTier =
  | "unsuitable"
  | "short"
  | "standard"
  | "deep-dive"
  | "chaptered";

export type PodcastEligibility = {
  eligible: boolean;
  reason: string;
  recommendedMode: "audio-study" | "podcast";
  suitability?: PodcastSuitabilityTier;
  suggestedDensity?: "quick" | "standard" | "deep-dive";
};

const NOT_ELIGIBLE_REASON =
  "Podcast Mode works best with longer sources. This one is better suited for a quick audio lesson.";

function atLeast(value: number | null | undefined, threshold: number): boolean {
  return typeof value === "number" && value >= threshold;
}

function isMeasuredShortSource(sourceProfile: PodcastSourceProfile): boolean {
  const shortExtractedText =
    typeof sourceProfile.extractedCharacterCount === "number" &&
    sourceProfile.extractedCharacterCount < 3000;

  if (sourceProfile.sourceKind === "youtube") {
    const shortTranscript =
      typeof sourceProfile.transcriptCharacterCount === "number" &&
      sourceProfile.transcriptCharacterCount < 3000;
    const shortDuration =
      typeof sourceProfile.youtubeDurationMinutes === "number" &&
      sourceProfile.youtubeDurationMinutes < 8;

    return shortTranscript && shortDuration;
  }

  if (sourceProfile.sourceKind === "file") {
    const shortPageEstimate =
      typeof sourceProfile.estimatedPages === "number" &&
      sourceProfile.estimatedPages < 4;

    return shortExtractedText && shortPageEstimate;
  }

  return shortExtractedText;
}

/**
 * Compute a source size score for podcast suitability.
 * Higher = more content available for discussion.
 */
function computeSourceSizeScore(profile: PodcastSourceProfile): number {
  let score = 0;

  // Page-based scoring
  if (typeof profile.estimatedPages === "number" && profile.estimatedPages > 0) {
    score += Math.min(profile.estimatedPages * 1200, 30000);
  }

  // Character-based scoring
  if (typeof profile.extractedCharacterCount === "number" && profile.extractedCharacterCount > 0) {
    score = Math.max(score, profile.extractedCharacterCount);
  }

  // YouTube scoring
  if (profile.sourceKind === "youtube") {
    if (typeof profile.youtubeDurationMinutes === "number" && profile.youtubeDurationMinutes > 0) {
      score = Math.max(score, profile.youtubeDurationMinutes * 400);
    }
    if (typeof profile.transcriptCharacterCount === "number" && profile.transcriptCharacterCount > 0) {
      score = Math.max(score, profile.transcriptCharacterCount);
    }
  }

  // Analysis breadth bonus
  if (typeof profile.meaningfulAnalysisCandidateCount === "number" && profile.meaningfulAnalysisCandidateCount > 0) {
    score += profile.meaningfulAnalysisCandidateCount * 500;
  }

  return score;
}

/**
 * Determine podcast suitability tier based on source profile.
 */
export function resolvePodcastSuitability(
  sourceProfile: PodcastSourceProfile,
): PodcastSuitabilityTier {
  if (isMeasuredShortSource(sourceProfile)) {
    return "unsuitable";
  }

  const score = computeSourceSizeScore(sourceProfile);

  if (score < 3000) {
    return "unsuitable";
  }
  if (score < 8000) {
    return "short";
  }
  if (score < 20000) {
    return "standard";
  }
  if (score < 50000) {
    return "deep-dive";
  }
  return "chaptered";
}

/**
 * Suggest podcast density based on source size.
 */
export function suggestPodcastDensity(
  suitability: PodcastSuitabilityTier,
): "quick" | "standard" | "deep-dive" {
  switch (suitability) {
    case "short":
      return "quick";
    case "standard":
      return "standard";
    case "deep-dive":
    case "chaptered":
      return "deep-dive";
    case "unsuitable":
    default:
      return "standard";
  }
}

export function resolvePodcastEligibility(
  sourceProfile: PodcastSourceProfile,
): PodcastEligibility {
  const suitability = resolvePodcastSuitability(sourceProfile);
  const suggestedDensity = suggestPodcastDensity(suitability);

  if (suitability === "unsuitable") {
    // Fallback to analysis breadth before giving up
    if (atLeast(sourceProfile.meaningfulAnalysisCandidateCount, 5)) {
      return {
        eligible: true,
        reason: "The analysis has enough learn candidates for deeper discussion.",
        recommendedMode: "podcast",
        suitability: "standard",
        suggestedDensity: "standard",
      };
    }
    return {
      eligible: false,
      reason: NOT_ELIGIBLE_REASON,
      recommendedMode: "audio-study",
      suitability: "unsuitable",
      suggestedDensity: "quick",
    };
  }

  switch (suitability) {
    case "short":
      return {
        eligible: true,
        reason: "This source supports a quick podcast discussion (3–6 min).",
        recommendedMode: "podcast",
        suitability,
        suggestedDensity,
      };

    case "standard": {
      // Provide specific reasoning based on what made it eligible
      if (atLeast(sourceProfile.estimatedPages, 4)) {
        return {
          eligible: true,
          reason: "Longer documents give Podcast Mode room for deeper discussion.",
          recommendedMode: "podcast",
          suitability,
          suggestedDensity,
        };
      }
      if (atLeast(sourceProfile.extractedCharacterCount, 3000)) {
        return {
          eligible: true,
          reason: "This source has enough extracted text for a guided conversation.",
          recommendedMode: "podcast",
          suitability,
          suggestedDensity,
        };
      }
      if (atLeast(sourceProfile.youtubeDurationMinutes, 8)) {
        return {
          eligible: true,
          reason: "Longer videos are ready for a two-speaker study conversation.",
          recommendedMode: "podcast",
          suitability,
          suggestedDensity,
        };
      }
      if (atLeast(sourceProfile.transcriptCharacterCount, 3000)) {
        return {
          eligible: true,
          reason: "This transcript is long enough for a podcast discussion.",
          recommendedMode: "podcast",
          suitability,
          suggestedDensity,
        };
      }
      return {
        eligible: true,
        reason: "This source is ready for a podcast discussion.",
        recommendedMode: "podcast",
        suitability,
        suggestedDensity,
      };
    }

    case "deep-dive":
      return {
        eligible: true,
        reason: "This source has enough depth for an extended podcast discussion (12–20 min).",
        recommendedMode: "podcast",
        suitability,
        suggestedDensity,
      };

    case "chaptered":
      return {
        eligible: true,
        reason: "This extensive source is ideal for a deep-dive podcast discussion.",
        recommendedMode: "podcast",
        suitability,
        suggestedDensity,
      };

    default:
      return {
        eligible: false,
        reason: NOT_ELIGIBLE_REASON,
        recommendedMode: "audio-study",
        suitability: "unsuitable",
        suggestedDensity: "quick",
      };
  }
}