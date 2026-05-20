/**
 * SERVER ONLY — uses GEMINI_API_KEY from process.env.
 * Never import this module in client components.
 */

import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "../config";
import { buildSystemPrompt, buildUserPromptFromCompacted } from "../prompts";
import type { TextAnalysisMode } from "../schemas";
import type { AdaptiveAnalysisPlan } from "@/server/intelligence/types";

export class GeminiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiProviderError";
  }
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiProviderError(
      "GEMINI_API_KEY is not configured on the server.",
    );
  }
  return new GoogleGenAI({ apiKey });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new GeminiProviderError(`Gemini request timed out after ${ms}ms.`));
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

/**
 * Calls Gemini with the same prompt contract as Groq (system + user, JSON-only).
 */
export async function callGeminiAnalysis(
  compactedUserPrompt: string,
  mode: TextAnalysisMode,
  adaptivePlan?: AdaptiveAnalysisPlan,
  promptOptions?: {
    isYoutubeTranscript?: boolean;
    isPresentation?: boolean;
    intelligenceModeLabel?: string;
    modePromptAdjunct?: string;
    cognitionPromptBlock?: string;
  },
): Promise<string> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt(mode, {
    outputDepth: adaptivePlan?.outputDepth,
    learnDepth: adaptivePlan?.learnDepth,
    isYoutubeTranscript: promptOptions?.isYoutubeTranscript,
    isPresentation: promptOptions?.isPresentation,
    intelligenceModeLabel: promptOptions?.intelligenceModeLabel,
    modePromptAdjunct: promptOptions?.modePromptAdjunct,
    cognitionPromptBlock: promptOptions?.cognitionPromptBlock,
  });
  const userPrompt = buildUserPromptFromCompacted(compactedUserPrompt);

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: AI_CONFIG.providers.gemini.model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: AI_CONFIG.temperature,
          maxOutputTokens: AI_CONFIG.maxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
      AI_CONFIG.timeoutMs,
    );

    const text = response.text;
    if (!text || !text.trim()) {
      throw new GeminiProviderError("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    if (error instanceof GeminiProviderError) throw error;

    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    throw new GeminiProviderError(`Gemini request failed: ${message}`);
  }
}
