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
      return NextResponse.json({ available: false, message: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  if (!isServiceRoleConfigured()) {
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
      console.error("Error fetching activity events:", error);
      return NextResponse.json(
        { available: false, message: "Failed to fetch activity events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: true,
      events: (data ?? []) as ActivityEvent[],
    });
  } catch (e) {
    console.error("Unexpected error in activity endpoint:", e);
    return NextResponse.json(
      { available: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
