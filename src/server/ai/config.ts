/**
 * Server-only AI configuration.
 * API keys are read from process.env in provider modules — never expose to the client.
 */

export const AI_CONFIG = {
  providers: {
    groq: {
      name: "groq" as const,
      /** Cost-efficient Groq model with JSON-friendly output */
      model: "llama-3.3-70b-versatile",
    },
    gemini: {
      name: "gemini" as const,
      /** Flash tier for fallback — lower latency and cost */
      model: "gemini-2.0-flash",
    },
  },
  /** Conservative cap to control spend */
  maxOutputTokens: 2048,
  temperature: 0.3,
  /** Per-provider request timeout (ms) */
  timeoutMs: 45_000,
  input: {
    minChars: 100,
    /** ~6k words — adjust when billing tier is confirmed */
    maxChars: 24_000,
  },
} as const;

export type AiProviderName =
  (typeof AI_CONFIG.providers)[keyof typeof AI_CONFIG.providers]["name"];
