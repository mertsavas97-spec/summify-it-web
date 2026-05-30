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
    const { data, error } = await admin
      .from("product_events")
      .select("id, event_name, created_at, user_id, session_id, metadata")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[activity] Supabase query error:", {
        code: error.code,
        message: error.message,
      });
      // Return available: true with empty array instead of error, so UI shows clean empty state
      return NextResponse.json({
        available: true,
        events: [],
      });
    }

    const events = (data ?? []) as ActivityEvent[];
    console.debug(`[activity] Fetched ${events.length} events`);

    return NextResponse.json({
      available: true,
      events,
    });
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
