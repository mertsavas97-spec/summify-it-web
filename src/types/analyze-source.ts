/** Client-safe analyze source context (mirrors server intelligence types). */

export type TranscriptMomentHint = {
  time: string;
  snippet: string;
};

export type YoutubeAnalyzeSourceContext = {
  sourceKind: "youtube";
  videoId: string;
  title?: string;
  transcriptSegmentCount?: number;
  estimatedDurationMinutes?: number;
  importantMoments?: TranscriptMomentHint[];
  hasTimestamps?: boolean;
};

export type PresentationSlideOutlineHint = {
  slideNumber: number;
  title?: string;
};

export type PresentationAnalyzeSourceContext = {
  sourceKind: "presentation";
  fileName: string;
  slideCount: number;
  detectedSlideTitles: string[];
  repeatedThemes: string[];
  slideOutline: PresentationSlideOutlineHint[];
};

export type FileAnalyzeSourceContext = {
  sourceKind: "file";
  fileName?: string;
  fileType?: string | null;
};

export type UrlAnalyzeSourceContext = {
  sourceKind: "url";
  url?: string;
  title?: string;
};

export type TextAnalyzeSourceContext = {
  sourceKind: "text";
  label?: string;
};

export type AnalyzeSourceContext =
  | YoutubeAnalyzeSourceContext
  | PresentationAnalyzeSourceContext
  | FileAnalyzeSourceContext
  | UrlAnalyzeSourceContext
  | TextAnalyzeSourceContext;

import type {
  PresentationExtractionMetadata,
  YoutubeExtractionMetadata,
} from "@/types/extraction";

export function buildYoutubeSourceContext(
  metadata: YoutubeExtractionMetadata,
): YoutubeAnalyzeSourceContext {
  return {
    sourceKind: "youtube",
    videoId: metadata.videoId,
    title: metadata.title,
    transcriptSegmentCount: metadata.transcriptSegmentCount,
    estimatedDurationMinutes: metadata.estimatedDurationMinutes,
    importantMoments: metadata.importantMoments,
    hasTimestamps: metadata.hasTimestamps,
  };
}

export function buildPresentationSourceContext(
  metadata: PresentationExtractionMetadata,
): PresentationAnalyzeSourceContext {
  return {
    sourceKind: "presentation",
    fileName: metadata.fileName,
    slideCount: metadata.slideCount,
    detectedSlideTitles: metadata.detectedSlideTitles,
    repeatedThemes: metadata.repeatedThemes,
    slideOutline: metadata.slideOutline.map((s) => ({
      slideNumber: s.slideNumber,
      title: s.title,
    })),
  };
}
