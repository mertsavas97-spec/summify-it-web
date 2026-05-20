import { USER_MESSAGES } from "@/lib/user-messages";
import { AI_CONFIG } from "./config";

/** DoS guard — plan soft limits apply later via `prepareDocumentForAnalysis`. */
const ABSOLUTE_MAX_PASTE_CHARS = 500_000;
import type { TextAnalysisMode } from "./schemas";
import type { AnalysisSourceHint } from "@/server/intelligence";
import { resolveModeRouting, type ModeRoutingResult } from "@/server/intelligence/mode-routing";
import { parseAnalyzeSourceContext } from "@/server/intelligence/source-context";
import type { AnalyzeSourceContext } from "@/server/intelligence/types";
import type { IntelligenceModeId } from "@/types/modes";

export class AnalysisInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisInputError";
  }
}

const SOURCE_HINTS: AnalysisSourceHint[] = [
  "youtube",
  "presentation",
  "url",
  "file",
  "text",
];

function parseSourceHint(value: unknown): AnalysisSourceHint | undefined {
  if (typeof value !== "string") return undefined;
  return SOURCE_HINTS.includes(value as AnalysisSourceHint)
    ? (value as AnalysisSourceHint)
    : undefined;
}

export function validateAnalysisInput(
  rawText: unknown,
  mode: unknown,
  sourceHintInput?: unknown,
  sourceContextInput?: unknown,
): {
  rawText: string;
  mode: TextAnalysisMode;
  intelligenceModeId: IntelligenceModeId;
  modeRouting: ModeRoutingResult;
  sourceHint?: AnalysisSourceHint;
  sourceContext?: AnalyzeSourceContext;
} {
  if (typeof rawText !== "string") {
    throw new AnalysisInputError(USER_MESSAGES.analyzeInputEmpty);
  }

  const trimmed = rawText.trim();

  if (!trimmed) {
    throw new AnalysisInputError(USER_MESSAGES.analyzeInputEmpty);
  }

  if (trimmed.length < AI_CONFIG.input.minChars) {
    throw new AnalysisInputError(
      USER_MESSAGES.analyzeInputTooShort(AI_CONFIG.input.minChars),
    );
  }

  if (trimmed.length > ABSOLUTE_MAX_PASTE_CHARS) {
    throw new AnalysisInputError(USER_MESSAGES.analyzeInputTooLong());
  }

  if (typeof mode !== "string" || !mode.trim()) {
    throw new AnalysisInputError(USER_MESSAGES.analyzeModeRequired);
  }

  let modeRouting: ModeRoutingResult;
  try {
    modeRouting = resolveModeRouting(mode.trim());
  } catch {
    throw new AnalysisInputError(USER_MESSAGES.analyzeModeUnknown);
  }

  const sourceHint = parseSourceHint(sourceHintInput);
  const sourceContext = parseAnalyzeSourceContext(sourceContextInput, sourceHint);

  return {
    rawText: trimmed,
    mode: modeRouting.backendFamily,
    intelligenceModeId: modeRouting.intelligenceModeId,
    modeRouting,
    sourceHint,
    sourceContext,
  };
}
