import { NextResponse } from "next/server";
import { extractFromYouTube } from "@/server/extraction/youtube";
import { ExtractionError } from "@/server/extraction/errors";
import type { YoutubeExtractionDebug } from "@/server/extraction/youtube";
import type {
  ExtractYoutubeApiErrorResponse,
  ExtractYoutubeApiSuccessResponse,
  ExtractYoutubeDebugMetadata,
} from "@/types/extraction";
import { USER_MESSAGES } from "@/lib/user-messages";
import { devError, logServerError } from "@/server/logging";

export const runtime = "nodejs";
export const maxDuration = 60;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function toClientDebug(debug: YoutubeExtractionDebug | undefined): ExtractYoutubeDebugMetadata | undefined {
  if (!debug || !isDevelopment()) return undefined;
  return {
    videoId: debug.videoId,
    hostConfigured: debug.hostConfigured,
    status: debug.status,
    responseShape: debug.responseShape,
    failureReason: debug.failureReason,
    requestPath: debug.requestPath,
    queryParams: debug.queryParams,
    rapidApiError: debug.rapidApiError,
  };
}

/**
 * POST /api/extract-youtube
 *
 * Body: { url: string }
 * Fetches transcript via RapidAPI (server-side only).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };

    if (typeof body.url !== "string" || !body.url.trim()) {
      const payload: ExtractYoutubeApiErrorResponse = {
        success: false,
        error: "Please enter a YouTube video link.",
      };
      return NextResponse.json(payload, { status: 400 });
    }

    const result = await extractFromYouTube(body.url);

    const response: ExtractYoutubeApiSuccessResponse = {
      success: true,
      extractedText: result.extractedText,
      metadata: {
        sourceKind: "youtube",
        title: result.metadata.title,
        videoId: result.metadata.videoId,
        sourceUrl: result.metadata.sourceUrl,
        extractedCharacters: result.metadata.extractedCharacters,
        estimatedDurationMinutes: result.metadata.estimatedDurationMinutes,
        estimatedReadingTimeMinutes: result.metadata.estimatedReadingTimeMinutes,
        transcriptSegmentCount: result.metadata.transcriptSegmentCount,
        importantMoments: result.metadata.importantMoments,
        hasTimestamps: result.metadata.hasTimestamps,
        complexity: result.metadata.complexity,
        truncated: result.metadata.truncated,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ExtractionError) {
      const debug = toClientDebug(error.debug as YoutubeExtractionDebug | undefined);

      devError("[summify.extract-youtube] extraction_error", {
        message: error.message,
        statusCode: error.statusCode,
        debug,
      });

      const payload: ExtractYoutubeApiErrorResponse = {
        success: false,
        error: error.message,
        ...(debug ? { debug } : {}),
      };
      return NextResponse.json(payload, { status: error.statusCode });
    }

    logServerError("summify.extract-youtube");
    devError("[summify.extract-youtube] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
    });

    const payload: ExtractYoutubeApiErrorResponse = {
      success: false,
      error: USER_MESSAGES.youtubeExtractFailed,
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
