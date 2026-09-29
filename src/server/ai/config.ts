/**
 * Server-only AI configuration.
 * API keys are read from process.env in provider modules — never expose to the client.
 */

export const AI_CONFIG = {
  providers: {
    groq: {
      name: "groq" as const,
      /**
       * Primary analysis model on Groq.
       * `llama-3.3-70b-versatile` was shut down 2026-08-16; Groq recommends
       * `openai/gpt-oss-120b` (or `qwen/qwen3.6-27b`) as replacement.
       */
      model: "openai/gpt-oss-120b",
    },
    gemini: {
      name: "gemini" as const,
      /** Flash tier for fallback — lower latency and cost */
      model: "gemini-2.0-flash",
    },
  },
  /**
   * Room for a long source: several summary paragraphs plus up to 12 insights.
   * Short sources still stop once the JSON is complete.
   */
  maxOutputTokens: 4096,
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
