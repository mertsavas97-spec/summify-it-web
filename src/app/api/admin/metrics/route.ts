import { NextResponse } from "next/server";
import {
  requireAdminSession,
  AdminUnauthorizedError,
} from "@/lib/admin/requireAdmin";
import { getAdminMetrics } from "@/server/admin/getAdminMetrics";

export const runtime = "nodejs";

/**
 * GET /api/admin/metrics — admin-only product metrics (service role aggregation).
 */
export async function GET() {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof AdminUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }

  const metrics = await getAdminMetrics();
  return NextResponse.json(metrics);
}
