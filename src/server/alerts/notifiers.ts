import { getAlertWebhookUrl, getPushoverConfig } from "./config";
import type { AlertCandidate } from "./types";

function formatTimestamp(): string {
  return new Date().toISOString();
}

export async function sendSlackAlert(alert: AlertCandidate): Promise<boolean> {
  const webhookUrl = getAlertWebhookUrl();
  if (!webhookUrl) return false;

  const contextBits = [
    alert.context?.provider ? `*Provider:* ${alert.context.provider}` : null,
    alert.context?.operation ? `*Operation:* ${alert.context.operation}` : null,
    alert.context?.timeframe ? `*Window:* ${alert.context.timeframe}` : null,
    typeof alert.context?.observed === "number" ? `*Observed:* ${alert.context.observed}` : null,
    typeof alert.context?.threshold === "number" ? `*Threshold:* ${alert.context.threshold}` : null,
    alert.context?.details ? `*Details:* ${alert.context.details}` : null,
    alert.context?.url ? `*Link:* ${alert.context.url}` : null,
  ].filter(Boolean);

  const text = [
    `${alert.slackEmoji} *${alert.title}*`,
    `*Severity:* ${alert.severity.toUpperCase()}`,
    alert.summary,
    ...contextBits,
    `*Timestamp:* ${formatTimestamp()}`,
  ].join("\n");

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return res.ok;
}

export async function sendSlackAlertWithDebug(alert: AlertCandidate): Promise<{
  ok: boolean;
  status: number | null;
  responseText: string;
  missingWebhookUrl: boolean;
}> {
  const webhookUrl = getAlertWebhookUrl();
  if (!webhookUrl) {
    return {
      ok: false,
      status: null,
      responseText: "Slack webhook URL is missing. Expected SLACK_ALERT_WEBHOOK_URL.",
      missingWebhookUrl: true,
    };
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "[Summify Alert Test] Slack delivery test from production." }),
  });

  return {
    ok: res.ok,
    status: res.status,
    responseText: await res.text(),
    missingWebhookUrl: false,
  };
}

export async function sendPushoverAlert(alert: AlertCandidate): Promise<boolean> {
  const { token, user } = getPushoverConfig();
  if (!token || !user) return false;

  const message = `${alert.title}: ${alert.summary}`.slice(0, 512);
  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token,
      user,
      title: alert.pushoverTitle.slice(0, 250),
      message,
      priority: alert.severity === "critical" ? "1" : "0",
    }),
  });

  return res.ok;
}

export async function sendPushoverAlertWithDebug(alert?: AlertCandidate): Promise<{
  ok: boolean;
  status: number | null;
  responseText: string;
  tokenPresent: boolean;
  userPresent: boolean;
}> {
  const { token, user } = getPushoverConfig();
  const tokenPresent = Boolean(token);
  const userPresent = Boolean(user);

  if (!tokenPresent || !userPresent) {
    return {
      ok: false,
      status: null,
      responseText: !tokenPresent
        ? "PUSHOVER_APP_TOKEN is missing."
        : "PUSHOVER_USER_KEY is missing.",
      tokenPresent,
      userPresent,
    };
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: token!,
      user: user!,
      title: "Summify Alert Test",
      message: "[Summify Alert Test] Pushover delivery test from production.",
    }),
  });

  return {
    ok: res.ok,
    status: res.status,
    responseText: await res.text(),
    tokenPresent,
    userPresent,
  };
}
