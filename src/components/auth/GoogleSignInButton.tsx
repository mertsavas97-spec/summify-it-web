"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";
import { isGoogleAuthEnabled } from "@/lib/supabase/env";
import { Button } from "@/components/ui/Button";

type GoogleSignInButtonProps = {
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/account" }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const enabled = isGoogleAuthEnabled();

  if (!enabled) {
    return null;
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl(nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      console.error(error.message);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="w-full"
      disabled={loading}
      onClick={handleGoogleSignIn}
    >
      {loading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
