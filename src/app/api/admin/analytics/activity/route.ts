import { NextResponse } from "next/server";
import { requireAdminSession, AdminUnauthorizedError } from "@/lib/admin/requireAdmin";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ActivityEvent {
  id: string;
  event_name: string;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ActivityResponse {
  available: boolean;
  message?: string;
  events?: ActivityEvent[];
}

const INTERNAL_EMAILS = new Set([
  "mertsavas97@gmail.com",
  "mert@075collective.com",
  "mert.savas@college.com.tr",
]);

const PRODUCT_EVENT_NAMES = new Set([
  "page_view",
  "analytics_page_view",
  "landing_view",
  "upload_page_view",
  "upload_page_viewed",
  "upload_started",
  "upload_completed",
  "analysis_started",
  "analysis_completed",
  "guest_audio_preview_generated",
  "guest_audio_preview_played",
  "audio_study_script_generated",
  "audio_study_played",
  "learn_card_opened",
  "learn_cards_opened",
  "save_study_session_clicked",
  "pricing_view",
  "pricing_viewed",
  "checkout_started",
  "login_view",
  "login_intent",
  "signup_started",
  "signup_completed",
  "subscription_created",
]);

function isDevOrAdminDebugMode() {
  return process.env.NODE_ENV !== "production";
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

/**
 * GET /api/admin/analytics/activity
 * Fetches the latest product events for the activity feed.
 * Returns latest 20 events, server-side only.
 */
export async function GET() {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      console.warn("[activity] Unauthorized admin access attempt");
      return NextResponse.json({ available: false, message: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  if (!isServiceRoleConfigured()) {
    console.error("[activity] Service role not configured");
    return NextResponse.json(
      { available: false, message: "Supabase service role is not configured." },
      { status: 503 }
    );
  }

  const admin = getSupabaseAdmin();

  try {
    const internalUserIds = await getInternalUserIds(admin);

    const [{ data: productEvents, error: productEventsError }, { data: usageEvents, error: usageEventsError }] = await Promise.all([
      admin
        .from("product_events")
        .select("id, event_name, created_at, user_id, session_id, metadata")
        .order("created_at", { ascending: false })
        .limit(150),
      admin
        .from("usage_events")
        .select("id, event_type, created_at, user_id, session_id, source_type, intelligence_mode, plan, metadata")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);

    if (productEventsError) {
      console.error("[activity] product_events query error:", {
        code: productEventsError.code,
        message: productEventsError.message,
      });
    }

    if (usageEventsError) {
      console.error("[activity] usage_events query error:", {
        code: usageEventsError.code,
        message: usageEventsError.message,
      });
    }

    const mappedUsageEvents: ActivityEvent[] = (usageEvents ?? []).map((row: Record<string, unknown>) => ({
      id: `usage-${String(row.id ?? "")}`,
      event_name: String(row.event_type ?? ""),
      created_at: String(row.created_at ?? ""),
      user_id: typeof row.user_id === "string" ? row.user_id : null,
      session_id: typeof row.session_id === "string" ? row.session_id : null,
      metadata: {
        source_type: row.source_type ?? null,
        intelligence_mode: row.intelligence_mode ?? null,
        plan: row.plan ?? null,
        ...(row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {}),
      },
    }));

    const merged: ActivityEvent[] = [...((productEvents ?? []) as ActivityEvent[]), ...mappedUsageEvents]
      .filter((event) => PRODUCT_EVENT_NAMES.has(event.event_name))
      .filter((event) => !(event.user_id && internalUserIds.has(String(event.user_id))))
      .filter((event) => Boolean(event.created_at))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

    const deduped: ActivityEvent[] = [];
    const seen = new Set<string>();
    for (const event of merged) {
      const key = `${event.event_name}|${event.user_id ?? "anon"}|${event.session_id ?? "nosession"}|${event.created_at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(event);
      if (deduped.length >= 20) break;
    }

    const response: ActivityResponse = {
      available: true,
      events: deduped,
      ...(deduped.length === 0
        ? {
            message: isDevOrAdminDebugMode()
              ? "Check event source, date range, and internal-user filters."
              : undefined,
          }
        : {}),
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error("[activity] Unexpected error:", {
      error: e instanceof Error ? e.message : String(e),
      type: e instanceof Error ? e.name : typeof e,
    });
    // Return available: true with empty array to keep UI clean
    return NextResponse.json({
      available: true,
      events: [],
    });
  }
}
