/**
 * Provider adapters (OpenAI, Groq, Gemini, OpenRouter) will live here.
 * Each adapter: health check, rate limits, structured output schema.
 *
 * TODO: implement ProviderAdapter interface + fallback chain executor.
 */

export type { ProviderName, ProviderRoute } from "@/core/types";
