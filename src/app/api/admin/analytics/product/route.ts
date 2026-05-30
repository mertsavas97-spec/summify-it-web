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

function normalizeMode(value: unknown): string {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  const mapping: Record<string, string> = {
    "general summary": "General Summary",
    "general-summary": "General Summary",
    "student": "Student",
    "the-student": "Student",
    "executive": "Executive",
    "executive brief": "Executive",
    "executive-brief": "Executive",
    "researcher": "Researcher",
    "deep dive": "Deep Dive",
    "deep-dive": "Deep Dive",
  };
  return mapping[v] ?? (typeof value === "string" && value.trim() ? value.trim() : "Unknown");
}

function normalizeSource(value: unknown): string {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  const mapping: Record<string, string> = {
    pdf: "PDF",
    file: "PDF",
    youtube: "YouTube",
    url: "Article",
    web: "Article",
    article: "Article",
    deck: "Deck",
    pptx: "Deck",
    presentation: "Deck",
    text: "Text",
    paste: "Text",
  };
  return mapping[v] ?? (typeof value === "string" && value.trim() ? value.trim() : "Unknown");
}

async function countEvents(admin: ReturnType<typeof getSupabaseAdmin>, args: { name: string; start: string; end: string }) {
  const { count } = await admin
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", args.name)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`);
  return count ?? 0;
}

async function distinctUsersForEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { name: string; start: string; end: string },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select("user_id")
    .eq("event_name", args.name)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .not("user_id", "is", null)
    .limit(5000);

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.user_id) set.add(String(row.user_id));
  }
  return set.size;
}

async function getInternalUserIds(admin: ReturnType<typeof getSupabaseAdmin>): Promise<Set<string>> {
  const { data } = await admin.from("profiles").select("id,email").limit(10000);
  const set = new Set<string>();
  for (const row of data ?? []) {
    const email = typeof row.email === "string" ? row.email.toLowerCase().trim() : "";
    if (email && INTERNAL_EMAILS.has(email)) set.add(String(row.id));
  }
  return set;
}

async function getDistinctSessionOrUserCount(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { names: string[]; start: string; end: string; by: "session" | "user"; excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select(args.by === "session" ? "session_id,user_id" : "user_id")
    .in("event_name", args.names)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .limit(20000);

  const set = new Set<string>();
  for (const row of data ?? []) {
    const userId = "user_id" in row ? row.user_id : null;
    if (userId && args.excludedUserIds?.has(String(userId))) continue;
    if (args.by === "session") {
      if ("session_id" in row && row.session_id) set.add(String(row.session_id));
    } else if (userId) {
      set.add(String(userId));
    }
  }
  return set.size;
}

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

async function countActivePaidUsers(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { start: string; end: string; excludedUserIds?: Set<string> },
): Promise<number> {
  const { data } = await admin
    .from("profiles")
    .select("id,plan,subscription_status,current_period_end,created_at")
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
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

function buildFunnelInsights(stages: Array<{ label: string; count: number; prevRate: number; topRate: number }>): string[] {
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
  return insights.slice(0, 3);
}

async function distinctSessionsForEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { name: string; start: string; end: string },
): Promise<number> {
  const { data } = await admin
    .from("product_events")
    .select("session_id")
    .eq("event_name", args.name)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .limit(5000);

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.session_id) set.add(String(row.session_id));
  }
  return set.size;
}

async function topMetadataKey(
   admin: ReturnType<typeof getSupabaseAdmin>,
   args: { name: string; start: string; end: string; key: string },
): Promise<Array<{ key: string; count: number }>> {
   const { data } = await admin
     .from("product_events")
     .select("metadata")
     .eq("event_name", args.name)
     .gte("created_at", `${args.start}T00:00:00.000Z`)
     .lte("created_at", `${args.end}T23:59:59.999Z`)
     .not("metadata", "is", null)
     .limit(5000);

   const counts = new Map<string, number>();
   for (const row of data ?? []) {
     const meta = row.metadata as Record<string, unknown> | null;
     const value = meta ? meta[args.key] : null;
     const normalized = args.key === "intelligence_mode" ? normalizeMode(value) : normalizeSource(value);
     counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
   }

   return [...counts.entries()]
     .map(([key, count]) => ({ key, count }))
     .sort((a, b) => b.count - a.count);
}

