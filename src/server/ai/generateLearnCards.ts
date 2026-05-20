/**
 * SERVER ONLY — dedicated AI call for learn / practice flashcards.
 */

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "./config";
import {
  buildLearnCardGenerationSystemPrompt,
  buildLearnCardGenerationUserPrompt,
  resolveLearnContentType,
} from "./learnCardGenerationPrompt";
import { parseLearnCardsGenerationResponse } from "./parseLearnCardsResponse";
import type { LearnCardOutput } from "./schemas";
import type { AnalysisProviderName } from "./analysis-failure";
import { devWarn } from "@/server/logging";

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

async function callGroqLearnCards(system: string, user: string): Promise<string> {
  const client = getGroqClient();
  const completion = await client.chat.completions.create(
    {
      model: AI_CONFIG.providers.groq.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxOutputTokens,
      response_format: { type: "json_object" },
    },
    { timeout: AI_CONFIG.timeoutMs },
  );
  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) throw new Error("Groq returned an empty learn-card response.");
  return content;
}

async function callGeminiLearnCards(system: string, user: string): Promise<string> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: AI_CONFIG.providers.gemini.model,
    contents: [{ role: "user", parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxOutputTokens,
      responseMimeType: "application/json",
    },
  });
  const text = response.text;
  if (!text?.trim()) throw new Error("Gemini returned an empty learn-card response.");
  return text;
}

export type GenerateLearnCardsInput = {
  provider: AnalysisProviderName;
  content: string;
  cardCount: number;
  language?: string;
  contentType: string;
  documentTitle?: string;
  maxCards?: number;
};

/**
 * Generate learn cards via the precision extraction prompt (Groq or Gemini).
 */
export async function generateLearnCardsFromContent(
  input: GenerateLearnCardsInput,
): Promise<LearnCardOutput[]> {
  const cardCount = Math.max(4, Math.min(12, input.cardCount));
  const system = buildLearnCardGenerationSystemPrompt(cardCount);
  const user = buildLearnCardGenerationUserPrompt({
    contentType: input.contentType,
    language: input.language ?? "English",
    cardCount,
    content: input.content.slice(0, AI_CONFIG.input.maxChars),
  });

  const raw =
    input.provider === "groq"
      ? await callGroqLearnCards(system, user)
      : await callGeminiLearnCards(system, user);

  return parseLearnCardsGenerationResponse(raw, {
    documentTitle: input.documentTitle,
    maxCards: input.maxCards ?? cardCount,
  });
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
};

export async function generateLearnCardsForAnalysis(
  ctx: GenerateLearnCardsContext,
): Promise<LearnCardOutput[]> {
  try {
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
