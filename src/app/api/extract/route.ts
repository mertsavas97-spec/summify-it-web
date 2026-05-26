import { NextResponse } from "next/server";
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
    const formData = await request.formData();
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

    const currentUser = await getOptionalUser();
    const profile = currentUser ? await getProfile(currentUser.id) : null;
    const planId = resolveModeEntitlementPlanId(profile, Boolean(currentUser));
    const limits = getPlanLimits(planId);

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
        responseJsonBytes: getJsonSizeBytes(payload),
        durationMs: Date.now() - startedAt,
        status: 413,
        code: payload.code,
      });
      return NextResponse.json(payload, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isPptxFile(file.name, file.type)) {
      const pptx = await extractFromPptx({
        fileName: file.name,
        buffer,
        planId,
        planLimits: limits,
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
        requestId,
        endpoint: "/api/extract",
        method: request.method,
        contentLength,
        fileName,
        mimeType,
        fileSize,
        extractedCharacterCount: metadata.extractedCharacters,
        responseJsonBytes: getJsonSizeBytes(response),
        durationMs: Date.now() - startedAt,
        status: 200,
      });
      return NextResponse.json(response);
    }

    const result = await extractFromFile({
      fileName: file.name,
      buffer,
      mimeType: file.type,
      planId,
      planLimits: limits,
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
      requestId,
      endpoint: "/api/extract",
      method: request.method,
      contentLength,
      fileName,
      mimeType,
      fileSize,
      extractedCharacterCount: result.metadata.extractedCharacters,
      responseJsonBytes: getJsonSizeBytes(response),
      durationMs: Date.now() - startedAt,
      status: 200,
    });
    return NextResponse.json(response);
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
      responseJsonBytes: getJsonSizeBytes(payload),
      durationMs: Date.now() - startedAt,
      status: mapped.status,
      code: mapped.code,
    });
    return NextResponse.json(payload, { status: mapped.status });
  }
}
