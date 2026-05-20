/**
 * SERVER ONLY — document extraction orchestrator.
 *
 * Future: youtube.ts, audio.ts, chunking/
 * Do not import in client components.
 */

import { getPlanLimits, type PlanLimits } from "@/lib/plans/planLimits";
import type { PlanId } from "@/types/plan";
import { EXTRACTION_CONFIG, type SupportedExtractExtension } from "./config";
import { applyPlanDocumentLimits } from "./applyPlanDocumentLimits";
import { cleanText } from "./cleanText";
import { profileExtractedText } from "./profile";
import { extractPdfText } from "./pdf";
import { extractDocxText } from "./docx";
import { extractTxtText } from "./txt";
import { USER_MESSAGES } from "@/lib/user-messages";
import { ExtractionError } from "./errors";

export type ExtractionMetadata = {
  fileName: string;
  fileType: SupportedExtractExtension;
  estimatedPages: number;
  extractedCharacters: number;
  complexity: "low" | "medium" | "high";
  structureQuality: "sparse" | "moderate" | "structured";
  truncated: boolean;
  wasChunked?: boolean;
  truncationStrategy?: string | null;
  limitNotice?: string | null;
};

export type ExtractionResult = {
  extractedText: string;
  metadata: ExtractionMetadata;
};

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function resolveExtractExtension(
  fileName: string,
): SupportedExtractExtension | null {
  const ext = getExtension(fileName);
  if (
    (EXTRACTION_CONFIG.supportedExtensions as readonly string[]).includes(ext)
  ) {
    return ext as SupportedExtractExtension;
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ExtractionError(USER_MESSAGES.extractTimeout, 408),
      );
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function extractRaw(
  buffer: Buffer,
  fileType: SupportedExtractExtension,
): Promise<{ text: string; pageCount?: number }> {
  switch (fileType) {
    case "pdf": {
      const { text, pageCount } = await extractPdfText(buffer);
      return { text, pageCount };
    }
    case "docx":
      return { text: await extractDocxText(buffer) };
    case "txt":
      return { text: await extractTxtText(buffer) };
    default:
      throw new ExtractionError(USER_MESSAGES.extractUnsupported, 400);
  }
}

export type ExtractFileParams = {
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
  planId?: PlanId;
  planLimits?: PlanLimits;
};

/**
 * Extract, clean, profile, and enforce limits on an uploaded file.
 */
export async function extractFromFile(
  params: ExtractFileParams,
): Promise<ExtractionResult> {
  const { fileName, buffer } = params;

  if (!fileName.trim()) {
    throw new ExtractionError(USER_MESSAGES.extractFileMissing, 400);
  }

  if (buffer.length === 0) {
    throw new ExtractionError(
      "This file appears to be empty. Choose a different file.",
      400,
    );
  }

  const limits = params.planLimits ?? getPlanLimits(params.planId ?? "free");
  const maxBytes = limits.maxUploadMb * 1024 * 1024;

  if (buffer.length > maxBytes) {
    throw new ExtractionError(USER_MESSAGES.extractFileTooLarge(limits.maxUploadMb), 413);
  }

  const fileType = resolveExtractExtension(fileName);
  if (!fileType) {
    throw new ExtractionError(USER_MESSAGES.extractUnsupported, 400);
  }

  let rawText: string;
  let pdfPages: number | undefined;

  try {
    const extracted = await withTimeout(
      extractRaw(buffer, fileType),
      EXTRACTION_CONFIG.timeoutMs,
    );
    rawText = extracted.text;
    pdfPages = extracted.pageCount;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;

    throw new ExtractionError(USER_MESSAGES.extractFailed, 422);
  }

  const cleaned = cleanText(rawText);

  if (cleaned.length < EXTRACTION_CONFIG.minExtractedChars) {
    throw new ExtractionError(
      USER_MESSAGES.extractTooShort(EXTRACTION_CONFIG.minExtractedChars),
      422,
    );
  }

  const profile = profileExtractedText(cleaned);

  const estimatedPages =
    fileType === "pdf" && pdfPages
      ? pdfPages
      : profile.estimatedPages;

  const applied = applyPlanDocumentLimits(cleaned, limits, { estimatedPages });

  return {
    extractedText: applied.text,
    metadata: {
      fileName,
      fileType,
      estimatedPages: applied.extractedPages,
      extractedCharacters: applied.fullExtractedCharacters,
      complexity: profile.complexity,
      structureQuality: profile.structureQuality,
      truncated: applied.wasTruncated,
      wasChunked: applied.wasChunked,
      truncationStrategy: applied.truncationStrategy,
      limitNotice: applied.limitNotice,
    },
  };
}

/** PPTX helpers — import from `@/server/extraction/pptx` in upload routes only. */
export { extractFromPptx, isPptxFile } from "./pptx";
export type {
  PptxExtractionMetadata,
  PptxExtractionResult,
  PptxSlideExtract,
} from "./pptx";
export { EXTRACTION_CONFIG } from "./config";
export { ExtractionError } from "./errors";
