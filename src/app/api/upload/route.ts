import { NextResponse } from "next/server";
import { createDocumentInput } from "@/core/documents";
import { trackUsageMock } from "@/core/usage";
import { trackTelemetryMock } from "@/core/telemetry";
import { API_MOCK_META, type UploadApiResponse } from "@/core/api/responses";
import { getOptionalUser } from "@/lib/auth";
import { uploadLimiter } from "@/lib/rateLimit";

/**
 * POST /api/upload
 *
 * TODO: Authenticate request (Supabase session / API key).
 * TODO: Stream file to object storage (S3, Supabase Storage).
 * TODO: Enqueue extraction job (Inngest, BullMQ, or edge queue).
 * TODO: Return signed URL + document record from database.
 */
export async function POST(request: Request) {
  const user = await getOptionalUser();
  const identifier = user?.id
    ?? request.headers.get("x-forwarded-for")
    ?? "anonymous";

  // Log for monitoring (no PII)
  console.log("[upload] request from", user ? "authenticated" : "anonymous");

  const { allowed } = uploadLimiter(identifier);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
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

    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", meta: API_MOCK_META },
      { status: 400 },
    );
  }
}
