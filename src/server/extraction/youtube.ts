/**
 * SERVER ONLY — YouTube transcript extraction via RapidAPI (youtube-transcript3).
 * No video/audio download; transcript API only.
 */

import { getPlanLimits, type PlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";
import { EXTRACTION_CONFIG } from "./config";
import { applyPlanDocumentLimits } from "./applyPlanDocumentLimits";
import { cleanText } from "./cleanText";
import { profileExtractedText } from "./profile";
import { ExtractionError } from "./errors";

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/** Default for youtube-transcript3 on RapidAPI (GET ?videoId=). */
const DEFAULT_RAPIDAPI_PATH = "/api/transcript";

const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

export type YoutubeExtractionDebug = {
  videoId: string;
  hostConfigured: boolean;
  status?: number;
  responseShape?: string;
  failureReason?: string;
  requestPath?: string;
  queryParams?: Record<string, string>;
  rapidApiError?: string;
};

export type TranscriptMomentHint = {
  time: string;
  snippet: string;
};

export type YoutubeExtractionMetadata = {
  title?: string;
  videoId: string;
  sourceUrl: string;
  extractedText: string;
  extractedCharacters: number;
  estimatedDurationMinutes?: number;
  transcriptSegmentCount?: number;
  importantMoments?: TranscriptMomentHint[];
  hasTimestamps?: boolean;
  sourceType: "youtube";
};

export type YoutubeExtractionResult = {
  extractedText: string;
  metadata: Omit<YoutubeExtractionMetadata, "extractedText"> & {
    extractedCharacters: number;
    estimatedReadingTimeMinutes: number;
    complexity: "low" | "medium" | "high";
    truncated: boolean;
    wasChunked?: boolean;
    truncationStrategy?: string | null;
    limitNotice?: string | null;
  };
};

type TranscriptSegment = {
  text: string;
  startSeconds?: number;
};

type RapidApiConfig = {
  apiKey: string;
  host: string;
  path: string;
};

type RapidApiAttempt = {
  method: "GET" | "POST";
  path: string;
  queryParams: Record<string, string>;
  body?: Record<string, string>;
};

type RapidApiAttemptResult = {
  method: "GET" | "POST";
  requestUrl: string;
  path: string;
  queryParams: Record<string, string>;
  status: number;
  contentType: string;
  bodyPreview: string;
  payload: unknown;
  responseShape: string;
  apiError?: string;
  segmentCount: number;
};

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function safeBodyPreview(bodyText: string, max = 1000): string {
  return bodyText.slice(0, max).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function validateVideoId(id: string | null | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  return VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Parse a YouTube URL or bare 11-character video ID.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = validateVideoId(trimmed);
  if (direct) return direct;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    return null;
  }

  const normalizedHost = host.replace(/^www\./, "");
  if (!ALLOWED_YOUTUBE_HOSTS.has(host) && !ALLOWED_YOUTUBE_HOSTS.has(normalizedHost)) {
    return null;
  }

  if (normalizedHost === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return validateVideoId(id);
  }

  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (url.pathname === "/watch" || url.pathname.startsWith("/watch/")) {
      return validateVideoId(url.searchParams.get("v"));
    }
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
    if (shortsMatch) return validateVideoId(shortsMatch[1]);
    const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
    if (embedMatch) return validateVideoId(embedMatch[1]);
    const liveMatch = url.pathname.match(/^\/live\/([^/]+)/);
    if (liveMatch) return validateVideoId(liveMatch[1]);
  }

  return null;
}

