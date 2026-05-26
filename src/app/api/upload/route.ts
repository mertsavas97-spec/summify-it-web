import { NextResponse } from "next/server";
import { createDocumentInput } from "@/core/documents";
import { trackUsageMock } from "@/core/usage";
import { trackTelemetryMock } from "@/core/telemetry";
import { API_MOCK_META, type UploadApiResponse } from "@/core/api/responses";
import { getOptionalUser } from "@/lib/auth";
import { uploadLimiter } from "@/lib/rateLimit";
import type { ExtractionErrorCode } from "@/types/extraction";

type UploadErrorResponse = {
  error: string;
  code: ExtractionErrorCode;
  details?: string;
  requestId: string;
  meta?: typeof API_MOCK_META;
};

type UploadLogMeta = {
  requestId: string;
  endpoint: "/api/upload";
  method: string;
  contentLength: string | null;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
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

function logUpload(meta: UploadLogMeta) {
  console.info("[upload]", meta);
}

function uploadErrorPayload(
  error: string,
  code: ExtractionErrorCode,
  requestId: string,
  details?: string,
): UploadErrorResponse {
  return {
    error,
    code,
    details,
    requestId,
    meta: API_MOCK_META,
  };
}

/**
 * POST /api/upload
 *
 * TODO: Authenticate request (Supabase session / API key).
 * TODO: Stream file to object storage (S3, Supabase Storage).
 * TODO: Enqueue extraction job (Inngest, BullMQ, or edge queue).
 * TODO: Return signed URL + document record from database.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId();
  const contentLength = request.headers.get("content-length");
  const user = await getOptionalUser();
  const identifier = user?.id
    ?? request.headers.get("x-forwarded-for")
    ?? "anonymous";

  const { allowed } = uploadLimiter(identifier);
  if (!allowed) {
    const payload = uploadErrorPayload(
      "Too many requests. Please wait a moment.",
      "EXTRACTION_FAILED",
      requestId,
    );
    logUpload({
      requestId,
      endpoint: "/api/upload",
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
    const body = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      userId?: string;
    };

    const fileName = body.fileName ?? "document.pdf";
    const mimeType = body.mimeType ?? "application/pdf";
    const sizeBytes = body.sizeBytes ?? 1024;

    const document = createDocumentInput({
      fileName,
      mimeType,
      sizeBytes,
      userId: body.userId,
    });

    trackTelemetryMock("api.upload", { documentId: document.id });
    trackUsageMock({
      userId: body.userId ?? "anonymous",
      type: "document_upload",
      metadata: { documentId: document.id },
    });

    const response: UploadApiResponse = {
      meta: API_MOCK_META,
      document,
      message: "Mock upload accepted. No file stored.",
    };

    logUpload({
      requestId,
      endpoint: "/api/upload",
      method: request.method,
      contentLength,
      fileName,
      mimeType,
      fileSize: sizeBytes,
      responseJsonBytes: getJsonSizeBytes(response),
      durationMs: Date.now() - startedAt,
      status: 201,
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const payload = uploadErrorPayload(
      "Invalid request body",
      message.toLowerCase().includes("payload") && message.toLowerCase().includes("large")
        ? "FUNCTION_PAYLOAD_TOO_LARGE"
        : "UNKNOWN_SERVER_ERROR",
      requestId,
      process.env.NODE_ENV === "development" ? message : undefined,
    );
    const status = payload.code === "FUNCTION_PAYLOAD_TOO_LARGE" ? 413 : 400;
    logUpload({
      requestId,
      endpoint: "/api/upload",
      method: request.method,
      contentLength,
      responseJsonBytes: getJsonSizeBytes(payload),
      durationMs: Date.now() - startedAt,
      status,
      code: payload.code,
    });
    return NextResponse.json(payload, { status });
  }
}
