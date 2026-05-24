export function getAlertWebhookUrl(): string | null {
  return process.env.ALERTS_SLACK_WEBHOOK_URL ?? process.env.SLACK_WEBHOOK_URL ?? null;
}

export function getPushoverConfig(): { token: string | null; user: string | null } {
  return {
    token: process.env.PUSHOVER_APP_TOKEN ?? null,
    user: process.env.PUSHOVER_USER_KEY ?? null,
  };
}

export function getAlertCooldownMinutes(): number {
  const value = Number(process.env.ALERTS_COOLDOWN_MINUTES ?? "60");
  return Number.isFinite(value) && value > 0 ? value : 60;
}

