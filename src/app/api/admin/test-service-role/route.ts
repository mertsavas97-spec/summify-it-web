import { NextResponse } from "next/server";
import { isAdminDebugAuthorized } from "@/server/admin/requireDebugToken";
import {
  classifyServiceRoleKey,
  getSupabaseAdmin,
  getSupabaseUrlHost,
  isServiceRoleConfigured,
  probeProfilesTableAccess,
  probeProfilesTableViaRest,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/test-service-role
 * Verifies secret/service key env and real profiles read/write (not JWT decode).
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
      keyFormat: null,
      sdk: null,
      rest: null,
      readError: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing",
      writeError: null,
      hint: null,
    });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  const { jwtRole, keyFormat } = classifyServiceRoleKey(key);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();

  let sdkProbe;
  let restProbe;

  try {
    const admin = getSupabaseAdmin();
    sdkProbe = await probeProfilesTableAccess(admin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin client error";
    sdkProbe = {
      readOk: false,
      writeOk: false,
      readError: message,
      writeError: null,
      probeProfileId: null,
    };
  }

  try {
    restProbe = await probeProfilesTableViaRest(supabaseUrl, key);
  } catch (error) {
    const message = error instanceof Error ? error.message : "REST probe error";
    restProbe = {
      readOk: false,
      writeOk: false,
      readError: message,
      writeError: null,
      probeProfileId: null,
      restDirectWorking: false,
    };
  }

  const writeAccessWorking = sdkProbe.writeOk || restProbe.writeOk;
  const readError = sdkProbe.readError ?? restProbe.readError;
  const writeError = sdkProbe.writeError ?? restProbe.writeError;

  const permissionDenied =
    [sdkProbe.readError, sdkProbe.writeError, restProbe.readError, restProbe.writeError]
      .filter(Boolean)
      .some((msg) => msg!.includes("permission denied"));

  return NextResponse.json({
    serviceRoleConfigured: true,
    writeAccessWorking,
    supabaseUrlHost,
    jwtRole,
    keyFormat,
    probeProfileId: sdkProbe.probeProfileId ?? restProbe.probeProfileId,
    readError: readError ?? null,
    writeError: writeError ?? null,
    sdk: {
      readOk: sdkProbe.readOk,
      writeOk: sdkProbe.writeOk,
      readError: sdkProbe.readError,
      writeError: sdkProbe.writeError,
    },
    rest: {
      readOk: restProbe.readOk,
      writeOk: restProbe.writeOk,
      readError: restProbe.readError,
      writeError: restProbe.writeError,
      restDirectWorking: restProbe.restDirectWorking,
    },
    hint: permissionDenied
      ? keyFormat === "sb_secret"
        ? "sb_secret_* is configured but Postgres denied access. Confirm the secret key belongs to the same project as NEXT_PUBLIC_SUPABASE_URL and run GRANTs for service_role on public.profiles (see docs/SUPABASE_SCHEMA.md)."
        : "Permission denied on profiles. Use the project Secret key (sb_secret_*) or legacy service_role JWT — not the publishable/anon key — and match NEXT_PUBLIC_SUPABASE_URL."
      : !writeAccessWorking && !sdkProbe.readOk && !restProbe.readOk
        ? "Neither SDK nor REST could read profiles. Check URL, key, and network from Netlify."
        : null,
  });
}
