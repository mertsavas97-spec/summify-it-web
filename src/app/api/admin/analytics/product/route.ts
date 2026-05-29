import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DateFilterPreset = "7d" | "30d" | "90d" | "custom";

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
    uploaders,
    analyzers,
    signups,
    pricingViewers,
    subscribers,
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
    distinctSessionsForEvent(admin, { name: "landing_view", start, end }),
    distinctSessionsForEvent(admin, { name: "upload_started", start, end }),
    distinctSessionsForEvent(admin, { name: "analysis_started", start, end }),
    distinctSessionsForEvent(admin, { name: "signup_completed", start, end }),
    distinctSessionsForEvent(admin, { name: "pricing_view", start, end }),
    distinctSessionsForEvent(admin, { name: "subscription_created", start, end }),

    // Timeseries data
    eventTimeseriesPerDay(admin, { name: "analysis_completed", start, end }),
    eventTimeseriesPerDay(admin, { name: "upload_completed", start, end }),
    eventTimeseriesPerDay(admin, { name: "learn_card_opened", start, end }),
    eventTimeseriesPerDay(admin, { name: "audio_mode_clicked", start, end }),
    eventTimeseriesPerDay(admin, { name: "podcast_clicked", start, end }),
  ]);

  const avgAnalysesPerUser = uniqueAnalyzers > 0 ? analysesCompleted / uniqueAnalyzers : 0;

  const funnel = {
    visitor: visitors,
    upload: uploaders,
    analysis: analyzers,
    signup: signups,
    pricing: pricingViewers,
    subscription: subscribers,
    rates: {
      visitor_to_upload: safeDivide(uploaders, visitors),
      upload_to_analysis: safeDivide(analyzers, uploaders),
      analysis_to_signup: safeDivide(signups, analyzers),
      signup_to_pricing: safeDivide(pricingViewers, signups),
      pricing_to_subscription: safeDivide(subscribers, pricingViewers),
    },
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
