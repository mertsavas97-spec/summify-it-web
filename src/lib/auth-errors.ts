/** Map Supabase Auth errors to clean, user-facing copy. */
export function mapAuthError(error: { message?: string; code?: string }): string {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    code === "invalid_credentials"
  ) {
    return "Invalid email or password. Check your details and try again.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    code === "user_already_exists"
  ) {
    return "An account with this email already exists. Sign in or use a magic link.";
  }

  if (
    message.includes("password should be at least") ||
    message.includes("weak password") ||
    code === "weak_password"
  ) {
    return "Password is too weak. Use at least 6 characters.";
  }

  if (
    message.includes("email not confirmed") ||
    message.includes("not confirmed") ||
    code === "email_not_confirmed"
  ) {
    return "Confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("email rate limit") ||
    code === "over_email_send_rate_limit"
  ) {
    return "Too many sign-in attempts. Wait a few minutes, or use email and password instead.";
  }

  if (message.includes("signup is disabled")) {
    return "New sign-ups are disabled on this project. Contact support.";
  }

  if (message.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (
    (message.includes("oauth") && message.includes("not enabled")) ||
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider")
  ) {
    return "Google sign-in is not enabled. Ask the admin to enable the Google provider in Supabase.";
  }

  if (
    message.includes("redirect") ||
    message.includes("redirect_uri") ||
    code === "redirect_uri_mismatch"
  ) {
    return "Redirect URL mismatch. Check Supabase redirect URLs and Google OAuth settings (see docs/AUTH_SETUP.md).";
  }

  return error.message?.trim() || "Something went wrong. Please try again.";
}

/** Map OAuth provider errors from `signInWithOAuth` before redirect. */
export function mapOAuthSignInError(error: { message?: string; code?: string }): string {
  const mapped = mapAuthError(error);
  if (mapped !== (error.message?.trim() || "Something went wrong. Please try again.")) {
    return mapped;
  }

  const message = (error.message ?? "").toLowerCase();
  if (message.includes("popup") || message.includes("closed")) {
    return "Sign-in was cancelled. Try again when you're ready.";
  }

  return mapped;
}

/** Map `error` / `error_description` query params on `/auth/callback`. */
export function oauthCallbackErrorCode(
  error: string,
  description?: string | null,
): string {
  const normalized = error.toLowerCase();
  const desc = (description ?? "").toLowerCase();

  if (normalized === "access_denied" || desc.includes("access_denied")) {
    return "oauth_cancelled";
  }

  if (
    normalized.includes("redirect") ||
    desc.includes("redirect_uri") ||
    desc.includes("redirect")
  ) {
    return "redirect_mismatch";
  }

  return "auth";
}

export function oauthCallbackErrorMessage(code: string): string {
  switch (code) {
    case "oauth_cancelled":
      return "Google sign-in was cancelled. Try again when you're ready.";
    case "redirect_mismatch":
      return "Redirect URL mismatch. Add this site’s callback URL in Supabase and Google Cloud (see docs/AUTH_SETUP.md).";
    case "google_disabled":
      return "Google sign-in is not enabled on this deployment.";
    default:
      return "Sign-in failed. Try again or use email and password.";
  }
}
