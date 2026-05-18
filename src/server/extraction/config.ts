/**
 * Server-only extraction limits.
 * Keep aligned with src/server/ai/config.ts input.maxChars for analysis.
 */

export const EXTRACTION_CONFIG = {
  /** Max upload size (bytes) — 10 MB */
  maxFileSizeBytes: 10 * 1024 * 1024,
  /** Max characters passed to analysis after cleaning */
  maxExtractedChars: 24_000,
  /** Minimum useful text for analysis pipeline */
  minExtractedChars: 100,
  /** Per-file extraction timeout */
  timeoutMs: 30_000,
  /** ~3000 chars per page heuristic for PDF/DOCX */
  charsPerPageEstimate: 3_000,
  supportedExtensions: ["pdf", "docx", "txt"] as const,
  /** URL fetch timeout */
  urlTimeoutMs: 20_000,
  /** Max HTML download size (bytes) */
  urlMaxHtmlBytes: 2 * 1024 * 1024,
  /** Max redirects when fetching a URL */
  urlMaxRedirects: 5,
  /** YouTube transcript API timeout */
  youtubeTimeoutMs: 25_000,
  /** Max transcript characters (same cap as analysis input) */
  youtubeMaxTranscriptChars: 24_000,
} as const;

export type SupportedExtractExtension =
  (typeof EXTRACTION_CONFIG.supportedExtensions)[number];
