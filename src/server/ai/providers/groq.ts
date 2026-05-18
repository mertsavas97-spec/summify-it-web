/**
 * SERVER ONLY — uses GROQ_API_KEY from process.env.
 * Never import this module in client components.
 */

import Groq from "groq-sdk";
import { AI_CONFIG } from "../config";
import { buildSystemPrompt, buildUserPromptFromCompacted } from "../prompts";
import type { TextAnalysisMode } from "../schemas";
import type { AdaptiveAnalysisPlan } from "@/server/intelligence/types";

export class GroqProviderError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GroqProviderError";
    this.status = status;
  }
}

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqProviderError("GROQ_API_KEY is not configured on the server.");
  }
  return new Groq({ apiKey });
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: number }).status;
    return status === 429;
  }
  return false;
}

/**
 * Calls Groq chat completions and returns raw model text (expected JSON).
 */
export async function callGroqAnalysis(
  compactedUserPrompt: string,
  mode: TextAnalysisMode,
  adaptivePlan?: AdaptiveAnalysisPlan,
  promptOptions?: {
    isYoutubeTranscript?: boolean;
    isPresentation?: boolean;
    intelligenceModeLabel?: string;
    modePromptAdjunct?: string;
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
  });
  const userPrompt = buildUserPromptFromCompacted(compactedUserPrompt);

  try {
    const completion = await client.chat.completions.create(
      {
        model: AI_CONFIG.providers.groq.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxOutputTokens,
        response_format: { type: "json_object" },
      },
      { timeout: AI_CONFIG.timeoutMs },
    );

    const content = completion.choices[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new GroqProviderError("Groq returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error instanceof GroqProviderError) throw error;

    const message =
      error instanceof Error ? error.message : "Unknown Groq error";

    if (isRateLimitError(error)) {
      throw new GroqProviderError(`Groq rate limit: ${message}`, 429);
    }

    throw new GroqProviderError(`Groq request failed: ${message}`);
  }
}
