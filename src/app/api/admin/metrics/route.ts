import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/isAdminUser";
import { getOptionalUser } from "@/lib/auth";
import { getAdminMetrics } from "@/server/admin/getAdminMetrics";

export const runtime = "nodejs";

/**
 * GET /api/admin/metrics — admin-only product metrics (service role aggregation).
 */
export async function GET() {
  const user = await getOptionalUser();
  if (!user || !(await isAdminUser(user))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metrics = await getAdminMetrics();
  return NextResponse.json(metrics);
}
