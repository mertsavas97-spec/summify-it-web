import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let loggedStartup = false;

export type ServiceRoleKeyFormat = "sb_secret" | "jwt" | "opaque";

export type ProfilesAccessProbeResult = {
  readOk: boolean;
  writeOk: boolean;
  readError: string | null;
  writeError: string | null;
  probeProfileId: string | null;
};

function readSupabaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url || null;
}

function readServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

function requireSupabaseUrl(): string {
  const url = readSupabaseUrl();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured. Admin billing requires the project URL.",
    );
  }
  return url;
}

function requireServiceRoleKey(): string {
  const key = readServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Webhooks and admin billing sync require the service role secret.",
    );
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon && key === anon) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must not equal NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the Secret key from Supabase Dashboard → Settings → API.",
    );
  }

  return key;
}

/** Headers required for legacy JWT and new sb_secret_* keys. */
export function buildServiceRoleHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

export function classifyServiceRoleKey(key: string): {
  keyFormat: ServiceRoleKeyFormat;
  jwtRole: string;
} {
  if (key.startsWith("sb_secret_")) {
    return { keyFormat: "sb_secret", jwtRole: "unknown" };
  }

  if (key.split(".").length === 3) {
    return { keyFormat: "jwt", jwtRole: getServiceRoleJwtRole(key) };
  }

  return { keyFormat: "opaque", jwtRole: "unknown" };
}

/**
 * Decode JWT payload role when key is JWT-shaped.
 * Returns the role claim when present, otherwise "unknown".
 */
export function getServiceRoleJwtRole(key: string): string {
  try {
    const segment = key.split(".")[1];
    if (!segment) return "unknown";

    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };

    if (typeof payload.role === "string" && payload.role.length > 0) {
      return payload.role;
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Hostname from NEXT_PUBLIC_SUPABASE_URL, or null when unset/invalid. */
export function getSupabaseUrlHost(): string | null {
  const url = readSupabaseUrl();
  if (!url) return null;

  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Service-role Supabase client for server-only admin operations (webhooks, billing sync).
 * Supports legacy JWT service_role keys and new sb_secret_* secret keys.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = requireSupabaseUrl();
    const serviceRoleKey = requireServiceRoleKey();
    const { keyFormat, jwtRole } = classifyServiceRoleKey(serviceRoleKey);

    if (!loggedStartup) {
      console.info("[summify.supabase] using service role admin client", {
        supabaseUrlHost: getSupabaseUrlHost(),
        keyFormat,
        jwtRole,
      });
      if (keyFormat === "jwt" && jwtRole !== "service_role" && jwtRole !== "unknown") {
        console.warn(
          "[summify.supabase] JWT service key role is not service_role — profile writes may fail.",
          { jwtRole },
        );
      }
      loggedStartup = true;
    }

    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: buildServiceRoleHeaders(serviceRoleKey),
      },
    });
  }

  return adminClient;
}

/** True when URL + service role key are present (does not validate JWT role). */
export function isServiceRoleConfigured(): boolean {
  return Boolean(readSupabaseUrl() && readServiceRoleKey());
}

/** Probe read/write on profiles via supabase-js admin client. */
export async function probeProfilesTableAccess(
  client: SupabaseClient,
): Promise<ProfilesAccessProbeResult> {
  const { data: row, error: readErr } = await client
    .from("profiles")
    .select("id, updated_at")
    .limit(1)
    .maybeSingle();

  if (readErr) {
    return {
      readOk: false,
      writeOk: false,
      readError: readErr.message,
      writeError: null,
      probeProfileId: null,
    };
  }

  if (!row?.id) {
    return {
      readOk: true,
      writeOk: false,
      readError: "No profile rows found to probe write access.",
      writeError: null,
      probeProfileId: null,
    };
  }

  const originalUpdatedAt = row.updated_at as string | null;
  const probeTimestamp = new Date().toISOString();

  const { error: writeErr } = await client
    .from("profiles")
    .update({ updated_at: probeTimestamp })
    .eq("id", row.id);

  if (writeErr) {
    return {
      readOk: true,
      writeOk: false,
      readError: null,
      writeError: writeErr.message,
      probeProfileId: row.id,
    };
  }

  const { error: revertErr } = await client
    .from("profiles")
    .update({ updated_at: originalUpdatedAt })
    .eq("id", row.id);

  if (revertErr) {
    return {
      readOk: true,
      writeOk: true,
      readError: null,
      writeError: `Write succeeded but revert failed: ${revertErr.message}`,
      probeProfileId: row.id,
    };
  }

  return {
    readOk: true,
    writeOk: true,
    readError: null,
    writeError: null,
    probeProfileId: row.id,
  };
}

/**
 * Probe profiles via PostgREST with explicit apikey + Authorization headers.
 * Useful when comparing sb_secret_* behavior against the JS client.
 */
export async function probeProfilesTableViaRest(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<ProfilesAccessProbeResult & { restDirectWorking: boolean }> {
  const base = supabaseUrl.replace(/\/$/, "");
  const headers = {
    ...buildServiceRoleHeaders(serviceRoleKey),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const readUrl = `${base}/rest/v1/profiles?select=id,updated_at&limit=1`;

  let readRes: Response;
  try {
    readRes = await fetch(readUrl, { method: "GET", headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REST read fetch failed";
    return {
      readOk: false,
      writeOk: false,
      readError: message,
      writeError: null,
      probeProfileId: null,
      restDirectWorking: false,
    };
  }

  if (!readRes.ok) {
    const body = await readRes.text().catch(() => "");
    return {
      readOk: false,
      writeOk: false,
      readError: `REST GET ${readRes.status}: ${body || readRes.statusText}`,
      writeError: null,
      probeProfileId: null,
      restDirectWorking: false,
    };
  }

  const rows = (await readRes.json()) as Array<{ id: string; updated_at: string | null }>;
  const row = rows[0];
  if (!row?.id) {
    return {
      readOk: true,
      writeOk: false,
      readError: "No profile rows found to probe write access.",
      writeError: null,
      probeProfileId: null,
      restDirectWorking: false,
    };
  }

  const originalUpdatedAt = row.updated_at;
  const probeTimestamp = new Date().toISOString();
  const patchUrl = `${base}/rest/v1/profiles?id=eq.${encodeURIComponent(row.id)}`;

  const writeRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ updated_at: probeTimestamp }),
  });

  if (!writeRes.ok) {
    const body = await writeRes.text().catch(() => "");
    return {
      readOk: true,
      writeOk: false,
      readError: null,
      writeError: `REST PATCH ${writeRes.status}: ${body || writeRes.statusText}`,
      probeProfileId: row.id,
      restDirectWorking: false,
    };
  }

  const revertRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ updated_at: originalUpdatedAt }),
  });

  if (!revertRes.ok) {
    const body = await revertRes.text().catch(() => "");
    return {
      readOk: true,
      writeOk: true,
      readError: null,
      writeError: `Write succeeded but revert failed: REST PATCH ${revertRes.status}: ${body || revertRes.statusText}`,
      probeProfileId: row.id,
      restDirectWorking: true,
    };
  }

  return {
    readOk: true,
    writeOk: true,
    readError: null,
    writeError: null,
    probeProfileId: row.id,
    restDirectWorking: true,
  };
}

/** @deprecated Use getSupabaseAdmin() */
export function createSupabaseAdminClient(): SupabaseClient | null {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}
