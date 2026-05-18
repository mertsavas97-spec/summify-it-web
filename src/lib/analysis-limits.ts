/** Client-safe input limits (must match src/server/ai/config.ts). */
export const AI_INPUT_LIMITS = {
  minChars: 100,
  maxChars: 24_000,
} as const;
