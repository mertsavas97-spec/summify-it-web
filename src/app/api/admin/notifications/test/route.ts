import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { sendPushoverAlert, sendSlackAlert } from "@/server/alerts/notifiers";

type NotificationMissingConfigCode =
  | "slack_not_configured"
  | "pushover_not_configured"
  | "notifications_not_configured";

function getEnvLabel(): string | null {
  const raw =
    process.env.VERCEL_ENV ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    null;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed ? trimmed : null;
}

function buildMessage(): { title: string; summary: string } {
  const timestamp = new Date().toISOString();
  const env = getEnvLabel();
  const contextBits = [env ? `env=${env}` : null, `time=${timestamp}`].filter(Boolean);
  const suffix = contextBits.length ? ` (${contextBits.join(", ")})` : "";

  return {
    title: "Summify test notification",
    summary: `Summify test notification${suffix}`,
  };
}

/**
 * POST /api/admin/notifications/test
 *
 * Admin-only endpoint that sends a test notification to Slack + Pushover.
 * Never returns secret values.
 */
export async function POST() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, summary } = buildMessage();
  const alert = {
    key: "deployment_health_failure" as const,
    title,
    severity: "info" as const,
    summary,
    slackEmoji: ":bell:",
    pushoverTitle: title,
    context: undefined,
  };

  const [slackOk, pushoverOk] = await Promise.all([
    sendSlackAlert(alert),
    sendPushoverAlert(alert),
  ]);

  if (!slackOk || !pushoverOk) {
    let code: NotificationMissingConfigCode = "notifications_not_configured";
    if (!slackOk && pushoverOk) code = "slack_not_configured";
    if (slackOk && !pushoverOk) code = "pushover_not_configured";

    return NextResponse.json(
      {
        ok: false,
        error: "Notification delivery failed (missing config or provider error).",
        code,
        providers: {
          slack: { ok: slackOk },
          pushover: { ok: pushoverOk },
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
