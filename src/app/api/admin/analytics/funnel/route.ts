import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DateFilterPreset = "7d" | "30d" | "90d" | "custom";

const INTERNAL_EMAILS = new Set([
  "mertsavas97@gmail.com",
  "mert@075collective.com",
  "mert.savas@college.com.tr",
]);

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(params: URLSearchParams): { startDate: string; endDate: string } {
  const preset = (params.get("preset") ?? "30d") as DateFilterPreset;
  const now = new Date();
  const endDate = isoDate(now);

  if (preset === "custom") {
    const start = params.get("startDate");
    const end = params.get("endDate");
    if (!start || !end) throw new Error("Custom date range requires startDate and endDate");
    return { startDate: start, endDate: end };
  }

  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const startDateObj = new Date(now);
  startDateObj.setDate(startDateObj.getDate() - (days - 1));
  return { startDate: isoDate(startDateObj), endDate };
}

function safeDivide(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

/**
 * Count distinct sessions for given event names (excluding internal users).
 */
async function getDistinctSessionCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { names: string[]; start: string; end: string; excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select("session_id,user_id")
    .in("event_name", args.names)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .limit(20000);

  const set = new Set<string>();
  for (const row of data ?? []) {
    const userId = "user_id" in row ? row.user_id : null;
    if (userId && args.excludedUserIds?.has(String(userId))) continue;
    if ("session_id" in row && row.session_id) set.add(String(row.session_id));
  }
  return set.size;
}

/**
 * Count distinct users for given event names (excluding internal users).
 */
async function getDistinctUserCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { names: string[]; start: string; end: string; excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select("user_id")
    .in("event_name", args.names)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .not("user_id", "is", null)
    .limit(20000);

  const set = new Set<string>();
  for (const row of data ?? []) {
    const userId = "user_id" in row ? row.user_id : null;
    if (userId && !args.excludedUserIds?.has(String(userId))) {
      set.add(String(userId));
    }
  }
  return set.size;
}

/**
 * Get internal user IDs from profiles table by email.
 */
async function getInternalUserIds(admin: ReturnType<typeof getSupabaseAdmin>): Promise<Set<string>> {
  const { data } = await admin.from("profiles").select("id,email").limit(10000);
  const set = new Set<string>();
  for (const row of data ?? []) {
    const email = typeof row.email === "string" ? row.email.toLowerCase().trim() : "";
    if (email && INTERNAL_EMAILS.has(email)) set.add(String(row.id));
  }
  return set;
}

/**
 * Count users who completed at least 2 analyses (retention signal).
 */
async function countUsersWithAtLeastTwoAnalyses(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { start: string; end: string; excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select("user_id")
    .eq("event_name", "analysis_completed")
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .not("user_id", "is", null)
    .limit(20000);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.user_id) continue;
    const id = String(row.user_id);
    if (args.excludedUserIds?.has(id)) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let total = 0;
  for (const c of counts.values()) {
    if (c >= 2) total += 1;
  }
  return total;
}

/**
 * Count active paid subscriptions (excluding cancelled, expired, and internal).
 */
async function countActivePaidUsers(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("profiles")
    .select("id,plan,subscription_status,current_period_end")
    .limit(10000);

  const now = new Date();
  const set = new Set<string>();
  for (const row of data ?? []) {
    const id = String(row.id);
    if (args.excludedUserIds?.has(id)) continue;
    const plan = typeof row.plan === "string" ? row.plan.toLowerCase() : "";
    const status = typeof row.subscription_status === "string" ? row.subscription_status.toLowerCase() : "";
    const paidPlan = !!plan && plan !== "free";
    const statusActive = ["active", "trialing"].includes(status);
    const periodEndValid = !row.current_period_end || new Date(row.current_period_end) > now;
    if (paidPlan && statusActive && periodEndValid) set.add(id);
  }
  return set.size;
}

/**
 * Build automatic insights from funnel stage data.
 */
function buildFunnelInsights(stages: Array<{ key: string; label: string; count: number; prevRate: number; topRate: number }>): string[] {
  const insights: string[] = [];
  for (let i = 1; i < stages.length; i += 1) {
    const prev = stages[i - 1];
    const current = stages[i];
    if (prev.count <= 0) continue;
    const pct = Math.round(current.prevRate * 100);
    if (current.prevRate >= 0.7) {
      insights.push(`${prev.label} → ${current.label} conversion is strong (${pct}%).`);
    } else if (current.prevRate <= 0.3) {
      insights.push(`${prev.label} → ${current.label} conversion is weak (${pct}%).`);
    }
  }
  const second = stages.find((s) => s.label === "Second Analysis Completed");
  if (second) {
    if (second.topRate < 0.15) insights.push("Second-analysis rate suggests low retention.");
    else if (second.topRate > 0.35) insights.push("Second-analysis rate suggests healthy early retention.");
  }

  // Extra insight: acquisition vs activation diagnosis
  const visitors = stages.find((s) => s.key === "visitors");
  const paid = stages.find((s) => s.key === "paid_subscription");
  if (visitors && paid && visitors.count > 0) {
    const overallRate = paid.count / visitors.count;
    if (overallRate < 0.001) {
      insights.push("Overall visitor → paid conversion is very low (<0.1%). Focus on activation or pricing.");
    } else if (overallRate >= 0.01) {
      insights.push("Overall visitor → paid conversion is above 1% — healthy monetization signal.");
    }
  }

  return insights.slice(0, 3);
}

/**
 * GET /api/admin/analytics/funnel
 * Dedicated funnel endpoint reusing the same product_events infrastructure.
 */
export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ available: false, message: "Supabase service role is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  let dateRange;
  try {
    dateRange = resolveDateRange(url.searchParams);
  } catch (e) {
    return NextResponse.json(
      { available: false, message: e instanceof Error ? e.message : "Invalid date range" },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const start = dateRange.startDate;
  const end = dateRange.endDate;

  const internalUserIds = await getInternalUserIds(admin);

  const [visitors, sourceUploaded, analysisStarted, analysisCompletedUsers, accountCreated, secondAnalysisCompleted, paidSubscriptions] =
    await Promise.all([
      getDistinctSessionCount(admin, { names: ["landing_view"], start, end, excludedUserIds: internalUserIds }),
      getDistinctSessionCount(admin, { names: ["upload_started", "upload_completed"], start, end, excludedUserIds: internalUserIds }),
      getDistinctSessionCount(admin, { names: ["analysis_started"], start, end, excludedUserIds: internalUserIds }),
      getDistinctUserCount(admin, { names: ["analysis_completed"], start, end, excludedUserIds: internalUserIds }),
      getDistinctUserCount(admin, { names: ["signup_completed"], start, end, excludedUserIds: internalUserIds }),
      countUsersWithAtLeastTwoAnalyses(admin, { start, end, excludedUserIds: internalUserIds }),
      countActivePaidUsers(admin, { excludedUserIds: internalUserIds }),
    ]);

  const funnelStages = [
    { key: "visitors", label: "Visitors", count: visitors },
    { key: "source_uploaded", label: "Source Uploaded", count: sourceUploaded },
    { key: "analysis_started", label: "Analysis Started", count: analysisStarted },
    { key: "analysis_completed", label: "Analysis Completed", count: analysisCompletedUsers },
    { key: "account_created", label: "Account Created", count: accountCreated },
    { key: "second_analysis_completed", label: "Second Analysis Completed", count: secondAnalysisCompleted },
    { key: "paid_subscription", label: "Paid Subscription", count: paidSubscriptions },
  ];

  const top = funnelStages[0]?.count ?? 0;
  const enrichedStages = funnelStages.map((stage, i) => {
    const prev = i === 0 ? stage.count : funnelStages[i - 1].count;
    const prevRate = i === 0 ? 1 : safeDivide(stage.count, prev);
    const topRate = i === 0 ? 1 : safeDivide(stage.count, top);
    return { ...stage, prevRate, topRate, dropOffPrev: i === 0 ? 0 : 1 - prevRate, dropOffTop: i === 0 ? 0 : 1 - topRate };
  });

  const funnel = {
    stages: enrichedStages,
    insights: buildFunnelInsights(enrichedStages),
    hasEnoughData: top > 0,
  };

  return NextResponse.json({
    available: true,
    dateRange,
    funnel,
  });
}