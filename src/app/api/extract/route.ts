import { NextResponse } from "next/server";
import { get as getBlob } from "@vercel/blob";
import {
  extractFromFile,
  ExtractionError,
} from "@/server/extraction";
import { extractFromPptx, isPptxFile } from "@/server/extraction/pptx";
import { synthesizeSlideOutlineLabel } from "@/server/learn/presentationSemanticTitles";
import { getPlanLimits } from "@/lib/plans/planLimits";
import type {
  ExtractApiErrorResponse,
  ExtractApiSuccessResponse,
  ExtractionErrorCode,
  PresentationExtractionMetadata,
  PresentationSlideOutlineItem,
} from "@/types/extraction";
import { getOptionalUser } from "@/lib/auth";
import { getProfile } from "@/lib/supabase/profile";
import { resolveModeEntitlementPlanId } from "@/lib/mode-access";
import { USER_MESSAGES } from "@/lib/user-messages";
import { devError, logServerError } from "@/server/logging";
import { extractLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractLogMeta = {
  requestId: string;
  endpoint: "/api/extract";
  method: string;
  contentLength: string | null;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  extractedCharacterCount?: number;
  responseJsonBytes?: number;
  durationMs: number;
  status: number;
  code?: ExtractionErrorCode;
  uploadMode?: "direct" | "blob";
  sourceType?: "file" | "blob";
};

type BlobExtractRequest = {
  sourceType?: "blob";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  blobPathname?: string;
};

function getRequestId(): string {
  return crypto.randomUUID();
}

function getJsonSizeBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function logExtract(meta: ExtractLogMeta) {
  console.info("[summify.extract]", meta);
}

function errorPayload(
  error: string,
  code: ExtractionErrorCode,
  requestId: string,
  details?: string,
): ExtractApiErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
    requestId,
  };
}

function getStatusForCode(code: ExtractionErrorCode): number {
  if (code === "FUNCTION_PAYLOAD_TOO_LARGE" || code === "FILE_TOO_LARGE") return 413;
  if (code === "UNSUPPORTED_FILE_TYPE") return 400;
  if (code === "BLOB_TOKEN_FAILED" || code === "BLOB_UPLOAD_FAILED") return 500;
  if (code === "BLOB_DOWNLOAD_FAILED") return 502;
  if (code === "EXTRACTION_TIMEOUT") return 408;
  if (
    code === "PDF_PARSE_FAILED" ||
    code === "EMPTY_EXTRACTED_TEXT" ||
    code === "EXTRACTION_FAILED"
  ) {
    return 422;
  }
  return 500;
}

function inferUnexpectedError(error: unknown): {
  code: ExtractionErrorCode;
  error: string;
  status: number;
  details?: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("payload") && lower.includes("large")) {
    return {
      code: "FUNCTION_PAYLOAD_TOO_LARGE",
      error:
        "This file produced too much data for the current extraction route. Try again, compress the PDF, or use a smaller version.",
      status: 413,
      details: message,
    };
  }

  return {
    code: "UNKNOWN_SERVER_ERROR",
    error: USER_MESSAGES.extractGeneric,
    status: 500,
    details: message,
  };
}

const MAX_BLOB_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

function isSupportedMimeType(mimeType: string | undefined): boolean {
  return Boolean(mimeType && SUPPORTED_MIME_TYPES.has(mimeType));
}

function isAllowedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".blob.vercel-storage.com") ||
        url.hostname.endsWith(".public.blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new ExtractionError(
        USER_MESSAGES.extractFileTooLarge(20),
        413,
        "FILE_TOO_LARGE",
      );
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks, totalBytes);
}

async function downloadBlobFile(input: {
  fileUrl: string;
  blobPathname?: string;
  expectedSize: number;
}): Promise<Buffer> {
  if (!isAllowedBlobUrl(input.fileUrl)) {
    throw new ExtractionError(
      "We uploaded the file, but couldn't prepare it for extraction.",
      400,
      "BLOB_DOWNLOAD_FAILED",
    );
  }

  try {
    const blob = await getBlob(input.blobPathname || input.fileUrl, {
      access: "private",
      useCache: false,
    });

    if (!blob?.stream) {
      throw new ExtractionError(
        "We uploaded the file, but couldn't prepare it for extraction.",
        502,
        "BLOB_DOWNLOAD_FAILED",
      );
    }

    if (blob.blob.size && blob.blob.size > MAX_BLOB_DOWNLOAD_BYTES) {
      throw new ExtractionError(
        "This file is larger than the current 20 MB limit.",
        413,
        "FILE_TOO_LARGE",
      );
    }

    return streamToBuffer(
      blob.stream,
      Math.min(MAX_BLOB_DOWNLOAD_BYTES, Math.max(input.expectedSize, 1) + 1024),
    );
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "We uploaded the file, but couldn't prepare it for extraction.",
      502,
      "BLOB_DOWNLOAD_FAILED",
      { details: error instanceof Error ? error.message : String(error) },
    );
  }
}

