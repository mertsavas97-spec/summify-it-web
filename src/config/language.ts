/**
 * Product-wide language defaults.
 *
 * Summify’s learning/intelligence UX is English-only for now.
 * Models may read/understand sources in any language, but must always write
 * user-facing outputs in fluent native English unless we add explicit locale
 * support in the future.
 */

export const DEFAULT_OUTPUT_LANGUAGE = "English" as const;

export type DefaultOutputLanguage = typeof DEFAULT_OUTPUT_LANGUAGE;