export function assertValidYouTubeInput(input: string): {
  videoId: string;
  canonicalUrl: string;
} {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) {
    throw new ExtractionError(
      "Invalid YouTube URL. Use a watch link (youtube.com/watch?v=…), youtu.be/…, or Shorts URL.",
      400,
    );
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function getRapidApiConfig(): RapidApiConfig {
  const apiKey = process.env.RAPIDAPI_KEY?.trim();
  const host = process.env.RAPIDAPI_HOST?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!apiKey || !host) {
    throw new ExtractionError(
      "YouTube extraction is not configured. Set RAPIDAPI_KEY and RAPIDAPI_HOST on the server.",
      503,
    );
  }

  const path = process.env.RAPIDAPI_YOUTUBE_PATH?.trim() || DEFAULT_RAPIDAPI_PATH;
  return { apiKey, host, path: path.startsWith("/") ? path : `/${path}` };
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function segmentStartSeconds(segment: Record<string, unknown>): number | undefined {
  const candidates = [
    segment.start,
    segment.offset,
    segment.startTime,
    segment.start_time,
    segment.start_time_sec,
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function segmentText(segment: Record<string, unknown>): string {
  const raw =
    segment.text ??
    segment.caption ??
    segment.subtitle ??
    segment.content ??
    segment.transcript ??
    segment.line;
  if (typeof raw !== "string") return "";
  return decodeHtmlEntities(raw.trim());
}

function normalizeSegments(value: unknown): TranscriptSegment[] {
  if (!value) return [];

  if (typeof value === "string" && value.trim()) {
    return [{ text: decodeHtmlEntities(value.trim()) }];
  }

  if (!Array.isArray(value)) return [];

  const segments: TranscriptSegment[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      segments.push({ text: decodeHtmlEntities(item.trim()) });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const text = segmentText(record);
    if (!text) continue;
    segments.push({
      text,
      startSeconds: segmentStartSeconds(record),
    });
  }
  return segments;
}

function collectNestedArrays(obj: Record<string, unknown>, depth = 0): unknown[] {
  if (depth > 3) return [];
  const arrays: unknown[] = [];
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) arrays.push(value);
    else if (value && typeof value === "object") {
      arrays.push(...collectNestedArrays(value as Record<string, unknown>, depth + 1));
    }
  }
  return arrays;
}

/**
 * Detect response shape for logging and debug metadata.
 */
export function detectResponseShape(data: unknown, bodyText: string): string {
  if (!bodyText.trim()) return "empty_body";
  if (data === null || data === undefined) {
    return bodyText.trim().startsWith("{") ? "non_json_or_parse_failed" : "plain_text";
  }
  if (Array.isArray(data)) return `array_root:${data.length}`;
  if (typeof data !== "object") return `primitive:${typeof data}`;

  const obj = data as Record<string, unknown>;
  if (obj.success === false) return "success_false";
  if (obj.success === true && Array.isArray(obj.transcript)) {
    return `success_true_transcript:${obj.transcript.length}`;
  }
  if (Array.isArray(obj.transcript)) return `transcript_array:${obj.transcript.length}`;
  if (Array.isArray(obj.transcripts)) return `transcripts_array:${obj.transcripts.length}`;
  if (Array.isArray(obj.captions)) return `captions_array:${obj.captions.length}`;
  if (Array.isArray(obj.data)) return `data_array:${obj.data.length}`;
  if (Array.isArray(obj.segments)) return `segments_array:${obj.segments.length}`;
  if (typeof obj.cleanedTranscript === "string") return "cleaned_transcript_string";
  if (typeof obj.text === "string") return "text_string";
  if (typeof obj.rawTranscript === "string") return "raw_transcript_string";
  if (typeof obj.error === "string") return "error_field";
  return `object_keys:${Object.keys(obj).slice(0, 8).join(",")}`;
}

function extractApiErrorMessage(obj: Record<string, unknown>): string | undefined {
  const candidates = [obj.error, obj.message, obj.detail];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Parse transcript segments from a RapidAPI payload without throwing.
 */
export function parseTranscriptPayload(data: unknown): {
  segments: TranscriptSegment[];
  responseShape: string;
  apiError?: string;
} {
  const shape = detectResponseShape(data, "");

  if (!data) {
    return { segments: [], responseShape: shape };
  }

  if (Array.isArray(data)) {
    const segments = normalizeSegments(data);
    return {
      segments,
      responseShape: segments.length > 0 ? shape : "array_root_empty",
    };
  }

  if (typeof data !== "object") {
    return { segments: normalizeSegments(data), responseShape: shape };
  }

  const obj = data as Record<string, unknown>;

  if (obj.success === false) {
    return {
      segments: [],
      responseShape: "success_false",
      apiError: extractApiErrorMessage(obj),
    };
  }

  const directCandidates = [
    obj.transcript,
    obj.transcripts,
    obj.captions,
    obj.segments,
    obj.data,
    obj.result,
    obj.rawTranscript,
    obj.items,
    obj.lines,
  ];

  for (const candidate of directCandidates) {
    const segments = normalizeSegments(candidate);
    if (segments.length > 0) {
      return { segments, responseShape: detectResponseShape(data, "") };
    }
  }

  for (const nested of collectNestedArrays(obj)) {
    const segments = normalizeSegments(nested);
    if (segments.length > 0) {
      return { segments, responseShape: "nested_array" };
    }
  }

  if (typeof obj.cleanedTranscript === "string" && obj.cleanedTranscript.trim()) {
    return {
      segments: [{ text: decodeHtmlEntities(obj.cleanedTranscript.trim()) }],
      responseShape: "cleaned_transcript_string",
    };
  }

  if (typeof obj.text === "string" && obj.text.trim()) {
    return {
      segments: [{ text: decodeHtmlEntities(obj.text.trim()) }],
      responseShape: "text_string",
    };
  }

  if (typeof obj.rawTranscript === "string" && obj.rawTranscript.trim()) {
    return {
      segments: normalizeSegments(obj.rawTranscript),
      responseShape: "raw_transcript_string",
    };
  }

  return { segments: [], responseShape: shape, apiError: extractApiErrorMessage(obj) };
}

function parseTitle(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const raw =
    (typeof obj.title === "string" ? obj.title : "") ||
    (typeof obj.videoTitle === "string" ? obj.videoTitle : "") ||
    (typeof obj.video_title === "string" ? obj.video_title : "");
  const title = decodeHtmlEntities(raw.trim());
  return title || undefined;
}

function parseDurationMinutes(data: unknown, segments: TranscriptSegment[]): number | undefined {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const duration =
      obj.duration ??
      obj.durationSeconds ??
      obj.lengthSeconds ??
      obj.video_length;
    if (typeof duration === "number" && duration > 0) {
      return duration > 300 ? Math.round(duration / 60) : Math.max(1, Math.round(duration / 60));
    }
    if (typeof duration === "string") {
      const parsed = Number(duration);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed > 300 ? Math.round(parsed / 60) : Math.max(1, Math.round(parsed / 60));
      }
    }
  }

  const lastStart = segments.reduce(
    (max, seg) => Math.max(max, seg.startSeconds ?? 0),
    0,
  );
  if (lastStart > 0) {
    return Math.max(1, Math.round(lastStart / 60));
  }
  return undefined;
}

