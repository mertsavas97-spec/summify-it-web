/**
 * Server-only extraction defaults (per-plan limits live in @/lib/plans/planLimits).
 */

import { PLAN_LIMITS } from "@/lib/plans/planLimits";

export const EXTRACTION_CONFIG = {
  /** Fallback upload cap when plan is unknown (bytes) */
  maxFileSizeBytes: PLAN_LIMITS.free.maxUploadMb * 1024 * 1024,
  /** Legacy default — use applyPlanDocumentLimits per request */
  maxExtractedChars: PLAN_LIMITS.free.maxCharacters,
  /** Minimum useful text for analysis pipeline */
  minExtractedChars: 100,
  /** Per-file extraction timeout */
  timeoutMs: 30_000,
  /** ~3000 chars per page heuristic for PDF/DOCX */
  charsPerPageEstimate: 3_000,
  supportedExtensions: ["pdf", "docx", "txt", "pptx"] as const,
  /** URL fetch timeout */
  urlTimeoutMs: 20_000,
  /** Max HTML download size (bytes) */
  urlMaxHtmlBytes: 2 * 1024 * 1024,
  /** Max redirects when fetching a URL */
  urlMaxRedirects: 5,
  /** YouTube transcript API timeout */
  youtubeTimeoutMs: 25_000,
  /** Max transcript characters (same cap as analysis input) */
  youtubeMaxTranscriptChars: PLAN_LIMITS.pro.maxCharacters,
} as const;

export type SupportedExtractExtension =
  (typeof EXTRACTION_CONFIG.supportedExtensions)[number];
