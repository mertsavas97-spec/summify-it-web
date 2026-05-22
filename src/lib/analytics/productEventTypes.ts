/** High-value product events stored in `usage_events` (server-side only). */
export const PRODUCT_EVENT_TYPES = [
  "analysis_completed",
  "analysis_failed",
  "learn_started",
  "learn_completed",
  "quiz_started",
  "quiz_completed",
  "audio_study_script_generated",
  "audio_study_played",
  "audio_study_completed",
  "upgrade_clicked",
  "checkout_started",
  "subscription_changed",
] as const;

export type ProductEventType = (typeof PRODUCT_EVENT_TYPES)[number];

const PRODUCT_EVENT_SET = new Set<string>(PRODUCT_EVENT_TYPES);

export function isProductEventType(value: string): value is ProductEventType {
  return PRODUCT_EVENT_SET.has(value);
}