function segmentsToText(segments: TranscriptSegment[]): string {
  const lines = segments.map((seg) => {
    if (seg.startSeconds !== undefined) {
      return `[${formatTimestamp(seg.startSeconds)}] ${seg.text}`;
    }
    return seg.text;
  });
  return lines.join("\n");
}

function buildImportantMoments(segments: TranscriptSegment[]): TranscriptMomentHint[] {
  const timed = segments.filter(
    (s) => s.startSeconds !== undefined && s.text.length > 15,
  );
  if (timed.length === 0) return [];

  const max = 10;
  const step = Math.max(1, Math.floor(timed.length / max));
  const moments: TranscriptMomentHint[] = [];

  for (let i = 0; i < timed.length && moments.length < max; i += step) {
    const seg = timed[i];
    if (seg.startSeconds === undefined) continue;
    moments.push({
      time: formatTimestamp(seg.startSeconds),
      snippet: seg.text.slice(0, 100),
    });
  }

  return moments;
}

function buildRequestAttempts(
  config: RapidApiConfig,
  videoId: string,
  canonicalUrl: string,
): RapidApiAttempt[] {
  const paths = [...new Set([config.path, DEFAULT_RAPIDAPI_PATH])];
  const attempts: RapidApiAttempt[] = [];

  for (const path of paths) {
    attempts.push({ method: "GET", path, queryParams: { videoId } });
    attempts.push({ method: "GET", path, queryParams: { videoId, lang: "en" } });
    attempts.push({ method: "GET", path, queryParams: { video_id: videoId } });
    attempts.push({ method: "GET", path, queryParams: { id: videoId } });
  }

  attempts.push({
    method: "GET",
    path: DEFAULT_RAPIDAPI_PATH,
    queryParams: { url: canonicalUrl },
  });

  return attempts;
}

function logYoutubeExtractionDev(
  event: string,
  details: Record<string, unknown>,
): void {
  if (!isDevelopment()) return;
  console.info("[summify.youtube-extract]", event, details);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTRACTION_CONFIG.youtubeTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ExtractionError(
        "Transcript extraction timed out. Try again or use a shorter video.",
        408,
      );
    }
    throw new ExtractionError("Could not reach the transcript service.", 502);
  } finally {
    clearTimeout(timer);
  }
}

