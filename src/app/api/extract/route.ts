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
  PresentationExtractionMetadata,
  PresentationSlideOutlineItem,
} from "@/types/extraction";
import { getOptionalUser } from "@/lib/auth";
import { getProfile } from "@/lib/supabase/profile";
import { resolveModeEntitlementPlanId } from "@/lib/mode-access";
import { USER_MESSAGES } from "@/lib/user-messages";
import { devError, logServerError } from "@/server/logging";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      const payload: ExtractApiErrorResponse = {
        success: false,
        error: USER_MESSAGES.extractFileMissing,
      };
      return NextResponse.json(payload, { status: 400 });
    }

    const currentUser = await getOptionalUser();
    const profile = currentUser ? await getProfile(currentUser.id) : null;
    const planId = resolveModeEntitlementPlanId(profile, Boolean(currentUser));
    const limits = getPlanLimits(planId);

    if (file.size > limits.maxUploadMb * 1024 * 1024) {
      const payload: ExtractApiErrorResponse = {
        success: false,
        error: USER_MESSAGES.extractFileTooLarge(limits.maxUploadMb),
      };
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

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ExtractionError) {
      const payload: ExtractApiErrorResponse = {
        success: false,
        error: error.message,
      };
      return NextResponse.json(payload, { status: error.statusCode });
    }

    logServerError("summify.extract");
    devError("[summify.extract] unexpected error", {
      message: error instanceof Error ? error.message : String(error),
    });

    const payload: ExtractApiErrorResponse = {
      success: false,
      error: USER_MESSAGES.extractGeneric,
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
