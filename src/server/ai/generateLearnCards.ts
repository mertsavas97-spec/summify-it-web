/**
 * SERVER ONLY — two-phase learn / practice flashcards (inventory → cards).
 */

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { STUDY_CARD_BRIEF, studyCardCorpus } from "@/lib/learn/studyCardSource";
import { getLearningOutputLanguageLabel } from "@/lib/learning/normalizeLearningLanguage";
import { AI_CONFIG } from "./config";
import {
  PHASE1_FACT_INVENTORY_SYSTEM,
  factInventoryItemCount,
  groundFactInventoryToSource,
  inferInventoryDomainHint,
  isFactInventoryUsable,
  parseFactInventoryResponse,
  type FactInventory,
} from "./factInventory";
import {
  PHASE2_FLASHCARD_SYSTEM,
  buildPhase2FlashcardUserPrompt,
  resolveLearnContentType,
} from "./learnCardGenerationPrompt";
import {
  countRawCardsInGenerationResponse,
  parseLearnCardsGenerationResponse,
} from "./parseLearnCardsResponse";
import { filterLearnCardsAgainstInventory } from "./groundLearnCardsToInventory";
import type { LearnCardOutput } from "./schemas";
import type { AnalysisProviderName } from "./analysis-failure";
import { devLog, devWarn } from "@/server/logging";

const PHASE1_MAX_TOKENS = 2000;

function phase1TokenBudget(contentChars: number): number {
  if (contentChars >= 18_000) return 6000;
  if (contentChars >= 8_000) return 3600;
  return PHASE1_MAX_TOKENS;
}

/**
 * `openai/gpt-oss-120b` is a reasoning model: reasoning tokens are drawn from
 * `max_tokens`. A tight budget lets the reasoning phase consume everything and
 * the API returns an empty `content` (Groq then reports `json_validate_failed`
 * with an empty `failed_generation`). Keep generous headroom.
 */
function phase2TokenBudget(cardCount: number): number {
  return Math.min(8192, Math.max(2400, cardCount * 400));
}

type GroqFailureKind = "empty" | "json_invalid" | "unsupported" | "rate_limit" | "other";

function classifyGroqFailure(error: unknown): GroqFailureKind {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  if (status === 429) return "rate_limit";
  if (message.includes("json_validate_failed")) return "json_invalid";
  if (message.includes("unsupported")) return "unsupported";
  if (message.includes("empty response")) return "empty";
  return "other";
}

/** Reasoning models burn `max_tokens` on reasoning and can return empty content. */
function groqCompletionOptions(): { reasoning_effort?: "low" } {
  return AI_CONFIG.providers.groq.model.includes("gpt-oss")
    ? { reasoning_effort: "low" }
    : {};
}

const PHASE1_FACT_INVENTORY_USER_RULES = `IMPORTANT: Do not stop after people and dates. Also fill events, causes, numbers, and contrasts whenever the text states them. A long source needs those rows; names and years alone are not enough.
Write all inventory entries in English.
For Turkish or other non-English sources:
- "3 Temmuz süreci" or "3 Temmuz kumpası" → "the July 3, 2011 match-fixing investigations"
- "kuruluş yıldönümü" → "founding anniversary" or "centenary"
- "şike" → "match-fixing allegations"
- "kumpas" → "alleged conspiracy" or "politically charged investigation"
- "kurşunlanma" → "armed attack"
- "şampiyonluk" → "league title" or "championship"
- Do not leave any Turkish or other non-English words in the inventory output unless they are proper nouns.`;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
  return new Groq({ apiKey });
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenAI({ apiKey });
}

async function requestGroqJson(
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean,
): Promise<string> {
  const client = getGroqClient();
  const completion = await client.chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
      ...groqCompletionOptions(),
    },
    { timeout: AI_CONFIG.timeoutMs },
  );
  const choice = completion.choices[0];
  const content = choice?.message?.content;
  if (!content?.trim()) {
    const reason = choice?.finish_reason ?? "unknown";
    const reasoningTokens =
      completion.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    throw new Error(
      `Groq returned an empty response (finish_reason=${reason}, reasoning_tokens=${reasoningTokens}).`,
    );
  }
  return content;
}

/**
 * Groq/gpt-oss failure modes are retryable, so walk a small ladder:
 * JSON mode → plain mode → JSON mode again (temperature 0.3 makes repeats useful).
 * Rate limits and unsupported parameters are not fixed by re-asking.
 */
