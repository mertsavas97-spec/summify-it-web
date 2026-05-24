import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { getApiHealth } from "@/server/admin/getApiHealth";
import { evaluateAndDispatchAlerts } from "@/server/alerts/evaluate";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getPushoverConfig, getAlertWebhookUrl } from "@/server/alerts/config";

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

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authorization = request.headers.get("authorization") ?? null;
    const bearerToken = typeof authorization === "string" && authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : authorization;

    if (bearerToken !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    try {
      await requireAdminSession();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
