import "server-only";

import { getSupabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";

export type AdminOAuthProvider = "google_analytics";

export type AdminOAuthTokenRow = {
  provider: AdminOAuthProvider;
  refresh_token: string | null;
  scope: string | null;
  token_type: string | null;
  expires_at: string | null;
  connected_at: string | null;
  updated_at: string;
  created_at: string;
};

export function isAdminOAuthStorageConfigured(): boolean {
  return isServiceRoleConfigured();
}

export async function getAdminOAuthToken(
  provider: AdminOAuthProvider,
): Promise<AdminOAuthTokenRow | null> {
  if (!isServiceRoleConfigured()) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("admin_oauth_tokens")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    // This table is intentionally locked down (RLS + no public policies).
    // If service-role is misconfigured (or DB grants are missing), Supabase can return
    // a "permission denied" error which would otherwise bubble into the admin UI.
    //
    // For the dashboard, the safe default is "not connected".
    // IMPORTANT: Do not log token values; do not leak sensitive details.
    const message = error.message ?? "";
    if (message.toLowerCase().includes("permission denied")) {
      return null;
    }

    // Other errors should still surface so we can detect schema/config problems.
    throw new Error("Failed to read admin oauth token.");
  }

  return (data as AdminOAuthTokenRow | null) ?? null;
}

export async function upsertAdminOAuthToken(
  provider: AdminOAuthProvider,
  input: {
    refreshToken: string;
    scope?: string | null;
    tokenType?: string | null;
    expiresAt?: Date | null;
    connectedAt?: Date | null;
  },
): Promise<void> {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase service role not configured; cannot store OAuth tokens.");
  }

  const admin = getSupabaseAdmin();
  const now = new Date();

  const row = {
    provider,
    refresh_token: input.refreshToken,
    scope: input.scope ?? null,
    token_type: input.tokenType ?? null,
    expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
    connected_at: (input.connectedAt ?? now).toISOString(),
    updated_at: now.toISOString(),
  };

  const { error } = await admin.from("admin_oauth_tokens").upsert(row);
  if (error) {
    throw new Error(`Failed to store admin oauth token: ${error.message}`);
  }
}

export async function clearAdminOAuthToken(provider: AdminOAuthProvider): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("admin_oauth_tokens").delete().eq("provider", provider);
  if (error) {
    throw new Error(`Failed to clear admin oauth token: ${error.message}`);
  }
}
