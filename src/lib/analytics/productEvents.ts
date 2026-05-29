export const PRODUCT_EVENTS = {
  // Acquisition
  landing_view: "landing_view",
  upload_page_view: "upload_page_view",
  pricing_view: "pricing_view",
  login_view: "login_view",

  // Product
  upload_started: "upload_started",
  upload_completed: "upload_completed",
  analysis_started: "analysis_started",
  analysis_completed: "analysis_completed",

  // Engagement
  learn_card_opened: "learn_card_opened",
  insight_opened: "insight_opened",
  audio_mode_clicked: "audio_mode_clicked",
  podcast_clicked: "podcast_clicked",

  // Conversion
  signup_started: "signup_started",
  signup_completed: "signup_completed",
  upgrade_clicked: "upgrade_clicked",
  checkout_started: "checkout_started",
  subscription_created: "subscription_created",
} as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

const PRODUCT_EVENT_SET = new Set<string>(Object.values(PRODUCT_EVENTS));

export function isProductEventName(value: string): value is ProductEventName {
  return PRODUCT_EVENT_SET.has(value);
}
