import { getAlertWebhookUrl, getPushoverConfig } from "@/server/alerts/config";
import { sendPushoverAlert, sendSlackAlert } from "@/server/alerts/notifiers";

export type NotificationProviderId = "slack" | "pushover";

export type TestNotificationPayload = {
  title: string;
  body: string;
  /** Safe metadata only (no secrets). */
  metadata: Record<string, string>;
};

export type NotificationProvider = {
  id: NotificationProviderId;
  label: string;
  isConfigured: () => boolean;
  sendTestNotification: (payload: TestNotificationPayload) => Promise<boolean>;
  sendOperationalNotification?: (payload: TestNotificationPayload) => Promise<boolean>;
};

function safeFormatSummary(payload: TestNotificationPayload): string {
  const metaLines = Object.entries(payload.metadata)
    .filter(([, v]) => typeof v === "string" && v.trim().length > 0)
    .map(([k, v]) => `${k}=${v}`);

  const suffix = metaLines.length ? `\n\n${metaLines.join("\n")}` : "";
  return `${payload.body}${suffix}`;
}

export const notificationProviders: NotificationProvider[] = [
  {
    id: "slack",
    label: "Slack",
    isConfigured: () => Boolean(getAlertWebhookUrl()),
    sendTestNotification: async (payload) => {
      return sendSlackAlert({
        key: "deployment_health_failure",
        title: payload.title,
        severity: "info",
        summary: safeFormatSummary(payload),
        slackEmoji: ":bell:",
        pushoverTitle: payload.title,
        context: undefined,
      });
    },
  },
  {
    id: "pushover",
    label: "Pushover",
    isConfigured: () => {
      const { token, user } = getPushoverConfig();
      return Boolean(token && user);
    },
    sendTestNotification: async (payload) => {
      return sendPushoverAlert({
        key: "deployment_health_failure",
        title: payload.title,
        severity: "info",
        summary: safeFormatSummary(payload),
        slackEmoji: ":bell:",
        pushoverTitle: payload.title,
        context: undefined,
      });
    },
  },
];

export function getNotificationProviderById(
  id: NotificationProviderId,
): NotificationProvider | undefined {
  return notificationProviders.find((p) => p.id === id);
}
