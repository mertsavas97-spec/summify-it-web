import "server-only";

import type { User } from "@supabase/supabase-js";
import { devWarn } from "@/server/logging";
import { getServerSupabaseAdmin } from "@/server/supabase/admin";

export type MobileAuthenticatedUser = User;

export type MobileAuthErrorCode =
  | "missing_authorization_header"
  | "invalid_authorization_format"
  | "invalid_or_expired_token"
  | "auth_verification_failed";

export type MobileAuthError = {
  ok: false;
  code: MobileAuthErrorCode;
  message: string;
};

export type MobileAuthSuccess = {
  ok: true;
  user: MobileAuthenticatedUser;
};

export type MobileAuthResult = MobileAuthSuccess | MobileAuthError;

/**
 * Mobile API auth helper.
 *
 * Validates `Authorization: Bearer <supabase_access_token>` and returns
 * a normalized auth result without exposing raw tokens in logs/responses.
 */
export async function getMobileUserFromBearer(
  authorizationHeader: string | null,
): Promise<MobileAuthResult> {
  if (!authorizationHeader) {
    return {
      ok: false,
      code: "missing_authorization_header",
      message: "Missing Authorization header.",
    };
  }

  const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    return {
      ok: false,
      code: "invalid_authorization_format",
      message: "Authorization header must use the format: Bearer <token>.",
    };
  }

  try {
    const supabaseAdmin = getServerSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      devWarn("[mobile-auth] bearer token validation failed", {
        reason: error?.message ?? "no_user",
      });

      return {
        ok: false,
        code: "invalid_or_expired_token",
        message: "Invalid or expired bearer token.",
      };
    }

    return {
      ok: true,
      user,
    };
  } catch (error) {
    devWarn("[mobile-auth] unexpected token verification failure", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      ok: false,
      code: "auth_verification_failed",
      message: "Unable to verify bearer token.",
    };
  }
}