async function executeRapidApiAttempt(
  config: RapidApiConfig,
  attempt: RapidApiAttempt,
): Promise<RapidApiAttemptResult> {
  const headers = {
    "x-rapidapi-key": config.apiKey,
    "x-rapidapi-host": config.host,
    Accept: "application/json",
  };

  let requestUrl: string;
  if (attempt.method === "GET") {
    const url = new URL(`https://${config.host}${attempt.path}`);
    for (const [key, value] of Object.entries(attempt.queryParams)) {
      url.searchParams.set(key, value);
    }
    requestUrl = url.toString();
    const response = await fetchWithTimeout(requestUrl, { method: "GET", headers });
    const bodyText = await response.text();
    const contentType = response.headers.get("content-type") ?? "unknown";
    let payload: unknown = null;
    try {
      payload = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      payload = null;
    }
    const responseShape = detectResponseShape(payload, bodyText);
    const parsed = parseTranscriptPayload(payload);
    return {
      method: "GET",
      requestUrl,
      path: attempt.path,
      queryParams: attempt.queryParams,
      status: response.status,
      contentType,
      bodyPreview: safeBodyPreview(bodyText),
      payload,
      responseShape: parsed.segments.length > 0 ? parsed.responseShape : responseShape,
      apiError: parsed.apiError,
      segmentCount: parsed.segments.length,
    };
  }

  const postUrl = new URL(`https://${config.host}${attempt.path}`);
  requestUrl = postUrl.toString();
  const response = await fetchWithTimeout(requestUrl, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(attempt.body ?? attempt.queryParams),
  });
  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "unknown";
  let payload: unknown = null;
  try {
    payload = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    payload = null;
  }
  const responseShape = detectResponseShape(payload, bodyText);
  const parsed = parseTranscriptPayload(payload);
  return {
    method: "POST",
    requestUrl,
    path: attempt.path,
    queryParams: attempt.queryParams,
    status: response.status,
    contentType,
    bodyPreview: safeBodyPreview(bodyText),
    payload,
    responseShape: parsed.segments.length > 0 ? parsed.responseShape : responseShape,
    apiError: parsed.apiError,
    segmentCount: parsed.segments.length,
  };
}

function mapHttpFailure(
  status: number,
  bodyText: string,
  debug: YoutubeExtractionDebug,
): ExtractionError {
  const lower = bodyText.toLowerCase();
  let message: string;
  let failureReason: string;

  if (status === 429 || lower.includes("rate limit") || lower.includes("quota")) {
    message = "Transcript service rate limit reached. Wait a moment and try again.";
    failureReason = "rate_limit";
  } else if (status === 401 || status === 403) {
    message = "YouTube extraction failed — check RapidAPI credentials.";
    failureReason = "auth_failed";
  } else if (status === 404 || lower.includes("does not exist")) {
    message = isDevelopment()
      ? `RapidAPI endpoint not found (HTTP 404). Set RAPIDAPI_YOUTUBE_PATH=/api/transcript and use query videoId.`
      : "Transcript not found for this video. It may have captions disabled or be restricted.";
    failureReason = "endpoint_not_found";
  } else if (lower.includes("not found") || lower.includes("no transcript")) {
    message = "Transcript not found for this video. It may have captions disabled or be restricted.";
    failureReason = "transcript_not_found";
  } else {
    message = "Could not extract a transcript for this video.";
    failureReason = "http_error";
  }

  return new ExtractionError(message, status >= 500 ? 502 : 422, {
    ...debug,
    failureReason,
    status,
  });
}

function buildDebugBase(
  originalUrl: string,
  videoId: string,
  config: RapidApiConfig,
): YoutubeExtractionDebug {
  return {
    videoId,
    hostConfigured: Boolean(config.host),
  };
}

