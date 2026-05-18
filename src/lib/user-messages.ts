/**
 * Shared user-facing copy (client-safe). Keep non-technical and production-safe.
 */

export const USER_MESSAGES = {
  network:
    "We couldn't reach the server. Check your connection and try again.",
  analyzeUnavailable:
    "Analysis is temporarily unavailable. Please try again in a few minutes.",
  analyzeFailed:
    "We couldn't finish analyzing this content. Please try again shortly.",
  analyzeInputEmpty: "Please enter some text to analyze.",
  analyzeInputTooShort: (min: number) =>
    `Please add at least ${min} characters before running analysis.`,
  analyzeInputTooLong: (max: string) =>
    `This text is too long. Shorten it to under ${max} characters.`,
  analyzeModeRequired: "Choose an intelligence mode before analyzing.",
  analyzeModeUnknown:
    "That intelligence mode isn't recognized. Pick an active mode from the lens selector.",
  analyzeModeLocked: (label: string) =>
    `"${label}" is part of Pro Intelligence and isn't available yet. Choose an active mode to run analysis.`,
  analyzeModeComingSoon: (label: string) =>
    `"${label}" is coming soon. Choose an active mode to run analysis.`,
  extractFileMissing: "Please choose a file to upload.",
  extractFileTooLarge: (maxMb: number) =>
    `This file is too large. Maximum size is ${maxMb} MB.`,
  extractUnsupported:
    "This file type isn't supported. Upload PDF, DOCX, TXT, or PPTX.",
  extractFailed:
    "We couldn't extract text from this file. Try another file or paste the text directly.",
  extractTimeout:
    "Extraction took too long. Try a smaller file or paste the text directly.",
  extractTooShort: (min: number) =>
    `Not enough readable text was found (minimum ${min} characters).`,
  extractGeneric: "Extraction failed. Try another source or paste the text directly.",
  urlRequired: "Please enter an article URL.",
  urlInvalid: "Please enter a valid web address (http or https).",
  urlBlocked: "This link can't be analyzed. Try a public article URL.",
  urlFetchFailed: "We couldn't load this page. Check the link or paste the article text.",
  urlTooShort:
    "The article doesn't have enough text to analyze. Try a longer page or paste the text.",
  urlExtractFailed:
    "We couldn't extract this article. Try another URL or paste the text directly.",
  youtubeTranscriptMissing:
    "No usable transcript was found. Try a video with captions enabled.",
  youtubeTranscriptShort:
    "The transcript is too short to analyze. Try a longer video with captions.",
  youtubeExtractFailed:
    "We couldn't fetch a transcript for this video. Check the link or try another video.",
  unexpected: "Something went wrong. Please try again.",
} as const;
