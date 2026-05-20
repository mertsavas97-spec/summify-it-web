import { NextResponse } from "next/server";
import { isAdminDebugAuthorized } from "@/server/admin/requireDebugToken";
import {
  ensureProfileRow,
  resolveUserIdByEmailForAdmin,
  syncProfileBilling,
  PolarProfileSyncError,
} from "@/server/billing/syncProfileFromPolar";
import { isPlanId, type PlanId } from "@/types/plan";
import type { BillingInterval } from "@/types/plan";
import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ManualPlanSyncBody = {
  email?: string;
  plan?: string;
  subscriptionStatus?: string;
  billingInterval?: string;
};

const PAID_PLANS: PlanId[] = ["pro", "team", "scholar"];

/**
 * POST /api/admin/manual-plan-sync
 * Emergency profile billing update (service role). Protected by ADMIN_DEBUG_TOKEN.
 */
export async function POST(request: Request) {
  if (!isAdminDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as ManualPlanSyncBody | null;
  const email = body?.email?.trim().toLowerCase();
  const plan = body?.plan?.trim();
  const subscriptionStatus = body?.subscriptionStatus?.trim() ?? "active";
  const billingInterval = body?.billingInterval?.trim();

  if (!email || !plan) {
    return NextResponse.json(
      { error: "email and plan are required." },
      { status: 400 },
    );
  }

  if (!isPlanId(plan) || !PAID_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: "plan must be one of: pro, team, scholar." },
      { status: 400 },
    );
  }

  const interval: BillingInterval | null =
    billingInterval === "monthly" || billingInterval === "yearly" ? billingInterval : "monthly";

  try {
    const userId = await resolveUserIdByEmailForAdmin(email);
    const admin = getSupabaseAdmin();

    await ensureProfileRow(admin, userId, email);

    await syncProfileBilling({
      userId,
      plan,
      subscriptionStatus,
      billingInterval: interval,
    });

    const { data: profile } = await admin
      .from("profiles")
      .select(
        "id, email, plan, subscription_status, billing_interval, polar_customer_id, polar_subscription_id, current_period_end, updated_at",
      )
      .eq("id", userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      userId,
      profile,
    });
  } catch (error) {
    if (error instanceof PolarProfileSyncError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: error.code === "user_unresolved" ? 404 : 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Manual sync failed",
      },
      { status: 500 },
    );
  }
}
