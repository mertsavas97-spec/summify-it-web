import { NextResponse } from "next/server";
import { isAdminDebugAuthorized } from "@/server/admin/requireDebugToken";
import {
  getServiceRoleJwtRole,
  getSupabaseAdmin,
  getSupabaseUrlHost,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/test-service-role
 * Verifies service-role env and read/write access on profiles.
 * Auth: ADMIN_DEBUG_TOKEN via Bearer or x-admin-debug-token
 */
export async function GET(request: Request) {
  if (!isAdminDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleConfigured = isServiceRoleConfigured();
  const supabaseUrlHost = getSupabaseUrlHost();

  if (!serviceRoleConfigured) {
    return NextResponse.json({
      serviceRoleConfigured: false,
      writeAccessWorking: false,
      supabaseUrlHost,
      jwtRole: "unknown",
      readError: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing",
      writeError: null,
    });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  const jwtRole = getServiceRoleJwtRole(key);

  let writeAccessWorking = false;
  let readError: string | null = null;
  let writeError: string | null = null;
  let probeProfileId: string | null = null;

  try {
    const admin = getSupabaseAdmin();

    const { data: row, error: readErr } = await admin
      .from("profiles")
      .select("id, updated_at")
      .limit(1)
      .maybeSingle();

    if (readErr) {
      readError = readErr.message;
    } else if (!row?.id) {
      readError = "No profile rows found to probe write access.";
    } else {
      probeProfileId = row.id;
      const originalUpdatedAt = row.updated_at as string | null;
      const probeTimestamp = new Date().toISOString();

      const { error: writeErr } = await admin
        .from("profiles")
        .update({ updated_at: probeTimestamp })
        .eq("id", row.id);

      if (writeErr) {
        writeError = writeErr.message;
      } else {
        const { error: revertErr } = await admin
          .from("profiles")
          .update({ updated_at: originalUpdatedAt })
          .eq("id", row.id);

        if (revertErr) {
          writeError = `Write succeeded but revert failed: ${revertErr.message}`;
          writeAccessWorking = true;
        } else {
          writeAccessWorking = true;
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin client error";
    if (!readError) readError = message;
    else writeError = message;
  }

  return NextResponse.json({
    serviceRoleConfigured,
    writeAccessWorking,
    supabaseUrlHost,
    jwtRole,
    probeProfileId,
    readError,
    writeError,
    hint:
      jwtRole !== "service_role" && jwtRole !== "unknown"
        ? "SUPABASE_SERVICE_ROLE_KEY appears to be an anon or user JWT — use the service_role secret from Supabase Dashboard → Settings → API."
        : writeError?.includes("permission denied")
          ? "Check that SUPABASE_SERVICE_ROLE_KEY is the service_role secret (not anon) and matches NEXT_PUBLIC_SUPABASE_URL project."
          : null,
  });
}
