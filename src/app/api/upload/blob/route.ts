import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import type { ExtractionErrorCode } from "@/types/extraction";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

type BlobUploadClientPayload = {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

type BlobUploadErrorResponse = {
  success: false;
  error: string;
  code: ExtractionErrorCode;
  details?: string;
  requestId: string;
};

type BlobUploadLogMeta = {
  requestId: string;
  endpoint: "/api/upload/blob";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: number;
  errorCode?: ExtractionErrorCode;
};

function getRequestId(): string {
  return crypto.randomUUID();
}

function logBlobUpload(meta: BlobUploadLogMeta) {
  console.info("[summify.blob-upload]", meta);
}

function errorPayload(
  error: string,
  code: ExtractionErrorCode,
  requestId: string,
  details?: string,
): BlobUploadErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
    requestId,
  };
}

function parseClientPayload(clientPayload: string | null): BlobUploadClientPayload {
  if (!clientPayload) return {};
  try {
    const parsed = JSON.parse(clientPayload) as BlobUploadClientPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isAllowedContentType(mimeType: string | undefined): boolean {
  return Boolean(
    mimeType &&
      (ALLOWED_CONTENT_TYPES as readonly string[]).includes(mimeType),
  );
}

function isSafeUploadPathname(pathname: string): boolean {
  return pathname.startsWith("uploads/") && !pathname.includes("..");
}

function classifyBlobUploadError(error: unknown): {
  code: ExtractionErrorCode;
  message: string;
  status: number;
  details?: string;
} {
  const details = error instanceof Error ? error.message : String(error);
  const lower = details.toLowerCase();

  if (lower.includes("content type") || lower.includes("not allowed")) {
    return {
      code: "UNSUPPORTED_FILE_TYPE",
      message: "This file type isn't supported. Upload PDF, DOCX, TXT, or PPTX.",
      status: 400,
      details,
    };
  }

  if (lower.includes("too large") || lower.includes("maximum")) {
    return {
      code: "FILE_TOO_LARGE",
      message: "This file is larger than the current 20 MB limit.",
      status: 413,
      details,
    };
  }

  if (
    lower.includes("blob_read_write_token") ||
    lower.includes("read-write token") ||
    lower.includes("invalid `token`") ||
    lower.includes("invalid token") ||
    lower.includes("no blob credentials") ||
    lower.includes("oidc") ||
    lower.includes("blob_store_id") ||
    lower.includes("storeid") ||
    lower.includes("missing webhook public key")
  ) {
    return {
      code: "BLOB_TOKEN_FAILED",
      message: "Couldn't start large-file upload. Please try again.",
      status: 500,
      details: "Blob OIDC authentication or upload callback configuration failed.",
    };
  }

  return {
    code: "BLOB_UPLOAD_FAILED",
    message: "Large-file upload failed. Please try again.",
    status: 500,
    details,
  };
}

export async function POST(request: Request) {
  const requestId = getRequestId();
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;

  try {
    const body = (await request.json()) as HandleUploadPresignedBody;

    const response = await handleUploadPresigned({
      request,
      body,
      getSignedToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        fileName = payload.fileName;
        fileSize = payload.fileSize;
        mimeType = payload.mimeType;

        if (!isSafeUploadPathname(pathname)) {
          throw new Error("Blob upload pathname is not allowed.");
        }

        if (!isAllowedContentType(mimeType)) {
          throw new Error("Blob upload content type is not allowed.");
        }

        if (!fileSize || fileSize > MAX_FILE_SIZE_BYTES) {
          throw new Error("Blob upload file is too large.");
        }

        const validUntil = Date.now() + 10 * 60 * 1000;
        const tokenPayload = JSON.stringify({
          requestId,
          fileName,
          fileSize,
          mimeType,
        });

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
            maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
            validUntil,
          }),
          urlOptions: {
            allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
            maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
            validUntil,
            addRandomSuffix: false,
            allowOverwrite: false,
            tokenPayload,
          },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseClientPayload(tokenPayload ?? null);
        logBlobUpload({
          requestId,
          endpoint: "/api/upload/blob",
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          mimeType: blob.contentType ?? payload.mimeType,
          status: 200,
        });
      },
    });

    logBlobUpload({
      requestId,
      endpoint: "/api/upload/blob",
      fileName,
      fileSize,
      mimeType,
      status: 200,
    });
    return NextResponse.json(response);
  } catch (error) {
    const mapped = classifyBlobUploadError(error);
    const payload = errorPayload(
      mapped.message,
      mapped.code,
      requestId,
      process.env.NODE_ENV === "development" ? mapped.details : undefined,
    );
    logBlobUpload({
      requestId,
      endpoint: "/api/upload/blob",
      fileName,
      fileSize,
      mimeType,
      status: mapped.status,
      errorCode: mapped.code,
    });
    return NextResponse.json(payload, { status: mapped.status });
  }
}