async function callGroqJson(system: string, user: string, maxTokens: number): Promise<string> {
  const ladder: readonly boolean[] = [true, false, true];
  let lastError: unknown;

  for (let attempt = 0; attempt < ladder.length; attempt += 1) {
    const jsonMode = ladder[attempt];
    try {
      return await requestGroqJson(system, user, maxTokens, jsonMode);
    } catch (error) {
      lastError = error;
      const kind = classifyGroqFailure(error);
      devWarn("[summify.learnCards] groq attempt failed", {
        attempt: attempt + 1,
        jsonMode,
        kind,
        message: error instanceof Error ? error.message : String(error),
      });
      if (kind === "rate_limit") break;
      if (kind === "unsupported") break;
      if (attempt === ladder.length - 1) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function callGeminiJson(system: string, user: string, maxTokens: number): Promise<string> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: AI_CONFIG.providers.gemini.model,
    contents: [{ role: "user", parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Gemini returned an empty response.");
  return text;
}

async function callProviderJson(
  provider: AnalysisProviderName,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  return provider === "groq"
    ? callGroqJson(system, user, maxTokens)
    : callGeminiJson(system, user, maxTokens);
}

async function extractFactInventory(
  provider: AnalysisProviderName,
  content: string,
): Promise<FactInventory | null> {
  const userContent = content.trim();
  const userPrompt = `${PHASE1_FACT_INVENTORY_USER_RULES}\n\nCONTENT:\n${userContent}`;
  try {
    const raw = await callProviderJson(
      provider,
      PHASE1_FACT_INVENTORY_SYSTEM,
      userPrompt,
      phase1TokenBudget(userContent.length),
    );
    const parsed = parseFactInventoryResponse(raw);
    return groundFactInventoryToSource(parsed, userContent);
  } catch (error) {
    devWarn("[summify.learnCards] phase1 inventory failed", {
      provider,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

type FlashcardPassInput = {
  provider: AnalysisProviderName;
  inventory: FactInventory;
  cardCount: number;
  language: string;
  documentTitle?: string;
  maxCards?: number;
  strategyHint?: string;
  cardBrief?: string;
  /** Written summary — depth context, never copied verbatim into cards. */
  summary?: string;
  /** Bounded source excerpt so answers can explain mechanism, cause, and implication. */
  sourceExcerpt?: string;
};

async function generateFlashcardsFromInventory(
  input: FlashcardPassInput,
): Promise<LearnCardOutput[]> {
  const user = buildPhase2FlashcardUserPrompt({
    cardCount: input.cardCount,
    language: input.language,
    inventory: input.inventory,
    domainHint: inferInventoryDomainHint(input.inventory),
    strategyHint: input.strategyHint,
    cardBrief: input.cardBrief,
    summary: input.summary,
    sourceExcerpt: input.sourceExcerpt,
  });

  const raw = await callProviderJson(
    input.provider,
    PHASE2_FLASHCARD_SYSTEM,
    user,
    phase2TokenBudget(input.cardCount),
  );

  const rawCardCount = countRawCardsInGenerationResponse(raw);
  const parsed = parseLearnCardsGenerationResponse(raw, {
    documentTitle: input.documentTitle,
    maxCards: input.maxCards ?? input.cardCount,
  });
  const cards = filterLearnCardsAgainstInventory(parsed, input.inventory);

  devLog("[summify.learnCards] phase2 complete", {
    provider: input.provider,
    requestedCardCount: input.cardCount,
    rawCardCount,
    passedParserCount: parsed.length,
    groundedCardCount: cards.length,
    domainHint: inferInventoryDomainHint(input.inventory),
  });

  return cards;
}

function logPhase1Inventory(
  provider: AnalysisProviderName,
  inventory: FactInventory | null,
): void {
  if (!inventory) {
    devLog("[summify.learnCards] phase1 complete", {
      provider,
      usable: false,
      reason: "no_inventory",
    });
    return;
  }

  const counts = {
    people: inventory.people.length,
    dates: inventory.dates.length,
    numbers: inventory.numbers.length,
    events: inventory.events.length,
    causes: inventory.causes.length,
    contrasts: inventory.contrasts.length,
    definitions: inventory.definitions.length,
    formulas: inventory.formulas.length,
    steps: inventory.steps.length,
    total: factInventoryItemCount(inventory),
  };

  devLog("[summify.learnCards] phase1 complete", {
    provider,
    usable: isFactInventoryUsable(inventory),
    counts,
  });
}

export type GenerateLearnCardsInput = {
  provider: AnalysisProviderName;
  content: string;
  /** Written summary. Phase 1 reads this together with the source. */
  summary?: string;
  cardCount: number;
  language?: string;
  contentType: string;
  documentTitle?: string;
  maxCards?: number;
  strategyHint?: string;
};

/**
 * Phase 1 inventory → Phase 2 flashcards (Groq or Gemini).
 * Returns [] if inventory has zero facts or Phase 1 fails — no source-text fallback.
 */
/** Bounded source slice for phase 2 depth — enough to explain, small enough to stay cheap. */
const PHASE2_EXCERPT_CHARS = 6000;

function excerptForCards(source: string): string | undefined {
  const text = source.trim();
  if (!text) return undefined;
  return text.length <= PHASE2_EXCERPT_CHARS
    ? text
    : text.slice(0, PHASE2_EXCERPT_CHARS);
}

export async function generateLearnCardsFromContent(
  input: GenerateLearnCardsInput,
): Promise<LearnCardOutput[]> {
  const cardCount = Math.max(4, Math.min(30, Math.round(input.cardCount)));
  const content = studyCardCorpus(input.summary, input.content);
  const language = input.language ?? getLearningOutputLanguageLabel();
  const sharedPass = {
    cardCount,
    language,
    documentTitle: input.documentTitle,
    maxCards: input.maxCards ?? cardCount,
    strategyHint: input.strategyHint,
    cardBrief: STUDY_CARD_BRIEF,
    summary: input.summary,
    sourceExcerpt: excerptForCards(input.content),
  };

  let inventory = await extractFactInventory(input.provider, content);
  logPhase1Inventory(input.provider, inventory);
  if ((!inventory || !isFactInventoryUsable(inventory)) && input.provider === "groq") {
    devWarn("[summify.learnCards] phase1 unusable on groq, retrying with gemini", {
      reason: inventory ? "not_usable" : "no_inventory",
    });
    inventory = await extractFactInventory("gemini", content);
    logPhase1Inventory("gemini", inventory);
  }
  if (!inventory || !isFactInventoryUsable(inventory)) {
    return [];
  }

  try {
    return await generateFlashcardsFromInventory({
      ...sharedPass,
      provider: input.provider,
      inventory,
    });
  } catch (error) {
    if (input.provider !== "groq") throw error;
    devWarn("[summify.learnCards] phase2 failed on groq, retrying with gemini", {
      message: error instanceof Error ? error.message : String(error),
    });
    return generateFlashcardsFromInventory({
      ...sharedPass,
      provider: "gemini",
      inventory,
    });
  }
}

export type GenerateLearnCardsContext = {
  provider: AnalysisProviderName;
  compactedContent: string;
  summary?: string;
  cardCount: number;
  maxCards?: number;
  documentTitle?: string;
  isYoutube?: boolean;
  isPresentation?: boolean;
  isWebArticle?: boolean;
  documentTypeGuess?: string;
  analysisMode?: string;
  /** Adaptive plan learn strategy — preferred over mode-only hint. */
  strategyHint?: string;
};

/**
 * Separate card pass. Phase 1 reads the written summary and the analysis source.
 * Phase 2 writes cards for the lens and the preferred card types.
 */
export async function generateLearnCardsForAnalysis(
  ctx: GenerateLearnCardsContext,
): Promise<LearnCardOutput[]> {
  try {
    const strategyHint =
      ctx.strategyHint ??
      (ctx.analysisMode
        ? `Analysis mode: ${ctx.analysisMode}. Prefer cards that match this lens.`
        : undefined);
    const cards = await generateLearnCardsFromContent({
      provider: ctx.provider,
      content: ctx.compactedContent,
      summary: ctx.summary,
      cardCount: ctx.cardCount,
      contentType: resolveLearnContentType({
        isYoutube: ctx.isYoutube,
        isPresentation: ctx.isPresentation,
        isWebArticle: ctx.isWebArticle,
        documentTypeGuess: ctx.documentTypeGuess,
      }),
      documentTitle: ctx.documentTitle,
      maxCards: ctx.maxCards ?? ctx.cardCount,
      strategyHint,
    });
    return cards;
  } catch (error) {
    devWarn("[summify.learnCards] dedicated generation failed", {
      provider: ctx.provider,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
