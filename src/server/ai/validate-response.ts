import {
  LEARN_CARD_PROVIDER_TYPES,
  type AnalysisResult,
  type LearnCardOutput,
  type LearnCardProviderType,
} from "./schemas";
import {
  isUsableAnalysisCore,
  normalizeAnalysisResult,
  type NormalizeOptions,
} from "./normalize-response";

export type AnalysisValidationErrorCode =
  | "json_parse_failed"
  | "schema_validation_failed"
  | "normalization_failed";

export class AnalysisValidationError extends Error {
  readonly code: AnalysisValidationErrorCode;

  constructor(message: string, code: AnalysisValidationErrorCode = "schema_validation_failed") {
    super(message);
    this.name = "AnalysisValidationError";
    this.code = code;
  }
}

/** Strip markdown code fences and extract the first JSON object. */
export function extractJsonFromText(text: string): string {
  const trimmed = text.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLearnCardType(value: unknown): value is LearnCardProviderType {
  return (
    typeof value === "string" &&
    (LEARN_CARD_PROVIDER_TYPES as readonly string[]).includes(value)
  );
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseLearnCards(value: unknown): LearnCardOutput[] {
  if (!Array.isArray(value)) return [];

  const cards: LearnCardOutput[] = [];
  for (const card of value) {
    if (!card || typeof card !== "object") continue;
    const c = card as Record<string, unknown>;
    if (!isLearnCardType(c.type)) continue;
    if (!isNonEmptyString(c.title) || !isNonEmptyString(c.content)) continue;
    cards.push({
      type: c.type,
      title: c.title.trim(),
      content: c.content.trim(),
    });
  }
  return cards;
}

export function parseAndValidateAnalysisResult(
  raw: string,
  options?: NormalizeOptions,
): AnalysisResult {
  const trimmedRaw = raw.trim();
  if (!trimmedRaw) {
    throw new AnalysisValidationError(
      "Provider returned empty text before JSON parsing.",
      "json_parse_failed",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonFromText(raw));
  } catch {
    throw new AnalysisValidationError("Response was not valid JSON.", "json_parse_failed");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new AnalysisValidationError(
      "Response JSON must be an object.",
      "schema_validation_failed",
    );
  }

  const obj = parsed as Record<string, unknown>;

  const title = isNonEmptyString(obj.title) ? obj.title.trim() : "";
  const summary = isNonEmptyString(obj.summary) ? obj.summary.trim() : "";

  if (!title && !summary) {
    throw new AnalysisValidationError(
      "Missing usable title and summary.",
      "schema_validation_failed",
    );
  }

  const result: AnalysisResult = {
    title: title || "Document analysis",
    summary: summary || title,
    keyInsights: coerceStringArray(obj.keyInsights),
    risksOrWarnings: coerceStringArray(obj.risksOrWarnings),
    actionItems: coerceStringArray(obj.actionItems),
    learnCards: parseLearnCards(obj.learnCards),
  };

  const normalized = normalizeAnalysisResult(result, options);

  if (!isUsableAnalysisCore(normalized)) {
    throw new AnalysisValidationError(
      "Missing usable title and summary after repair.",
      "normalization_failed",
    );
  }

  return normalized;
}
