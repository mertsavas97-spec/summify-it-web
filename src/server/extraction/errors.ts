import type { ExtractionErrorCode } from "@/types/extraction";

export type ExtractionErrorDebug = Record<string, unknown>;

export class ExtractionError extends Error {
  readonly statusCode: number;
  readonly code: ExtractionErrorCode;
  readonly debug?: ExtractionErrorDebug;

  constructor(
    message: string,
    statusCode = 400,
    codeOrDebug: ExtractionErrorCode | ExtractionErrorDebug = "EXTRACTION_FAILED",
    debug?: ExtractionErrorDebug,
  ) {
    super(message);
    this.name = "ExtractionError";
    this.statusCode = statusCode;
    if (typeof codeOrDebug === "string") {
      this.code = codeOrDebug;
      this.debug = debug;
    } else {
      this.code = "EXTRACTION_FAILED";
      this.debug = codeOrDebug;
    }
  }
}
