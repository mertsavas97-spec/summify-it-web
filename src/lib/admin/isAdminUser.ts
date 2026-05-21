import type { User } from "@supabase/supabase-js";
import { getProfile } from "@/lib/supabase/profile";

const ADMIN_EMAIL_ALLOWLIST = new Set(["mertsavas97@gmail.com"]);

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized != null && ADMIN_EMAIL_ALLOWLIST.has(normalized);
}

function profileHasAdminRole(profile: { role?: string | null } | null | undefined): boolean {
  return profile?.role?.trim().toLowerCase() === "admin";
}

/**
 * Whether the signed-in user may access admin routes and metrics APIs.
 * Checks allowlisted email first, then optional `profiles.role = 'admin'`.
 */
export async function isAdminUser(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;

  if (isAllowlistedAdminEmail(user.email)) return true;

  try {
    const profile = await getProfile(user.id);
    return profileHasAdminRole(profile as { role?: string | null } | null);
  } catch {
    return false;
  }
}
