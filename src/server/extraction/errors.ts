export type ExtractionErrorDebug = Record<string, unknown>;

export class ExtractionError extends Error {
  readonly statusCode: number;
  readonly debug?: ExtractionErrorDebug;

  constructor(message: string, statusCode = 400, debug?: ExtractionErrorDebug) {
    super(message);
    this.name = "ExtractionError";
    this.statusCode = statusCode;
    this.debug = debug;
  }
}
