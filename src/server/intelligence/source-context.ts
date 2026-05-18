/**
 * SERVER ONLY — validated source context for analyze requests.
 */

import type {
  AnalyzeSourceContext,
  PresentationSourceContext,
  TranscriptMomentHint,
  YoutubeSourceContext,
} from "./types";

export type { TranscriptMomentHint, YoutubeSourceContext, PresentationSourceContext };

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function parseYoutubeContextFromObj(obj: Record<string, unknown>): YoutubeSourceContext | undefined {
  if (obj.sourceKind !== "youtube") return undefined;
  if (typeof obj.videoId !== "string" || !VIDEO_ID_PATTERN.test(obj.videoId.trim())) {
    return undefined;
  }

  const ctx: YoutubeSourceContext = {
    sourceKind: "youtube",
    videoId: obj.videoId.trim(),
  };

  if (typeof obj.title === "string" && obj.title.trim()) {
    ctx.title = obj.title.trim().slice(0, 200);
  }

  if (typeof obj.transcriptSegmentCount === "number" && obj.transcriptSegmentCount > 0) {
    ctx.transcriptSegmentCount = Math.floor(obj.transcriptSegmentCount);
  }

  if (typeof obj.estimatedDurationMinutes === "number" && obj.estimatedDurationMinutes > 0) {
    ctx.estimatedDurationMinutes = Math.floor(obj.estimatedDurationMinutes);
  }

  if (obj.hasTimestamps === true) {
    ctx.hasTimestamps = true;
  }

  if (Array.isArray(obj.importantMoments)) {
    const moments: TranscriptMomentHint[] = [];
    for (const item of obj.importantMoments.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const m = item as Record<string, unknown>;
      if (typeof m.time !== "string" || typeof m.snippet !== "string") continue;
      const time = m.time.trim();
      const snippet = m.snippet.trim();
      if (!time || !snippet) continue;
      moments.push({ time: time.slice(0, 16), snippet: snippet.slice(0, 120) });
    }
    if (moments.length > 0) ctx.importantMoments = moments;
  }

  return ctx;
}

function parsePresentationContextFromObj(
  obj: Record<string, unknown>,
): PresentationSourceContext | undefined {
  if (obj.sourceKind !== "presentation") return undefined;
  if (typeof obj.fileName !== "string" || !obj.fileName.trim()) return undefined;
  if (typeof obj.slideCount !== "number" || obj.slideCount < 1) return undefined;

  const detectedSlideTitles = Array.isArray(obj.detectedSlideTitles)
    ? obj.detectedSlideTitles
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 120))
        .slice(0, 40)
    : [];

  const repeatedThemes = Array.isArray(obj.repeatedThemes)
    ? obj.repeatedThemes
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 48))
        .slice(0, 8)
    : [];

  const slideOutline: PresentationSourceContext["slideOutline"] = [];
  if (Array.isArray(obj.slideOutline)) {
    for (const item of obj.slideOutline.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      if (typeof s.slideNumber !== "number" || s.slideNumber < 1) continue;
      slideOutline.push({
        slideNumber: Math.floor(s.slideNumber),
        title:
          typeof s.title === "string" && s.title.trim()
            ? s.title.trim().slice(0, 120)
            : undefined,
      });
    }
  }

  return {
    sourceKind: "presentation",
    fileName: obj.fileName.trim().slice(0, 200),
    slideCount: Math.floor(obj.slideCount),
    detectedSlideTitles,
    repeatedThemes,
    slideOutline,
  };
}

export function parseAnalyzeSourceContext(
  value: unknown,
  sourceHint?: string,
): AnalyzeSourceContext | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;

  if (sourceHint === "youtube" || obj.sourceKind === "youtube") {
    return parseYoutubeContextFromObj(obj);
  }

  if (sourceHint === "presentation" || obj.sourceKind === "presentation") {
    return parsePresentationContextFromObj(obj);
  }

  return undefined;
}
