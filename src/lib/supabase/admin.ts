import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let loggedStartup = false;

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
      "SUPABASE_SERVICE_ROLE_KEY must not equal NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the service_role secret from Supabase Dashboard → Settings → API.",
    );
  }

  return key;
}

/**
 * Decode JWT payload role without logging the key (sanity check).
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
 * Never uses anon key, browser client, or cookie-based session.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = requireSupabaseUrl();
    const serviceRoleKey = requireServiceRoleKey();

    if (!loggedStartup) {
      const role = getServiceRoleJwtRole(serviceRoleKey);
      console.info("[summify.supabase] using service role admin client", {
        supabaseUrlHost: getSupabaseUrlHost(),
        jwtRole: role,
      });
      if (role !== "service_role") {
        console.warn(
          "[summify.supabase] SUPABASE_SERVICE_ROLE_KEY JWT role is not service_role — profile writes may fail with permission denied.",
          { jwtRole: role },
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
    });
  }

  return adminClient;
}

/** True when URL + service role key are present (does not validate JWT role). */
export function isServiceRoleConfigured(): boolean {
  return Boolean(readSupabaseUrl() && readServiceRoleKey());
}

/** @deprecated Use getSupabaseAdmin() */
export function createSupabaseAdminClient(): SupabaseClient | null {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}
