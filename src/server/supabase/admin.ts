import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAdmin,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

/**
 * Service-role client for privileged server data access.
 * Import from `src/server` so admin repositories cannot drift onto anon clients.
 */
export function getServerSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("The Supabase service-role client is server-only.");
  }

  return getSupabaseAdmin();
}

export function isServerSupabaseAdminConfigured(): boolean {
  return isServiceRoleConfigured();
}
