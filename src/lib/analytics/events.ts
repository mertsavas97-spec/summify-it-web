import { isGaEnabled } from "@/lib/analytics/ga";

/** Canonical GA4 event names for growth and product funnels. */
export const ANALYTICS_EVENTS = {
  upload_started: "upload_started",
  analysis_completed: "analysis_completed",
  signup_started: "signup_started",
  signup_completed: "signup_completed",
  share_enabled: "share_enabled",
  share_opened: "share_opened",
  review_started: "review_started",
  review_completed: "review_completed",
  pricing_opened: "pricing_opened",
  upgrade_modal_opened: "upgrade_modal_opened",
  guide_cta_clicked: "guide_cta_clicked",
  podcast_cta_viewed: "podcast_cta_viewed",
  podcast_cta_clicked: "podcast_cta_clicked",
  podcast_ineligible_shown: "podcast_ineligible_shown",
  podcast_audio_played: "podcast_audio_played",
  podcast_saved_to_workspace: "podcast_saved_to_workspace",
  podcast_download_mp3: "podcast_download_mp3",
  podcast_share: "podcast_share",
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export type AnalyticsEventParams = {
  upload_started?: {
    source_type?: string;
    trigger?: "file" | "url" | "text" | "analyze";
  };
  analysis_completed?: {
    mode?: string;
    source_kind?: string;
    saved_to_workspace?: boolean;
  };
  signup_started?: {
    method?: "password" | "magic_link" | "google";
    intent?: "sign_in" | "sign_up";
  };
  signup_completed?: {
    method?: "password" | "magic_link" | "google";
  };
  share_enabled?: {
    analysis_id?: string;
  };
  share_opened?: {
    share_id?: string;
    source_kind?: string;
  };
  review_started?: {
    item_count?: number;
  };
  review_completed?: {
    reviewed_count?: number;
  };
  pricing_opened?: {
    surface?: string;
  };
  upgrade_modal_opened?: {
    mode_id?: string;
    mode_label?: string;
  };
  guide_cta_clicked?: {
    surface?: string;
    href?: string;
    label?: string;
  };
  podcast_cta_viewed?: {
    state?: "no_source" | "pending" | "eligible" | "ineligible";
    plan?: string;
  };
  podcast_cta_clicked?: {
    state?: "no-source" | "pending" | "eligible" | "ineligible";
    plan?: string;
    locked?: boolean;
  };
  podcast_ineligible_shown?: {
    plan?: string;
    recommended_mode?: "audio-study" | "podcast";
  };
  podcast_audio_played?: {
    state?: "eligible";
  };
  podcast_saved_to_workspace?: {
    analysisId?: string;
  };
  podcast_download_mp3?: {
    analysisId?: string;
  };
  podcast_share?: {
    analysisId?: string;
  };
};

/**
 * Fire a GA4 custom event. Safe when GA is disabled, blocked, or throws.
 */
export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  params?: AnalyticsEventParams[E],
): void {
  if (typeof window === "undefined") return;
  if (!isGaEnabled()) return;

  try {
    const gtag = window.gtag;
    if (!gtag) return;
    gtag("event", ANALYTICS_EVENTS[event], params ?? {});
  } catch {
    // Never break UX for analytics failures.
  }
}
