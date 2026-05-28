import { devLog, devWarn } from "@/server/logging";
import { sendPushoverAlert, sendSlackAlert } from "@/server/alerts/notifiers";

type InternalNotifyBase = {
  /** A short title that appears in Slack/Pushover. */
  title: string;
  /** One-line summary (no sensitive content). */
  summary: string;
  /** Slack emoji prefix (internal-only). */
  slackEmoji: string;
  /** Pushover title (short). */
  pushoverTitle: string;
  /** Extra slack context lines (metadata only). */
  context?: Record<string, string | number | boolean | null | undefined>;
};

const INTERNAL_EMAILS_TO_SKIP = new Set(
  [
    "mertsavas97@gmail.com",
    "mert@075collective.com",
    "mert.savas@college.com.tr",
  ].map((e) => e.toLowerCase()),
);

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
  return trimmed.includes("@") ? trimmed : null;
}

export function shouldSkipInternalNotificationsForEmail(
  email: string | null | undefined,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return INTERNAL_EMAILS_TO_SKIP.has(normalized);
}

function formatSlackSummary(input: InternalNotifyBase): string {
  const contextLines = input.context
    ? Object.entries(input.context)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `*${k}:* ${v === null ? "—" : String(v)}`)
    : [];

  return [input.summary, ...contextLines].filter(Boolean).join("\n");
}

/**
 * Best-effort internal notification. Never throws, never blocks.
 *
 * NOTE: We reuse the existing `alerts/*` webhook delivery so we don't create a parallel system.
 */
export function notifyInternalNonBlocking(
  input: InternalNotifyBase,
): void {
  void (async () => {
    try {
      const summary = formatSlackSummary(input);

      // Reuse AlertCandidate shape even though this isn't a periodic alert.
      const slackOk = await sendSlackAlert({
        key: "deployment_health_failure",
        title: input.title,
        severity: "info",
        summary,
        slackEmoji: input.slackEmoji,
        pushoverTitle: input.pushoverTitle,
        context: undefined,
      });

      const pushoverOk = await sendPushoverAlert({
        key: "deployment_health_failure",
        title: input.title,
        severity: "info",
        summary: input.summary,
        slackEmoji: input.slackEmoji,
        pushoverTitle: input.pushoverTitle,
        context: undefined,
      });

      devLog("[summify.internal_notify] delivered", {
        slackOk,
        pushoverOk,
        title: input.title,
      });
    } catch (err) {
      devWarn("[summify.internal_notify] failed", {
        message: err instanceof Error ? err.message : String(err),
        title: input.title,
      });
    }
  })();
}
