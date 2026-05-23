/**
 * API Health & Usage — Server-side data fetching for admin dashboard.
 *
 * Aggregates provider configuration status, usage rollups, and recent events.
 * Never exposes secrets — only safe boolean/aggregate data.
 */

import { createServiceClient } from "@/lib/supabase/serviceClient";
import type {
  ApiHealthResponse,
  ApiProvider,
  ProviderConfigStatus,
  ProviderUsageRollup,
  ProviderQuotaInfo,
  ApiUsageEvent,
} from "@/types/api-usage";

/** List of all tracked providers with their display names. */
const PROVIDERS: Array<{ id: ApiProvider; name: string; envVars: string[] }> = [
  { id: "groq", name: "Groq", envVars: ["GROQ_API_KEY"] },
  { id: "aws_polly", name: "AWS Polly", envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"] },
  { id: "rapidapi_youtube", name: "RapidAPI YouTube", envVars: ["RAPIDAPI_KEY", "RAPIDAPI_YOUTUBE_HOST"] },
  { id: "rapidapi_article", name: "RapidAPI Article", envVars: ["RAPIDAPI_KEY", "RAPIDAPI_ARTICLE_HOST"] },
  { id: "supabase", name: "Supabase", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
  { id: "netlify", name: "Netlify", envVars: ["NETLIFY_AUTH_TOKEN"] },
  { id: "openai", name: "OpenAI", envVars: ["OPENAI_API_KEY"] },
  { id: "ahrefs", name: "Ahrefs", envVars: ["AHREFS_API_KEY"] },
];

/** Check if required env vars are configured for a provider. */
function checkProviderConfig(envVars: string[]): { required: Array<{ name: string; present: boolean }>; allPresent: boolean } {
  const required = envVars.map((name) => ({
    name,
    present: !!process.env[name],
  }));
  const allPresent = required.every((v) => v.present);
  return { required, allPresent };
}

/** Get configuration status for all providers. */
async function getProviderConfigStatus(): Promise<ProviderConfigStatus[]> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const statuses: ProviderConfigStatus[] = [];

  for (const provider of PROVIDERS) {
    const { required, allPresent } = checkProviderConfig(provider.envVars);

    // Query last success and error for this provider
    const [{ data: lastSuccess }, { data: lastError }] = await Promise.all([
      supabase
        .from("api_usage_events")
        .select("created_at")
        .eq("provider", provider.id)
        .eq("success", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("api_usage_events")
        .select("created_at,error_message")
        .eq("provider", provider.id)
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let status: ProviderConfigStatus["status"] = "missing_env";
    if (allPresent) {
      status = "configured";
      // If there were recent errors, mark as warning
      if (lastError && lastError.created_at) {
        const errorTime = new Date(lastError.created_at);
        const hoursSinceError = (Date.now() - errorTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceError < 24) {
          status = "warning";
        }
      }
    }

    statuses.push({
      provider: provider.id,
      name: provider.name,
      status,
      requiredEnvVars: required,
      lastSuccess: lastSuccess?.created_at ?? null,
      lastError: lastError?.error_message ?? null,
      lastErrorTime: lastError?.created_at ?? null,
      lastChecked: now,
    });
  }

  return statuses;
}

/** Get usage rollups for all providers. */
async function getUsageRollups(): Promise<ProviderUsageRollup[]> {
  const supabase = createServiceClient();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const rollups: ProviderUsageRollup[] = [];

  for (const provider of PROVIDERS) {
    // Today's calls
    const { data: todayData } = await supabase
      .from("api_usage_events")
      .select("success", { count: "exact", head: true })
      .eq("provider", provider.id)
      .gte("created_at", startOfDay.toISOString());

    // 7-day calls and failures
    const { data: weekData } = await supabase
      .from("api_usage_events")
      .select("success", { count: "exact", head: true })
      .eq("provider", provider.id)
      .gte("created_at", sevenDaysAgo.toISOString());

    const { count: weekFailures } = await supabase
      .from("api_usage_events")
      .select("id", { count: "exact" })
      .eq("provider", provider.id)
      .eq("success", false)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Monthly cost estimate
    const { data: monthCost } = await supabase
      .from("api_usage_events")
      .select("estimated_cost_usd")
      .eq("provider", provider.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Last success/error
    const [{ data: lastSuccess }, { data: lastError }] = await Promise.all([
      supabase
        .from("api_usage_events")
        .select("created_at")
        .eq("provider", provider.id)
        .eq("success", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("api_usage_events")
        .select("created_at,error_message")
        .eq("provider", provider.id)
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const monthlyCost = monthCost
      ? monthCost.reduce((sum, e) => sum + (parseFloat(String(e.estimated_cost_usd)) || 0), 0)
      : null;

    rollups.push({
      provider: provider.id,
      callsToday: todayData?.length ?? 0,
      calls7d: weekData?.length ?? 0,
      failures7d: weekFailures ?? 0,
      estimatedMonthlyCostUsd: Math.round((monthlyCost ?? 0) * 100) / 100,
      lastSuccess: lastSuccess?.created_at ?? null,
      lastError: lastError?.created_at ?? null,
    });
  }

  return rollups;
}

/** Get quota info for providers where quota is exposed. */
function getQuotaInfo(): ProviderQuotaInfo[] {
  const quotas: ProviderQuotaInfo[] = [];

  // RapidAPI quota (if headers are available — usually not exposed to client)
  if (process.env.RAPIDAPI_KEY) {
    quotas.push({
      provider: "rapidapi_youtube",
      note: "Quota not exposed by provider",
    });
    quotas.push({
      provider: "rapidapi_article",
      note: "Quota not exposed by provider",
    });
  }

  // AWS Polly — no simple quota endpoint
  if (process.env.AWS_ACCESS_KEY_ID) {
    quotas.push({
      provider: "aws_polly",
      tier: process.env.AWS_POLLY_TIER ?? "Standard",
      note: "Check AWS Service Quotas console for limits",
    });
  }

  // Groq — check rate limit headers if available
  if (process.env.GROQ_API_KEY) {
    quotas.push({
      provider: "groq",
      note: "Rate limits enforced per API key; check Groq dashboard",
    });
  }

  return quotas;
}

/** Get recent API usage events. */
async function getRecentEvents(limit = 20): Promise<ApiUsageEvent[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("api_usage_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[api-health] failed to fetch recent events", error.message);
    return [];
  }

  return (data ?? []) as ApiUsageEvent[];
}

/** Main health check function — aggregates all data. */
export async function getApiHealth(): Promise<ApiHealthResponse> {
  const [configs, rollups, recentEvents] = await Promise.all([
    getProviderConfigStatus(),
    getUsageRollups(),
    getRecentEvents(15),
  ]);

  const quotas = getQuotaInfo();

  const totalCallsToday = rollups.reduce((sum, r) => sum + r.callsToday, 0);
  const totalFailuresToday = rollups.reduce((sum, r) => sum + (r.callsToday > 0 ? 0 : 0), 0);
  const totalMonthlyCost = rollups.reduce((sum, r) => sum + (r.estimatedMonthlyCostUsd ?? 0), 0);
  const configuredCount = configs.filter((c) => c.status !== "missing_env").length;
  const highestUsageProvider = rollups.reduce((max, r) => {
    if (r.calls7d > (max?.calls7d ?? 0)) return r;
    return max;
  }, null as ProviderUsageRollup | null);

  const providers = configs.map((config) => ({
    config,
    usage: rollups.find((r) => r.provider === config.provider) ?? null,
    quota: quotas.find((q) => q.provider === config.provider) ?? null,
  }));

  return {
    providers,
    overview: {
      totalProviders: PROVIDERS.length,
      configuredProviders: configuredCount,
      callsToday: totalCallsToday,
      failuresToday: totalFailuresToday,
      estimatedMonthlyCostUsd: Math.round(totalMonthlyCost * 100) / 100,
      highestUsageProvider: highestUsageProvider?.provider ?? null,
    },
    recentEvents,
    lastUpdated: new Date().toISOString(),
  };
}