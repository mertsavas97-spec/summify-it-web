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

  return error.message?.trim() || "Something went wrong. Please try again.";
}
