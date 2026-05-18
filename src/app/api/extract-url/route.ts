import { NextResponse } from "next/server";
import { extractFromUrl } from "@/server/extraction/url";
import { ExtractionError } from "@/server/extraction/errors";
import type {
  ExtractUrlApiErrorResponse,
  ExtractUrlApiSuccessResponse,
} from "@/types/extraction";
import { USER_MESSAGES } from "@/lib/user-messages";
import { devError, logServerError } from "@/server/logging";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/extract-url
 *
 * Body: { url: string }
 * Extracts readable article text from a public http(s) page.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };

    if (typeof body.url !== "string" || !body.url.trim()) {
      const payload: ExtractUrlApiErrorResponse = {
        success: false,
        error: USER_MESSAGES.urlRequired,
      };
      return NextResponse.json(payload, { status: 400 });
    }

    const result = await extractFromUrl(body.url);

    const response: ExtractUrlApiSuccessResponse = {
      success: true,
      extractedText: result.extractedText,
      metadata: {
        sourceKind: "url",
        ...result.metadata,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ExtractionError) {
      const payload: ExtractUrlApiErrorResponse = {
        success: false,
        error: error.message,
      };
      return NextResponse.json(payload, { status: error.statusCode });
    }

    logServerError("summify.extract-url");
    devError("[summify.extract-url] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
    });

    const payload: ExtractUrlApiErrorResponse = {
      success: false,
      error: USER_MESSAGES.urlExtractFailed,
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
