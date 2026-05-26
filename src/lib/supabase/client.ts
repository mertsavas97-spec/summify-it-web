import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

function isInvalidRefreshTokenError(error: unknown): error is { message?: string; name?: string; status?: number } {
  if (!error || typeof error !== "object") return false;

  const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  const name = "name" in error && typeof error.name === "string" ? error.name.toLowerCase() : "";

  return (
    name.includes("authapierror") &&
    (message.includes("invalid refresh token") || message.includes("refresh token not found"))
  );
}

function logAuthRecoveryEvent(
  event: "auth_refresh_token_invalid_cleared" | "auth_session_recovered_as_signed_out",
  payload: Record<string, string>,
) {
  if (typeof window === "undefined") return;

  import("@/lib/analytics/events")
    .then(({ trackEvent }) => {
      trackEvent(event, payload as never);
    })
    .catch(() => {
      // Never break auth recovery on analytics import issues.
    });
}

export async function recoverInvalidRefreshSession(
  supabase: SupabaseClient,
  source: string,
  error: unknown,
): Promise<boolean> {
  if (!isInvalidRefreshTokenError(error)) return false;

  const reason = error.message ?? "invalid_refresh_token";

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best effort; continue to signed-out rendering.
  }

  logAuthRecoveryEvent("auth_refresh_token_invalid_cleared", { reason, source });
  logAuthRecoveryEvent("auth_session_recovered_as_signed_out", { source });
  return true;
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return browserClient;
}
