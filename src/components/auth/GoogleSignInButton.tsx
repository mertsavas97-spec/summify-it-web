"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";
import { saveAuthReturnTo } from "@/lib/auth/return-to";
import { trackEvent } from "@/lib/analytics/events";
import { mapOAuthSignInError } from "@/lib/auth-errors";
import { isGoogleAuthEnabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/Button";

type GoogleSignInButtonProps = {
  nextPath?: string;
  onError?: (message: string) => void;
  disabled?: boolean;
};

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  nextPath = "/account",
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabaseReady = isSupabaseConfigured();
  const googleEnabled = isGoogleAuthEnabled();

  if (!supabaseReady) {
    return null;
  }

  async function handleGoogleSignIn() {
    if (!googleEnabled) {
      onError?.(
        "Google sign-in is not enabled on this deployment. Set NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true after configuring the provider.",
      );
      return;
    }

    setLoading(true);
    saveAuthReturnTo(nextPath);
    trackEvent("signup_started", { method: "google", intent: "sign_in" });

    const supabase = createClient();
    const browserOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const redirectTo = getAuthCallbackUrl(nextPath, browserOrigin);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      onError?.(mapOAuthSignInError(error));
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="w-full gap-2"
      disabled={disabled || loading || !googleEnabled}
      onClick={() => void handleGoogleSignIn()}
      title={
        googleEnabled
          ? undefined
          : "Enable NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true when Google is configured in Supabase"
      }
    >
      <GoogleIcon />
      {loading ? "Redirecting to Google…" : "Continue with Google"}
    </Button>
  );
}
