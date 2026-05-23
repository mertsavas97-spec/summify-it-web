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

type ProviderDefinition = {
  id: ApiProvider;
  name: string;
  envVars: string[];
  optional?: boolean;
};

/** List of tracked providers with current env naming scheme. */
const PROVIDERS: ProviderDefinition[] = [
  { id: "groq", name: "Groq", envVars: ["GROQ_API_KEY"] },
  { id: "gemini", name: "Gemini", envVars: ["GEMINI_API_KEY"] },
  {
    id: "rapidapi",
    name: "RapidAPI",
    envVars: ["RAPIDAPI_KEY", "RAPIDAPI_HOST"],
  },
  {
    id: "supabase",
    name: "Supabase",
    envVars: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    id: "aws_polly",
    name: "AWS Polly",
    envVars: [
      "SUMMIFY_AWS_ACCESS_KEY_ID",
      "SUMMIFY_AWS_SECRET_ACCESS_KEY",
      "SUMMIFY_AWS_REGION",
    ],
  },
  {
    id: "formspree",
    name: "Formspree",
    envVars: ["NEXT_PUBLIC_FORMSPREE_CONTACT_ENDPOINT"],
    optional: true,
  },
  {
    id: "polar",
    name: "Polar",
    envVars: [
      "BILLING_PROVIDER",
      "POLAR_ACCESS_TOKEN",
      "POLAR_WEBHOOK_SECRET",
      "POLAR_SCHOLAR_MONTHLY_PRICE_ID",
      "POLAR_SCHOLAR_YEARLY_PRICE_ID",
      "POLAR_PRO_MONTHLY_PRICE_ID",
      "POLAR_PRO_YEARLY_PRICE_ID",
      "POLAR_TEAM_MONTHLY_PRICE_ID",
      "POLAR_TEAM_YEARLY_PRICE_ID",
      "POLAR_MODE",
    ],
    optional: true,
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    envVars: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
    optional: true,
  },
  {
    id: "auth",
    name: "Auth",
    envVars: ["NEXT_PUBLIC_AUTH_GOOGLE_ENABLED"],
    optional: true,
  },
  {
    id: "vercel",
    name: "Vercel",
    envVars: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_ORG_ID"],
    optional: true,
  },
];

const USAGE_EVENT_TYPES = [
  "analysis_completed",
  "podcast_audio_generated",
  "audio_study_script_generated",
  "extract_url",
  "extract_youtube",
] as const;

const PROVIDER_EVENT_MAP: Record<string, { provider: ApiProvider; operation: string; units?: number; charsFromMetadataKey?: string }> = {
  analysis_completed: { provider: "groq", operation: "analysis_completed", units: 1 },
  podcast_audio_generated: {
    provider: "aws_polly",
    operation: "podcast_audio_generated",
    units: 1,
  },
  audio_study_script_generated: {
    provider: "aws_polly",
    operation: "audio_study_script_generated",
    units: 1,
    charsFromMetadataKey: "script_chars",
  },
  extract_url: { provider: "rapidapi", operation: "extract_url", units: 1 },
  extract_youtube: { provider: "rapidapi", operation: "extract_youtube", units: 1 },
};

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
  const now = new Date().toISOString();

  const statuses: ProviderConfigStatus[] = [];

  for (const provider of PROVIDERS) {
    const { required, allPresent } = checkProviderConfig(provider.envVars);

    const status: ProviderConfigStatus["status"] = allPresent
      ? "configured"
      : provider.optional
        ? "optional_missing"
        : "missing_env";

    statuses.push({
      provider: provider.id,
      name: provider.name,
      status,
      optional: Boolean(provider.optional),
      requiredEnvVars: required,
      lastSuccess: null,
      lastError: null,
      lastErrorTime: null,
      lastChecked: now,
    });
  }

  return statuses;
}

