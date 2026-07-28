/**
 * SERVER ONLY — two-phase learn / practice flashcards (inventory → cards).
 */

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { getLearningOutputLanguageLabel } from "@/lib/learning/normalizeLearningLanguage";
import { CHUNKED_ANALYSIS_SEGMENT_CHARS } from "@/lib/plans/planLimits";
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
const PHASE2_MAX_TOKENS = 1000;

const PHASE1_FACT_INVENTORY_USER_RULES = `IMPORTANT: Write all inventory entries in English.
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

async function callGroqJson(system: string, user: string, maxTokens: number): Promise<string> {
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
      response_format: { type: "json_object" },
    },
    { timeout: AI_CONFIG.timeoutMs },
  );
  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) throw new Error("Groq returned an empty response.");
  return content;
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
  const userContent = content.slice(0, CHUNKED_ANALYSIS_SEGMENT_CHARS);
  const userPrompt = `${PHASE1_FACT_INVENTORY_USER_RULES}\n\nCONTENT:\n${userContent}`;
  try {
    const raw = await callProviderJson(
      provider,
      PHASE1_FACT_INVENTORY_SYSTEM,
      userPrompt,
      PHASE1_MAX_TOKENS,
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

async function generateFlashcardsFromInventory(
  provider: AnalysisProviderName,
  inventory: FactInventory,
  cardCount: number,
  language: string,
  documentTitle?: string,
  maxCards?: number,
  strategyHint?: string,
): Promise<LearnCardOutput[]> {
  const user = buildPhase2FlashcardUserPrompt({
    cardCount,
    language,
    inventory,
    domainHint: inferInventoryDomainHint(inventory),
    strategyHint,
  });

  const raw = await callProviderJson(
    provider,
    PHASE2_FLASHCARD_SYSTEM,
    user,
    PHASE2_MAX_TOKENS,
  );

  const rawCardCount = countRawCardsInGenerationResponse(raw);
  const parsed = parseLearnCardsGenerationResponse(raw, {
    documentTitle,
    maxCards: maxCards ?? cardCount,
  });
  const cards = filterLearnCardsAgainstInventory(parsed, inventory);

  devLog("[summify.learnCards] phase2 complete", {
    provider,
    requestedCardCount: cardCount,
    rawCardCount,
    passedParserCount: parsed.length,
    groundedCardCount: cards.length,
    domainHint: inferInventoryDomainHint(inventory),
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
export async function generateLearnCardsFromContent(
  input: GenerateLearnCardsInput,
): Promise<LearnCardOutput[]> {
  const cardCount = Math.max(4, Math.min(20, Math.round(input.cardCount)));
  const content = input.content.slice(0, CHUNKED_ANALYSIS_SEGMENT_CHARS);
  const language = input.language ?? getLearningOutputLanguageLabel();

  const inventory = await extractFactInventory(input.provider, content);
  logPhase1Inventory(input.provider, inventory);
  if (!inventory || !isFactInventoryUsable(inventory)) {
    return [];
  }

  return generateFlashcardsFromInventory(
    input.provider,
    inventory,
    cardCount,
    language,
    input.documentTitle,
    input.maxCards ?? cardCount,
    input.strategyHint,
  );
}

export type GenerateLearnCardsContext = {
  provider: AnalysisProviderName;
  compactedContent: string;
  cardCount: number;
  documentTitle?: string;
  isYoutube?: boolean;
  isPresentation?: boolean;
  isWebArticle?: boolean;
  documentTypeGuess?: string;
  analysisMode?: string;
  /** Adaptive plan learn strategy — preferred over mode-only hint. */
  strategyHint?: string;
};

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
      cardCount: ctx.cardCount,
      contentType: resolveLearnContentType({
        isYoutube: ctx.isYoutube,
        isPresentation: ctx.isPresentation,
        isWebArticle: ctx.isWebArticle,
        documentTypeGuess: ctx.documentTypeGuess,
      }),
      documentTitle: ctx.documentTitle,
      maxCards: ctx.cardCount,
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
