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
function getSupabaseUrlHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export async function getMobileUserFromBearer(
  authorizationHeader: string | null,
): Promise<MobileAuthResult> {
  const hasAuthorizationHeader = Boolean(authorizationHeader);
  const [scheme, token, ...rest] = authorizationHeader
    ? authorizationHeader.trim().split(/\s+/)
    : [];
  const bearerPrefixValid = scheme === "Bearer" && Boolean(token) && rest.length === 0;

  const supabaseUrlHost = getSupabaseUrlHost();

  if (!authorizationHeader) {
    return {
      ok: false,
      code: "missing_authorization_header",
      message: "Missing Authorization header.",
    };
  }

  if (scheme !== "Bearer" || !token || rest.length > 0) {
    return {
      ok: false,
      code: "invalid_authorization_format",
      message: "Authorization header must use the format: Bearer <token>.",
    };
  }

  try {
    const supabaseAdmin = getServerSupabaseAdmin();

    console.warn("[mobile_auth_verify_start]", {
      hasAuthorizationHeader,
      bearerPrefixValid,
      tokenLengthBucket: token ? "present" : "missing",
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      supabaseUrlHost,
    });

    const {
      data,
      error,
    } = await supabaseAdmin.auth.getUser(token);

    console.warn("[mobile_auth_verify_result]", {
      hasUser: Boolean(data?.user),
      hasError: Boolean(error),
      errorName: error?.name ?? null,
      errorMessage: error?.message ?? null,
      errorStatus: error?.status ?? null,
    });

    if (error || !data?.user) {
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
      user: data.user,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: unknown }).status ?? null
        : null;

    console.warn("[mobile_auth_verify_threw]", {
      errorName,
      errorMessage,
      errorStatus,
      supabaseUrlHost,
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });

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
