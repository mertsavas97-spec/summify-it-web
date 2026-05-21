import { getPlanDefinition } from "@/data/pricingPlans";
import { isActiveSubscriptionStatus } from "@/lib/billing/entitlements";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { resolvePlanId } from "@/lib/plan-limits";
import type { PlanId } from "@/types/plan";
import { isPlanId } from "@/types/plan";

const PLAN_IDS: PlanId[] = ["free", "beta", "pro", "scholar", "team"];
const PAID_PLAN_IDS: PlanId[] = ["pro", "scholar", "team"];

export type MetricSection<T> =
  | { available: true; data: T }
  | { available: false; message: string };

export type AdminMetrics = {
  fetchedAt: string;
  overview: MetricSection<{
    totalUsers: number;
    analysesToday: number;
    activePaidSubscriptions: number;
    analysesLast24h: number;
  }>;
  users: MetricSection<{
    totalUsers: number;
    newUsersToday: number;
    newUsersLast7Days: number;
    activeUsersLast24h: number;
    activeUsersLast7Days: number;
    planDistribution: Record<PlanId, number>;
  }>;
  usage: MetricSection<{
    totalAnalyses: number;
    analysesToday: number;
    analysesLast24h: number;
    analysesLast7Days: number;
    uniqueAnalyzersLast24h: number;
    uniqueAnalyzersLast7Days: number;
    avgAnalysesPerActiveUser7d: number | null;
  }>;
  subscriptions: MetricSection<{
    activePaidSubscriptions: number;
    proActive: number;
    scholarActive: number;
    teamActive: number;
    monthlyBilling: number;
    yearlyBilling: number;
    canceled: number;
    pastDue: number;
    estimatedMrrUsd: number | null;
    estimatedArrUsd: number | null;
  }>;
  sourcesAndModes: MetricSection<{
    bySourceKind: { kind: string; label: string; count: number }[];
    topIntelligenceModes: { mode: string; count: number }[];
  }>;
  learn: MetricSection<{
    practiceSessionsStarted: number;
    reviewSessionsCompleted: number;
    totalLearnCardsInSavedAnalyses: number;
    avgLearnCardsPerAnalysis: number | null;
    savedAnalysesSampled: number;
  }>;
  failures: MetricSection<{
    analysisFailuresAvailable: boolean;
    failedAnalysesToday: number | null;
    failedAnalysesLast7Days: number | null;
    topFailureReason: string | null;
    webhookFailuresToday: number | null;
    webhookFailuresLast7Days: number | null;
    topWebhookError: string | null;
  }>;
};

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function safeCount(
  query: () => Promise<{ count: number | null; error: { message: string } | null }>,
): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await query();
    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0, error: null };
  } catch (err) {
    return {
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function uniqueUserIds(rows: { user_id: string | null }[] | null): number {
  const set = new Set<string>();
  for (const row of rows ?? []) {
    if (row.user_id) set.add(row.user_id);
  }
  return set.size;
}

function countByKey<T extends string>(
  rows: Record<string, T | null | undefined>[] | null,
  key: keyof Record<string, T | null | undefined>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    const value = String(row[key] ?? "unknown").trim() || "unknown";
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

const SOURCE_KIND_LABELS: Record<string, string> = {
  youtube: "YouTube",
  presentation: "PPTX",
  url: "Web article",
  file: "Upload",
  text: "TXT / paste",
};

function isPaidActiveProfile(row: {
  plan: string;
  subscription_status: string | null;
  polar_subscription_id: string | null;
}): boolean {
  const planId = resolvePlanId(row.plan);
  if (!PAID_PLAN_IDS.includes(planId as PlanId)) return false;
  if (isActiveSubscriptionStatus(row.subscription_status)) return true;
  return Boolean(row.polar_subscription_id && !row.subscription_status);
}

function estimateRevenueUsd(
  profiles: {
    plan: string;
    billing_interval: string | null;
    subscription_status: string | null;
    polar_subscription_id: string | null;
  }[],
): { mrr: number; arr: number } | null {
  let mrrCents = 0;

  for (const row of profiles) {
    if (!isPaidActiveProfile(row)) continue;
    const planId = resolvePlanId(row.plan);
    if (!isPlanId(planId) || !PAID_PLAN_IDS.includes(planId)) continue;

    const definition = getPlanDefinition(planId);
    const interval = row.billing_interval?.trim().toLowerCase() === "year" ? "yearly" : "monthly";
    const option = definition.billing?.[interval];
    if (!option?.amountCents) continue;

    if (interval === "yearly") {
      mrrCents += Math.round(option.amountCents / 12);
    } else {
      mrrCents += option.amountCents;
    }
  }

  if (mrrCents <= 0) return null;
  const mrr = mrrCents / 100;
  return { mrr, arr: mrr * 12 };
}

/**
 * Aggregates product metrics via service role. Individual sections fail independently.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const fetchedAt = new Date().toISOString();
  const unavailable = (message: string): AdminMetrics => ({
    fetchedAt,
    overview: { available: false, message },
    users: { available: false, message },
    usage: { available: false, message },
    subscriptions: { available: false, message },
    sourcesAndModes: { available: false, message },
    learn: { available: false, message },
    failures: {
      available: true,
      data: {
        analysisFailuresAvailable: false,
        failedAnalysesToday: null,
        failedAnalysesLast7Days: null,
        topFailureReason: null,
        webhookFailuresToday: null,
        webhookFailuresLast7Days: null,
        topWebhookError: null,
      },
    },
  });

  if (!isServiceRoleConfigured()) {
    return unavailable("Supabase service role is not configured.");
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    return unavailable(err instanceof Error ? err.message : "Admin client unavailable.");
  }

  const todayStart = startOfUtcDayIso();
  const last24h = hoursAgoIso(24);
  const last7d = daysAgoIso(7);

  const errors: string[] = [];

  const totalUsers = await safeCount(async () => {
    const { count, error } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true });
    return { count, error };
  });
  if (totalUsers.error) errors.push(totalUsers.error);

  const newUsersToday = await safeCount(async () => {
    const { count, error } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);
    return { count, error };
  });

  const newUsersLast7Days = await safeCount(async () => {
    const { count, error } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last7d);
    return { count, error };
  });

  const planDistribution = Object.fromEntries(
    PLAN_IDS.map((id) => [id, 0]),
  ) as Record<PlanId, number>;

  const { data: planRows, error: planRowsError } = await admin
    .from("profiles")
    .select("plan");

  if (planRowsError) {
    errors.push(planRowsError.message);
  } else {
    for (const row of planRows ?? []) {
      const planId = resolvePlanId(row.plan);
      if (isPlanId(planId)) {
        planDistribution[planId] += 1;
      } else {
        planDistribution.free += 1;
      }
    }
  }

  const { data: active24hRows, error: active24hError } = await admin
    .from("usage_events")
    .select("user_id")
    .gte("created_at", last24h);

  const { data: active7dRows, error: active7dError } = await admin
    .from("usage_events")
    .select("user_id")
    .gte("created_at", last7d);

  if (active24hError) errors.push(active24hError.message);
  if (active7dError) errors.push(active7dError.message);

  const activeUsersLast24h = uniqueUserIds(active24hRows);
  const activeUsersLast7Days = uniqueUserIds(active7dRows);

  const usersSection: AdminMetrics["users"] =
    totalUsers.error && !planRows?.length
      ? {
          available: false,
          message: errors.join("; ") || "User metrics unavailable.",
        }
      : {
          available: true,
          data: {
            totalUsers: totalUsers.count,
            newUsersToday: newUsersToday.count,
            newUsersLast7Days: newUsersLast7Days.count,
            activeUsersLast24h,
            activeUsersLast7Days,
            planDistribution,
          },
        };

  const countAnalysisEvents = async (since?: string) =>
    safeCount(async () => {
      let q = admin
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "analysis_completed");
      if (since) q = q.gte("created_at", since);
      const { count, error } = await q;
      return { count, error };
    });

  const totalFromEvents = await countAnalysisEvents();
  const totalFromSaved = await safeCount(async () => {
    const { count, error } = await admin
      .from("saved_analyses")
      .select("*", { count: "exact", head: true });
    return { count, error };
  });

  const analysesToday = await countAnalysisEvents(todayStart);
  const analysesLast24h = await countAnalysisEvents(last24h);
  const analysesLast7Days = await countAnalysisEvents(last7d);

  const { data: analyzers24h } = await admin
    .from("usage_events")
    .select("user_id")
    .eq("event_type", "analysis_completed")
    .gte("created_at", last24h);

  const { data: analyzers7d } = await admin
    .from("usage_events")
    .select("user_id")
    .eq("event_type", "analysis_completed")
    .gte("created_at", last7d);

  const uniqueAnalyzersLast24h = uniqueUserIds(analyzers24h);
  const uniqueAnalyzersLast7Days = uniqueUserIds(analyzers7d);
  const analysisEvents7d = analysesLast7Days.count;
  const avgAnalysesPerActiveUser7d =
    uniqueAnalyzersLast7Days > 0
      ? Math.round((analysisEvents7d / uniqueAnalyzersLast7Days) * 10) / 10
      : null;

  const totalAnalyses = Math.max(totalFromEvents.count, totalFromSaved.count);

  const usageSection: AdminMetrics["usage"] = {
    available: true,
    data: {
      totalAnalyses,
      analysesToday: analysesToday.count,
      analysesLast24h: analysesLast24h.count,
      analysesLast7Days: analysisEvents7d,
      uniqueAnalyzersLast24h,
      uniqueAnalyzersLast7Days,
      avgAnalysesPerActiveUser7d,
    },
  };

  const { data: billingProfiles, error: billingError } = await admin
    .from("profiles")
    .select(
      "plan, subscription_status, polar_subscription_id, billing_interval",
    );

  let subscriptionsSection: AdminMetrics["subscriptions"] = {
    available: false,
    message: "Subscription metrics unavailable.",
  };

  if (!billingError && billingProfiles) {
    let proActive = 0;
    let scholarActive = 0;
    let teamActive = 0;
    let monthlyBilling = 0;
    let yearlyBilling = 0;
    let canceled = 0;
    let pastDue = 0;
    const activePaid: typeof billingProfiles = [];

    for (const row of billingProfiles) {
      const status = row.subscription_status?.toLowerCase() ?? "";
      if (status === "canceled" || status === "cancelled") canceled += 1;
      if (status === "past_due") pastDue += 1;

      if (!isPaidActiveProfile(row)) continue;

      activePaid.push(row);
      const planId = resolvePlanId(row.plan);
      if (planId === "pro") proActive += 1;
      if (planId === "scholar") scholarActive += 1;
      if (planId === "team") teamActive += 1;

      const interval = row.billing_interval?.trim().toLowerCase();
      if (interval === "year" || interval === "yearly") yearlyBilling += 1;
      else monthlyBilling += 1;
    }

    const revenue = estimateRevenueUsd(activePaid);

    subscriptionsSection = {
      available: true,
      data: {
        activePaidSubscriptions: activePaid.length,
        proActive,
        scholarActive,
        teamActive,
        monthlyBilling,
        yearlyBilling,
        canceled,
        pastDue,
        estimatedMrrUsd: revenue?.mrr ?? null,
        estimatedArrUsd: revenue?.arr ?? null,
      },
    };
  } else if (billingError) {
    subscriptionsSection = {
      available: false,
      message: billingError.message,
    };
  }

  const { data: sourceRows, error: sourceError } = await admin
    .from("usage_events")
    .select("source_kind")
    .eq("event_type", "analysis_completed")
    .gte("created_at", last7d);

  const { data: modeRows, error: modeError } = await admin
    .from("usage_events")
    .select("intelligence_mode")
    .eq("event_type", "analysis_completed")
    .gte("created_at", last7d)
    .not("intelligence_mode", "is", null);

  let sourcesAndModesSection: AdminMetrics["sourcesAndModes"] = {
    available: false,
    message: "Source and mode metrics unavailable.",
  };

  if (!sourceError && !modeError) {
    const sourceCounts = countByKey(sourceRows, "source_kind");
    const bySourceKind = [...sourceCounts.entries()]
      .map(([kind, count]) => ({
        kind,
        label: SOURCE_KIND_LABELS[kind] ?? kind,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const modeCounts = countByKey(modeRows, "intelligence_mode");
    const topIntelligenceModes = [...modeCounts.entries()]
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    sourcesAndModesSection = {
      available: true,
      data: { bySourceKind, topIntelligenceModes },
    };
  }

  let learnSection: AdminMetrics["learn"] = {
    available: false,
    message: "Learn activity tracking not available yet",
  };

  const sessionsStarted = await safeCount(async () => {
    const { count, error } = await admin
      .from("review_sessions")
      .select("*", { count: "exact", head: true });
    return { count, error };
  });

  const sessionsCompleted = await safeCount(async () => {
    const { count, error } = await admin
      .from("review_sessions")
      .select("*", { count: "exact", head: true })
      .not("completed_at", "is", null);
    return { count, error };
  });

  const { data: learnRows, error: learnError } = await admin
    .from("saved_analyses")
    .select("learn_cards")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (!learnError && learnRows) {
    let cardTotal = 0;
    for (const row of learnRows) {
      if (Array.isArray(row.learn_cards)) cardTotal += row.learn_cards.length;
    }
    const sampled = learnRows.length;
    learnSection = {
      available: true,
      data: {
        practiceSessionsStarted: sessionsStarted.count,
        reviewSessionsCompleted: sessionsCompleted.count,
        totalLearnCardsInSavedAnalyses: cardTotal,
        avgLearnCardsPerAnalysis:
          sampled > 0 ? Math.round((cardTotal / sampled) * 10) / 10 : null,
        savedAnalysesSampled: sampled,
      },
    };
  } else if (sessionsStarted.count > 0 || sessionsCompleted.count > 0) {
    learnSection = {
      available: true,
      data: {
        practiceSessionsStarted: sessionsStarted.count,
        reviewSessionsCompleted: sessionsCompleted.count,
        totalLearnCardsInSavedAnalyses: 0,
        avgLearnCardsPerAnalysis: null,
        savedAnalysesSampled: 0,
      },
    };
  }

  let failuresSection: AdminMetrics["failures"] = {
    available: true,
    data: {
      analysisFailuresAvailable: false,
      failedAnalysesToday: null,
      failedAnalysesLast7Days: null,
      topFailureReason: null,
      webhookFailuresToday: null,
      webhookFailuresLast7Days: null,
      topWebhookError: null,
    },
  };

  const { count: webhookToday, error: webhookTodayError } = await admin
    .from("polar_webhook_debug_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart)
    .eq("sync_status", "failed");

  const { count: webhook7d, error: webhook7dError } = await admin
    .from("polar_webhook_debug_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", last7d)
    .eq("sync_status", "failed");

  if (!webhookTodayError && !webhook7dError) {
    const { data: webhookErrors } = await admin
      .from("polar_webhook_debug_events")
      .select("error_code, error_message, sync_status")
      .gte("created_at", last7d)
      .eq("sync_status", "failed")
      .limit(500);

    const errorCounts = new Map<string, number>();
    for (const row of webhookErrors ?? []) {
      const key =
        row.error_code?.trim() ||
        row.error_message?.trim()?.slice(0, 80) ||
        row.sync_status ||
        "unknown";
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
    const topWebhookError =
      [...errorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    failuresSection = {
      available: true,
      data: {
        analysisFailuresAvailable: false,
        failedAnalysesToday: null,
        failedAnalysesLast7Days: null,
        topFailureReason: null,
        webhookFailuresToday: webhookToday ?? 0,
        webhookFailuresLast7Days: webhook7d ?? 0,
        topWebhookError,
      },
    };
  }

  const overviewSection: AdminMetrics["overview"] =
    usersSection.available && usageSection.available
      ? {
          available: true,
          data: {
            totalUsers: usersSection.data.totalUsers,
            analysesToday: usageSection.data.analysesToday,
            activePaidSubscriptions:
              subscriptionsSection.available
                ? subscriptionsSection.data.activePaidSubscriptions
                : 0,
            analysesLast24h: usageSection.data.analysesLast24h,
          },
        }
      : {
          available: false,
          message: "Overview metrics partially unavailable.",
        };

  return {
    fetchedAt,
    overview: overviewSection,
    users: usersSection,
    usage: usageSection,
    subscriptions: subscriptionsSection,
    sourcesAndModes: sourcesAndModesSection,
    learn: learnSection,
    failures: failuresSection,
  };
}