function getNumberMetadata(metadata: Record<string, unknown> | null | undefined, key: string): number {
  if (!metadata) return 0;
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function estimateMonthlyFrom7d(calls7d: number, unitCost: number): number | null {
  if (calls7d <= 0) return null;
  return Number((((calls7d / 7) * 30) * unitCost).toFixed(4));
}

/** Get usage rollups from `usage_events` with fallback to `api_usage_events`. */
async function getUsageRollups(): Promise<ProviderUsageRollup[]> {
  const supabase = createServiceClient();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rollups = new Map<ApiProvider, ProviderUsageRollup>();
  for (const provider of PROVIDERS) {
    rollups.set(provider.id, {
      provider: provider.id,
      callsToday: 0,
      calls7d: 0,
      failures7d: 0,
      estimatedMonthlyCostUsd: null,
      lastSuccess: null,
      lastError: null,
    });
  }

  const { data: usageEvents, error: usageEventsError } = await supabase
    .from("usage_events")
    .select("event_type,success,failure_stage,metadata,created_at")
    .in("event_type", [...USAGE_EVENT_TYPES])
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (!usageEventsError && usageEvents && usageEvents.length > 0) {
    for (const row of usageEvents as Array<Record<string, unknown>>) {
      const eventType = String(row.event_type ?? "");
      const mapped = PROVIDER_EVENT_MAP[eventType];
      if (!mapped) continue;

      const createdAt = String(row.created_at ?? "");
      const created = new Date(createdAt);
      const isToday = created >= startOfDay;
      const isFailure = row.success === false || Boolean(row.failure_stage);
      const usage = rollups.get(mapped.provider);
      if (!usage) continue;

      usage.calls7d += mapped.units ?? 1;
      if (isToday) usage.callsToday += mapped.units ?? 1;
      if (isFailure) usage.failures7d += 1;
      if (!usage.lastSuccess && !isFailure) usage.lastSuccess = createdAt;
      if (!usage.lastError && isFailure) usage.lastError = createdAt;

      if (mapped.provider === "aws_polly" && mapped.charsFromMetadataKey) {
        const chars = getNumberMetadata(
          (row.metadata as Record<string, unknown> | null | undefined) ?? null,
          mapped.charsFromMetadataKey,
        );
        // Polly neural rough price: $16 / 1M chars
        const increment = chars > 0 ? (chars / 1_000_000) * 16 : 0;
        usage.estimatedMonthlyCostUsd = Number(
          ((usage.estimatedMonthlyCostUsd ?? 0) + increment).toFixed(4),
        );
      }
    }

    const groq = rollups.get("groq");
    if (groq) {
      groq.estimatedMonthlyCostUsd = estimateMonthlyFrom7d(groq.calls7d, 0.0004);
    }

    const rapid = rollups.get("rapidapi");
    if (rapid) {
      rapid.estimatedMonthlyCostUsd = estimateMonthlyFrom7d(rapid.calls7d, 0.01);
    }

    const polly = rollups.get("aws_polly");
    if (polly && (polly.estimatedMonthlyCostUsd ?? 0) > 0) {
      polly.estimatedMonthlyCostUsd = Number((((polly.estimatedMonthlyCostUsd ?? 0) / 7) * 30).toFixed(4));
    } else if (polly && polly.calls7d > 0) {
      polly.estimatedMonthlyCostUsd = estimateMonthlyFrom7d(polly.calls7d, 0.0012);
    }

    return [...rollups.values()];
  }

  // Fallback to legacy api_usage_events if product usage events are empty.
  for (const provider of PROVIDERS) {
    const usage = rollups.get(provider.id);
    if (!usage) continue;

    const [{ count: todayCount }, { count: weekCount }, { count: weekFailures }, { data: lastSuccess }, { data: lastError }] =
      await Promise.all([
        supabase
          .from("api_usage_events")
          .select("id", { count: "exact", head: true })
          .eq("provider", provider.id)
          .gte("created_at", startOfDay.toISOString()),
        supabase
          .from("api_usage_events")
          .select("id", { count: "exact", head: true })
          .eq("provider", provider.id)
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("api_usage_events")
          .select("id", { count: "exact", head: true })
          .eq("provider", provider.id)
          .eq("success", false)
          .gte("created_at", sevenDaysAgo.toISOString()),
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
          .select("created_at")
          .eq("provider", provider.id)
          .eq("success", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    usage.callsToday = todayCount ?? 0;
    usage.calls7d = weekCount ?? 0;
    usage.failures7d = weekFailures ?? 0;
    usage.lastSuccess = lastSuccess?.created_at ?? null;
    usage.lastError = lastError?.created_at ?? null;
  }

  return [...rollups.values()];
}

/** Get quota info for providers where quota is exposed. */
function getQuotaInfo(): ProviderQuotaInfo[] {
  const quotas: ProviderQuotaInfo[] = [];

  // RapidAPI quota (if headers are available — usually not exposed to client)
  if (process.env.RAPIDAPI_KEY) {
    quotas.push({
      provider: "rapidapi",
      note: "Quota not exposed by provider",
    });
  }

  // AWS Polly — no simple quota endpoint
  if (process.env.SUMMIFY_AWS_ACCESS_KEY_ID) {
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
  const totalFailuresToday = rollups.reduce((sum, r) => sum + r.failures7d, 0);
  const totalMonthlyCost = rollups.reduce((sum, r) => sum + (r.estimatedMonthlyCostUsd ?? 0), 0);
  const configuredCount = configs.filter((c) => c.status === "configured").length;
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
      estimatedMonthlyCostUsd: totalMonthlyCost > 0 ? Math.round(totalMonthlyCost * 100) / 100 : null,
      highestUsageProvider: highestUsageProvider?.provider ?? null,
    },
    recentEvents,
    lastUpdated: new Date().toISOString(),
  };
}
