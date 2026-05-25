import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { getApiHealth } from "@/server/admin/getApiHealth";
import { evaluateAndDispatchAlerts } from "@/server/alerts/evaluate";
import { sendPushoverAlertWithDebug, sendSlackAlertWithDebug } from "@/server/alerts/notifiers";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getPushoverConfig, getAlertWebhookUrl } from "@/server/alerts/config";
import type { AlertCandidate } from "@/server/alerts/types";

async function getRecentAnalysisTime(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("usage_events")
    .select("created_at")
    .eq("event_type", "analysis_completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.created_at ?? null;
}

function createTestAlert(
  severity: AlertCandidate["severity"],
  title: string,
  summary: string,
  key: AlertCandidate["key"],
): AlertCandidate {
  return {
    key,
    title: `[Summify Alert Test] ${title}`,
    summary: `[Summify Alert Test] ${summary}`,
    severity,
    slackEmoji: severity === "critical" ? "🚨" : "🧪",
    pushoverTitle: `[Summify Alert Test] ${title}`,
    context: {
      details: "Manual delivery verification only. This alert is not persisted or treated as a real incident.",
    },
  };
}

async function runManualTestMode(testMode: string) {
  const errors: string[] = [];
  const sent = { slack: false, pushover: false };
  const debug: Record<string, unknown> = {};

  const slackEnvPresent = Boolean(getAlertWebhookUrl());
  const pushoverAppTokenPresent = Boolean(process.env.PUSHOVER_APP_TOKEN);
  const pushoverUserKeyPresent = Boolean(process.env.PUSHOVER_USER_KEY);

  const slackAlert = createTestAlert("warning", "Slack delivery check", "Slack webhook test message.", "deployment_health_failure");
  const pushoverAlert = createTestAlert("critical", "Pushover delivery check", "Pushover delivery test message.", "deployment_health_failure");

  try {
    if (testMode === "slack") {
      const slackResult = await sendSlackAlertWithDebug(slackAlert);
      sent.slack = slackResult.ok;
      debug.slackEnvPresent = slackEnvPresent;
      debug.slackStatus = slackResult.status;
      debug.slackResponse = slackResult.responseText;
      if (!slackResult.ok) {
        errors.push(slackResult.missingWebhookUrl ? slackResult.responseText : "Slack test delivery failed.");
      }
    }

    if (testMode === "pushover") {
      const pushoverResult = await sendPushoverAlertWithDebug();
      sent.pushover = pushoverResult.ok;
      debug.pushoverAppTokenPresent = pushoverResult.tokenPresent;
      debug.pushoverUserKeyPresent = pushoverResult.userPresent;
      debug.pushoverStatus = pushoverResult.status;
      debug.pushoverResponse = pushoverResult.responseText;
      if (!pushoverResult.ok) {
        errors.push(pushoverResult.responseText || "Pushover test delivery failed.");
      }
    }

    if (testMode === "critical") {
      const slackResult = await sendSlackAlertWithDebug(slackAlert);
      const pushoverResult = await sendPushoverAlertWithDebug();

      sent.slack = slackResult.ok;
      sent.pushover = pushoverResult.ok;

      debug.slackEnvPresent = slackEnvPresent;
      debug.slackStatus = slackResult.status;
      debug.slackResponse = slackResult.responseText;
      debug.pushoverAppTokenPresent = pushoverResult.tokenPresent;
      debug.pushoverUserKeyPresent = pushoverResult.userPresent;
      debug.pushoverStatus = pushoverResult.status;
      debug.pushoverResponse = pushoverResult.responseText;

      if (!slackResult.ok) errors.push(slackResult.missingWebhookUrl ? slackResult.responseText : "Slack test delivery failed.");
      if (!pushoverResult.ok) errors.push(pushoverResult.responseText || "Pushover test delivery failed.");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown test delivery error.");
  }

  return {
    ok: errors.length === 0,
    test: testMode,
    sent,
    debug,
    errors,
  };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const querySecret = request.nextUrl.searchParams.get("secret");
  const authorization = request.headers.get("authorization") ?? null;
  const bearerToken = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : authorization;
  const providedSecret = querySecret ?? bearerToken;

  if (!cronSecret || providedSecret !== cronSecret) {
    try {
      await requireAdminSession();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const testMode = request.nextUrl.searchParams.get("test");
  if (testMode === "slack" || testMode === "pushover" || testMode === "warning" || testMode === "critical") {
    const result = await runManualTestMode(testMode);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  const health = await getApiHealth();
  const recentAnalysesAt = await getRecentAnalysisTime();
  const deploymentHealthy = Boolean(process.env.VERCEL ?? process.env.VERCEL_URL) || Boolean(getAlertWebhookUrl()) || Boolean(getPushoverConfig().token);
  const result = await evaluateAndDispatchAlerts({
    usage: health.providers.map((p) => ({
      provider: p.config.provider,
      callsToday: p.usage?.callsToday ?? 0,
      calls7d: p.usage?.calls7d ?? 0,
      failures7d: p.usage?.failures7d ?? 0,
      estimatedMonthlyCostUsd: p.usage?.estimatedMonthlyCostUsd ?? null,
      lastSuccess: p.usage?.lastSuccess ?? null,
      lastError: p.usage?.lastError ?? null,
    })),
    recentAnalysesAt,
    deploymentHealthy,
  });

  return NextResponse.json({ ok: true, health, alerts: result });
}