function buildSlideOutline(
  slides: { slideNumber: number; title?: string; text: string }[],
): PresentationSlideOutlineItem[] {
  return slides.slice(0, 5).map((slide) => {
    const preview =
      slide.text.replace(/\s+/g, " ").trim().slice(0, 72) +
      (slide.text.length > 72 ? "…" : "");
    const label = synthesizeSlideOutlineLabel(
      slide.slideNumber,
      slide.title,
      preview,
    );
    return {
      slideNumber: slide.slideNumber,
      title: label.semanticTitle,
      displayLabel: label.displayLabel,
      preview: label.confidence === "high" ? undefined : preview,
    };
  });
}

async function extractBufferResponse(input: {
  requestId: string;
  startedAt: number;
  contentLength: string | null;
  method: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
  planId: ReturnType<typeof resolveModeEntitlementPlanId>;
  limits: ReturnType<typeof getPlanLimits>;
  uploadMode: "direct" | "blob";
  sourceType: "file" | "blob";
}) {
  if (isPptxFile(input.fileName, input.mimeType)) {
    const pptx = await extractFromPptx({
      fileName: input.fileName,
      buffer: input.buffer,
      planId: input.planId,
      planLimits: input.limits,
    });

    const metadata: PresentationExtractionMetadata = {
      sourceKind: "presentation",
      fileName: pptx.metadata.fileName,
      fileType: "pptx",
      slideCount: pptx.metadata.slideCount,
      extractedCharacters: pptx.metadata.extractedCharacters,
      detectedSlideTitles: pptx.metadata.detectedSlideTitles,
      detectedTitleCount: pptx.metadata.detectedSlideTitles.length,
      repeatedThemes: pptx.metadata.repeatedThemes,
      estimatedReadingTimeMinutes: pptx.metadata.estimatedReadingTimeMinutes,
      complexity: pptx.metadata.complexity,
      truncated: pptx.metadata.truncated,
      slideOutline: buildSlideOutline(pptx.slides),
    };

    const response: ExtractApiSuccessResponse = {
      success: true,
      extractedText: pptx.extractedText,
      metadata,
      limitNotice: pptx.metadata.limitNotice ?? undefined,
    };

    logExtract({
      requestId: input.requestId,
      endpoint: "/api/extract",
      method: input.method,
      contentLength: input.contentLength,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      uploadMode: input.uploadMode,
      sourceType: input.sourceType,
      extractedCharacterCount: metadata.extractedCharacters,
      responseJsonBytes: getJsonSizeBytes(response),
      durationMs: Date.now() - input.startedAt,
      status: 200,
    });
    return NextResponse.json(response);
  }

  const result = await extractFromFile({
    fileName: input.fileName,
    buffer: input.buffer,
    mimeType: input.mimeType,
    planId: input.planId,
    planLimits: input.limits,
  });

  const response: ExtractApiSuccessResponse = {
    success: true,
    extractedText: result.extractedText,
    metadata: {
      sourceKind: "file",
      ...result.metadata,
    },
    limitNotice: result.metadata.limitNotice ?? undefined,
  };

  logExtract({
    requestId: input.requestId,
    endpoint: "/api/extract",
    method: input.method,
    contentLength: input.contentLength,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    uploadMode: input.uploadMode,
    sourceType: input.sourceType,
    extractedCharacterCount: result.metadata.extractedCharacters,
    responseJsonBytes: getJsonSizeBytes(response),
    durationMs: Date.now() - input.startedAt,
    status: 200,
  });
  return NextResponse.json(response);
}

