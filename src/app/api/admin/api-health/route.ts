import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import { getApiHealth } from "@/server/admin/getApiHealth";

/**
 * GET /api/admin/api-health
 *
 * Admin-only endpoint that returns API health, configuration status,
 * usage rollups, and recent events for all tracked providers.
 *
 * Security:
 * - Requires admin session (email in ADMIN_EMAILS)
 * - Never exposes secret values
 * - Only returns aggregate/safe data
 */
export async function GET() {
  try {
    // Verify admin access
    await requireAdminSession();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const health = await getApiHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error("[api-health] error", error);
    return NextResponse.json(
      { error: "Failed to fetch API health data" },
      { status: 500 },
    );
  }
}