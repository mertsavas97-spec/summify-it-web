import { NextResponse } from "next/server";
import { getLastPolarSyncSnapshot } from "@/server/billing/polarSyncDebug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_DEBUG_TOKEN?.trim();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;

  const header = request.headers.get("x-admin-debug-token");
  if (header === expected) return true;

  return false;
}

/**
 * POST /api/admin/debug-polar-last-event
 * Requires ADMIN_DEBUG_TOKEN (Bearer or x-admin-debug-token header).
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = getLastPolarSyncSnapshot();

  let liveProfile: Record<string, unknown> | null = null;
  const userId = snapshot?.userResolution?.userId;
  if (userId) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const { data } = await admin
        .from("profiles")
        .select(
          "id, email, plan, subscription_status, billing_interval, polar_customer_id, polar_subscription_id, current_period_end, updated_at",
        )
        .eq("id", userId)
        .maybeSingle();
      liveProfile = data ?? null;
    }
  }

  return NextResponse.json({
    configured: Boolean(process.env.ADMIN_DEBUG_TOKEN?.trim()),
    hasServiceRole: Boolean(createSupabaseAdminClient()),
    lastResolvedUser: snapshot?.userResolution ?? null,
    lastResolvedPlan: snapshot?.planResolution ?? null,
    webhookPayloadSummary: snapshot?.payloadSummary ?? null,
    profileUpdateResult: snapshot?.profileUpdate ?? null,
    latestSyncError: snapshot?.error ?? null,
    lastEventType: snapshot?.eventType ?? null,
    lastSyncAt: snapshot?.at ?? null,
    liveProfileRow: liveProfile,
  });
}
