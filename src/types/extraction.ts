/** Client-safe extraction API types (no server imports). */

export type ExtractionComplexity = "low" | "medium" | "high";

export type FileExtractionMetadata = {
  sourceKind: "file";
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  estimatedPages: number;
  extractedCharacters: number;
  complexity: ExtractionComplexity;
  structureQuality?: "sparse" | "moderate" | "structured";
  truncated?: boolean;
};

export type PresentationSlideOutlineItem = {
  slideNumber: number;
  title?: string;
  displayLabel: string;
  preview?: string;
};

export type PresentationExtractionMetadata = {
  sourceKind: "presentation";
  fileName: string;
  fileType: "pptx";
  slideCount: number;
  extractedCharacters: number;
  detectedSlideTitles: string[];
  detectedTitleCount: number;
  repeatedThemes: string[];
  estimatedReadingTimeMinutes: number;
  complexity: ExtractionComplexity;
  truncated?: boolean;
  slideOutline: PresentationSlideOutlineItem[];
};

export type UrlExtractionMetadata = {
  sourceKind: "url";
  title: string;
  sourceUrl: string;
  siteName?: string;
  extractedCharacters: number;
  estimatedReadingTimeMinutes: number;
  complexity: ExtractionComplexity;
  truncated?: boolean;
};

export type TranscriptMomentHint = {
  time: string;
  snippet: string;
};

export type YoutubeExtractionMetadata = {
  sourceKind: "youtube";
  title?: string;
  videoId: string;
  sourceUrl: string;
  extractedCharacters: number;
  estimatedDurationMinutes?: number;
  estimatedReadingTimeMinutes: number;
  transcriptSegmentCount?: number;
  importantMoments?: TranscriptMomentHint[];
  hasTimestamps?: boolean;
  complexity: ExtractionComplexity;
  truncated?: boolean;
};

export type ExtractionMetadata =
  | FileExtractionMetadata
  | PresentationExtractionMetadata
  | UrlExtractionMetadata
  | YoutubeExtractionMetadata;

export type ExtractYoutubeDebugMetadata = {
  videoId: string;
  hostConfigured: boolean;
  status?: number;
  responseShape?: string;
  failureReason?: string;
  requestPath?: string;
  queryParams?: Record<string, string>;
  rapidApiError?: string;
};

export type ExtractApiSuccessResponse = {
  success: true;
  extractedText: string;
  metadata: FileExtractionMetadata | PresentationExtractionMetadata;
};

export type ExtractUrlApiSuccessResponse = {
  success: true;
  extractedText: string;
  metadata: UrlExtractionMetadata;
};

export type ExtractYoutubeApiSuccessResponse = {
  success: true;
  extractedText: string;
  metadata: YoutubeExtractionMetadata;
};

export type ExtractApiErrorResponse = {
  success: false;
  error: string;
};

export type ExtractUrlApiErrorResponse = ExtractApiErrorResponse;

export type ExtractYoutubeApiErrorResponse = ExtractApiErrorResponse & {
  debug?: ExtractYoutubeDebugMetadata;
};

export type ExtractApiResponse =
  | ExtractApiSuccessResponse
  | ExtractApiErrorResponse;

export type ExtractUrlApiResponse =
  | ExtractUrlApiSuccessResponse
  | ExtractUrlApiErrorResponse;

export type ExtractYoutubeApiResponse =
  | ExtractYoutubeApiSuccessResponse
  | ExtractYoutubeApiErrorResponse;

export type UploadExtractStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "ready"
  | "failed";

export type WorkspaceInputMode = "file" | "text" | "url" | "youtube";

export function getExtractionSourceLabel(metadata: ExtractionMetadata | null): string {
  if (!metadata) return "";
  if (metadata.sourceKind === "url") return metadata.title;
  if (metadata.sourceKind === "youtube") {
    return metadata.title ?? `YouTube ${metadata.videoId}`;
  }
  if (metadata.sourceKind === "presentation") {
    return metadata.fileName;
  }
  return metadata.fileName;
}
