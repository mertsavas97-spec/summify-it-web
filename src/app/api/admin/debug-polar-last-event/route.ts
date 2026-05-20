import { NextResponse } from "next/server";
import { isAdminDebugAuthorized } from "@/server/admin/requireDebugToken";
import { getLatestPolarWebhookDebugEvent } from "@/server/billing/polarWebhookDebugStore";
import {
  getSupabaseAdmin,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DebugRequestBody = {
  email?: string;
};

/**
 * POST /api/admin/debug-polar-last-event
 * Body (optional): { "email": "user@example.com" }
 * Auth: ADMIN_DEBUG_TOKEN via Bearer or x-admin-debug-token
 */
export async function POST(request: Request) {
  if (!isAdminDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DebugRequestBody;
  const emailFilter = typeof body.email === "string" ? body.email : undefined;

  const latestEvent = await getLatestPolarWebhookDebugEvent({
    email: emailFilter,
  });

  let liveProfile: Record<string, unknown> | null = null;
  const userId = latestEvent?.resolved_user_id;
  if (isServiceRoleConfigured()) {
    const admin = getSupabaseAdmin();
    if (userId) {
      const { data } = await admin
        .from("profiles")
        .select(
          "id, email, plan, subscription_status, billing_interval, polar_customer_id, polar_subscription_id, current_period_end, updated_at",
        )
        .eq("id", userId)
        .maybeSingle();
      liveProfile = data ?? null;
    } else if (emailFilter) {
      const normalized = emailFilter.trim().toLowerCase();
      const { data } = await admin
        .from("profiles")
        .select(
          "id, email, plan, subscription_status, billing_interval, polar_customer_id, polar_subscription_id, current_period_end, updated_at",
        )
        .eq("email", normalized)
        .maybeSingle();
      liveProfile = data ?? null;
    }
  }

  return NextResponse.json({
    configured: Boolean(process.env.ADMIN_DEBUG_TOKEN?.trim()),
    hasServiceRole: isServiceRoleConfigured(),
    emailFilter: emailFilter ?? null,
    latestDebugEvent: latestEvent,
    liveProfileRow: liveProfile,
    latestSyncError:
      latestEvent?.sync_status === "failed"
        ? {
            code: latestEvent.error_code,
            message: latestEvent.error_message,
          }
        : null,
  });
}