async function eventTimeseriesPerDay(
  admin: ReturnType<typeof getSupabaseAdmin>,
  args: { name: string; start: string; end: string },
): Promise<Array<{ date: string; value: number }>> {
  const { data } = await admin
    .from("product_events")
    .select("created_at")
    .eq("event_name", args.name)
    .gte("created_at", `${args.start}T00:00:00.000Z`)
    .lte("created_at", `${args.end}T23:59:59.999Z`)
    .limit(10000);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const date = typeof row.created_at === "string" ? row.created_at.slice(0, 10) : null;
    if (date) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  // Generate all dates in range with 0 if no data
  const result: Array<{ date: string; value: number }> = [];
  const startDate = new Date(`${args.start}T00:00:00Z`);
  const endDate = new Date(`${args.end}T23:59:59Z`);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = isoDate(d);
    result.push({ date: dateStr, value: counts.get(dateStr) ?? 0 });
  }

  return result;
}

/**
 * GET /api/admin/analytics/product
 * Aggregates first-party product usage metrics from `product_events`.
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
  const dateRange = resolveDateRange(url.searchParams);
  const admin = getSupabaseAdmin();

  const start = dateRange.startDate;
  const end = dateRange.endDate;

  const internalUserIds = await getInternalUserIds(admin);

  const [
    analysesCompleted,
    uploadsCompleted,
    learnCardsOpened,
    audioModeClicks,
    podcastClicks,
    uniqueAnalyzers,
    topModes,
    topSources,
    visitors,
    sourceUploaded,
    analysisStarted,
    analysisCompletedUsers,
    accountCreated,
    secondAnalysisCompleted,
    paidSubscriptions,
    analysesPerDay,
    uploadsPerDay,
    learnCardsPerDay,
    audioModePerDay,
    podcastPerDay,
  ] = await Promise.all([
    countEvents(admin, { name: "analysis_completed", start, end }),
    countEvents(admin, { name: "upload_completed", start, end }),
    countEvents(admin, { name: "learn_card_opened", start, end }),
    countEvents(admin, { name: "audio_mode_clicked", start, end }),
    countEvents(admin, { name: "podcast_clicked", start, end }),
    distinctUsersForEvent(admin, { name: "analysis_completed", start, end }),
    topMetadataKey(admin, { name: "analysis_completed", start, end, key: "intelligence_mode" }),
    topMetadataKey(admin, { name: "analysis_completed", start, end, key: "source_type" }),

    // Funnel counts (unique sessions per stage)
    getDistinctSessionOrUserCount(admin, { names: ["landing_view"], start, end, by: "session", excludedUserIds: internalUserIds }),
    getDistinctSessionOrUserCount(admin, { names: ["upload_started", "upload_completed"], start, end, by: "session", excludedUserIds: internalUserIds }),
    getDistinctSessionOrUserCount(admin, { names: ["analysis_started"], start, end, by: "session", excludedUserIds: internalUserIds }),
    getDistinctSessionOrUserCount(admin, { names: ["analysis_completed"], start, end, by: "user", excludedUserIds: internalUserIds }),
    getDistinctSessionOrUserCount(admin, { names: ["signup_completed"], start, end, by: "user", excludedUserIds: internalUserIds }),
    countUsersWithAtLeastTwoAnalyses(admin, { start, end, excludedUserIds: internalUserIds }),
    countActivePaidUsers(admin, { start, end, excludedUserIds: internalUserIds }),

    // Timeseries data
    eventTimeseriesPerDay(admin, { name: "analysis_completed", start, end }),
    eventTimeseriesPerDay(admin, { name: "upload_completed", start, end }),
    eventTimeseriesPerDay(admin, { name: "learn_card_opened", start, end }),
    eventTimeseriesPerDay(admin, { name: "audio_mode_clicked", start, end }),
    eventTimeseriesPerDay(admin, { name: "podcast_clicked", start, end }),
  ]);

  const avgAnalysesPerUser = uniqueAnalyzers > 0 ? analysesCompleted / uniqueAnalyzers : 0;

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
    overview: {
      analysesCompleted,
      uploadsCompleted,
      avgAnalysesPerUser,
      mostUsedMode: topModes[0]?.key ?? null,
      mostUsedSource: topSources[0]?.key ?? null,
      learnCardsOpened,
      audioModeClicks,
      podcastClicks,
    },
    timeseries: {
      analysesPerDay,
      uploadsPerDay,
      learnCardsPerDay,
      audioModePerDay: audioModePerDay,
      podcastPerDay,
    },
    funnel,
    topModes,
    topSources,
  });
}