async function callRapidApiTranscript(
  config: RapidApiConfig,
  videoId: string,
  canonicalUrl: string,
  originalUrl: string,
): Promise<{ payload: unknown; attempt: RapidApiAttemptResult }> {
  const attempts = buildRequestAttempts(config, videoId, canonicalUrl);
  const debugBase = buildDebugBase(originalUrl, videoId, config);

  logYoutubeExtractionDev("start", {
    originalUrl,
    videoId,
    hostConfigured: debugBase.hostConfigured,
    configuredPath: config.path,
    attemptCount: attempts.length,
  });

  let lastResult: RapidApiAttemptResult | null = null;
  let lastApiError: string | undefined;

  for (const attempt of attempts) {
    const result = await executeRapidApiAttempt(config, attempt);
    lastResult = result;

    logYoutubeExtractionDev("attempt", {
      originalUrl,
      videoId,
      method: result.method,
      requestPath: result.path,
      requestUrl: result.requestUrl.replace(/x-rapidapi-key=[^&]+/i, "x-rapidapi-key=[redacted]"),
      queryParams: result.queryParams,
      httpStatus: result.status,
      contentType: result.contentType,
      responseShape: result.responseShape,
      segmentCount: result.segmentCount,
      bodyPreview: result.bodyPreview,
      rapidApiError: result.apiError,
    });

    if (result.segmentCount > 0) {
      logYoutubeExtractionDev("success", {
        videoId,
        responseShape: result.responseShape,
        segmentCount: result.segmentCount,
        requestPath: result.path,
        queryParams: result.queryParams,
      });
      return { payload: result.payload, attempt: result };
    }

    if (result.apiError) {
      lastApiError = result.apiError;
    }

    if (result.status >= 400 && result.status !== 200) {
      continue;
    }
  }

  const failureDebug: YoutubeExtractionDebug = {
    ...debugBase,
    status: lastResult?.status,
    responseShape: lastResult?.responseShape,
    requestPath: lastResult?.path,
    queryParams: lastResult?.queryParams,
    rapidApiError: lastApiError ?? lastResult?.apiError,
    failureReason: lastResult?.status === 404 ? "endpoint_not_found" : "no_segments_parsed",
  };

  if (lastResult && lastResult.status >= 400) {
    throw mapHttpFailure(
      lastResult.status,
      lastResult.bodyPreview,
      failureDebug,
    );
  }

  const devDetail = isDevelopment() && lastApiError ? ` (${lastApiError})` : "";
  const message = isDevelopment()
    ? `Transcript not found for this video.${devDetail} Check server logs for response shape.`
    : "Transcript not found for this video. Captions may be disabled or unavailable.";

  throw new ExtractionError(message, 422, failureDebug);
}

function estimateReadingMinutes(charCount: number): number {
  const words = Math.max(1, charCount / 5);
  return Math.max(1, Math.round(words / 200));
}

/**
 * Fetch and normalize a YouTube transcript for analysis.
 */
export async function extractFromYouTube(
  urlInput: string,
  options?: { planId?: PlanId; planLimits?: PlanLimits },
): Promise<YoutubeExtractionResult> {
  const { videoId, canonicalUrl } = assertValidYouTubeInput(urlInput);
  const rapidConfig = getRapidApiConfig();

  let payload: unknown;
  try {
    const result = await callRapidApiTranscript(
      rapidConfig,
      videoId,
      canonicalUrl,
      urlInput.trim(),
    );
    payload = result.payload;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError("YouTube transcript extraction failed.", 502);
  }

  const { segments, responseShape } = parseTranscriptPayload(payload);

  if (segments.length === 0) {
    const debug: YoutubeExtractionDebug = {
      videoId,
      hostConfigured: Boolean(rapidConfig.host),
      responseShape,
      failureReason: "no_segments_after_parse",
    };
    const message = isDevelopment()
      ? `Transcript not found for this video. Response shape: ${responseShape}.`
      : "Transcript not found for this video. Captions may be disabled or unavailable.";
    throw new ExtractionError(message, 422, debug);
  }

  const rawText = segmentsToText(segments);
  const cleaned = cleanText(rawText);

  if (cleaned.length < EXTRACTION_CONFIG.minExtractedChars) {
    throw new ExtractionError(
      `Transcript is too short for analysis (minimum ${EXTRACTION_CONFIG.minExtractedChars} characters).`,
      422,
      { videoId, hostConfigured: true, failureReason: "transcript_too_short" },
    );
  }

  const limits = options?.planLimits ?? getPlanLimits(options?.planId ?? "free");
  const applied = applyPlanDocumentLimits(cleaned, limits);

  const profile = profileExtractedText(cleaned);
  const title = parseTitle(payload);
  const estimatedDurationMinutes = parseDurationMinutes(payload, segments);
  const hasTimestamps = segments.some((s) => s.startSeconds !== undefined);
  const importantMoments = hasTimestamps ? buildImportantMoments(segments) : undefined;

  return {
    extractedText: applied.text,
    metadata: {
      title,
      videoId,
      sourceUrl: canonicalUrl,
      extractedCharacters: applied.fullExtractedCharacters,
      estimatedDurationMinutes,
      estimatedReadingTimeMinutes: estimateReadingMinutes(applied.analyzedCharacters),
      transcriptSegmentCount: segments.length,
      importantMoments,
      hasTimestamps,
      sourceType: "youtube",
      complexity: profile.complexity,
      truncated: applied.wasTruncated,
      wasChunked: applied.wasChunked,
      truncationStrategy: applied.truncationStrategy,
      limitNotice: applied.limitNotice,
    },
  };
}