/**
 * POST /api/extract
 *
 * Multipart form-data with field `file` (PDF, DOCX, TXT, or PPTX).
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId();
  const contentLength = request.headers.get("content-length");
  let fileName: string | undefined;
  let mimeType: string | undefined;
  let fileSize: number | undefined;
  let uploadMode: "direct" | "blob" | undefined;
  let sourceType: "file" | "blob" | undefined;

  const ip = request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";

  const { allowed } = extractLimiter(ip);
  if (!allowed) {
    const payload = errorPayload(
      "Too many requests. Please wait a moment.",
      "EXTRACTION_FAILED",
      requestId,
    );
    logExtract({
      requestId,
      endpoint: "/api/extract",
      method: request.method,
      contentLength,
      responseJsonBytes: getJsonSizeBytes(payload),
      durationMs: Date.now() - startedAt,
      status: 429,
      code: payload.code,
    });
    return NextResponse.json(payload, { status: 429 });
  }

  try {
    const currentUser = await getOptionalUser();
    const profile = currentUser ? await getProfile(currentUser.id) : null;
    const planId = resolveModeEntitlementPlanId(profile, Boolean(currentUser));
    const limits = getPlanLimits(planId);

    if (request.headers.get("content-type")?.includes("application/json")) {
      uploadMode = "blob";
      sourceType = "blob";
      const body = (await request.json()) as BlobExtractRequest;
      if (body.sourceType !== "blob") {
        throw new ExtractionError(USER_MESSAGES.extractFileMissing, 400, "EXTRACTION_FAILED");
      }

      fileName = body.fileName;
      mimeType = body.mimeType;
      fileSize = body.fileSize;

      if (!body.fileUrl || !fileName || !fileSize || !mimeType) {
        throw new ExtractionError(
          "We uploaded the file, but couldn't prepare it for extraction.",
          400,
          "BLOB_DOWNLOAD_FAILED",
        );
      }

      if (!isSupportedMimeType(mimeType)) {
        throw new ExtractionError(USER_MESSAGES.extractUnsupported, 400, "UNSUPPORTED_FILE_TYPE");
      }

      if (fileSize > limits.maxUploadMb * 1024 * 1024) {
        throw new ExtractionError(
          "This file is larger than the current 20 MB limit.",
          413,
          "FILE_TOO_LARGE",
        );
      }

      const buffer = await downloadBlobFile({
        fileUrl: body.fileUrl,
        blobPathname: body.blobPathname,
        expectedSize: fileSize,
      });

      return extractBufferResponse({
        requestId,
        startedAt,
        contentLength,
        method: request.method,
        fileName,
        mimeType,
        fileSize,
        buffer,
        planId,
        limits,
        uploadMode: "blob",
        sourceType: "blob",
      });
    }

    const formData = await request.formData();
    uploadMode = "direct";
    sourceType = "file";
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      const payload = errorPayload(
        USER_MESSAGES.extractFileMissing,
        "EXTRACTION_FAILED",
        requestId,
      );
      logExtract({
        requestId,
        endpoint: "/api/extract",
        method: request.method,
        contentLength,
        responseJsonBytes: getJsonSizeBytes(payload),
        durationMs: Date.now() - startedAt,
        status: 400,
        code: payload.code,
      });
      return NextResponse.json(payload, { status: 400 });
    }

    fileName = file.name;
    mimeType = file.type;
    fileSize = file.size;

    if (file.size > limits.maxUploadMb * 1024 * 1024) {
      const payload = errorPayload(
        USER_MESSAGES.extractFileTooLarge(limits.maxUploadMb),
        "FILE_TOO_LARGE",
        requestId,
      );
      logExtract({
        requestId,
        endpoint: "/api/extract",
        method: request.method,
        contentLength,
        fileName,
        mimeType,
        fileSize,
        uploadMode: "direct",
        sourceType: "file",
        responseJsonBytes: getJsonSizeBytes(payload),
        durationMs: Date.now() - startedAt,
        status: 413,
        code: payload.code,
      });
      return NextResponse.json(payload, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    return extractBufferResponse({
      requestId,
      startedAt,
      contentLength,
      method: request.method,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      buffer,
      planId,
      limits,
      uploadMode: "direct",
      sourceType: "file",
    });
  } catch (error) {
    if (error instanceof ExtractionError) {
      const status = error.statusCode || getStatusForCode(error.code);
      const payload = errorPayload(
        error.message,
        error.code,
        requestId,
        typeof error.debug?.details === "string" ? error.debug.details : undefined,
      );
      logExtract({
        requestId,
        endpoint: "/api/extract",
        method: request.method,
        contentLength,
        fileName,
        mimeType,
        fileSize,
        uploadMode,
        sourceType,
        responseJsonBytes: getJsonSizeBytes(payload),
        durationMs: Date.now() - startedAt,
        status,
        code: error.code,
      });
      return NextResponse.json(payload, { status });
    }

    const mapped = inferUnexpectedError(error);
    logServerError("summify.extract");
    devError("[summify.extract] unexpected error", {
      requestId,
      message: mapped.details,
    });

    const payload = errorPayload(
      mapped.error,
      mapped.code,
      requestId,
      process.env.NODE_ENV === "development" ? mapped.details : undefined,
    );
    logExtract({
      requestId,
      endpoint: "/api/extract",
      method: request.method,
      contentLength,
      fileName,
      mimeType,
      fileSize,
      uploadMode,
      sourceType,
      responseJsonBytes: getJsonSizeBytes(payload),
      durationMs: Date.now() - startedAt,
      status: mapped.status,
      code: mapped.code,
    });
    return NextResponse.json(payload, { status: mapped.status });
  }
}
