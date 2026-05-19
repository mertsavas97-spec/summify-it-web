"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type LoginFormProps = {
  nextPath?: string;
  errorMessage?: string | null;
};

export function LoginForm({ nextPath = "/account", errorMessage }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
        Authentication is not configured in this environment. Add{" "}
        <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-amber-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable
        sign-in.
      </p>
    );
  }

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl(nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for a sign-in link. You can close this tab.");
  }

  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";

  return (
    <div className="space-y-6">
      <form onSubmit={handleMagicLink} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            disabled={status === "loading" || status === "sent"}
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
          />
        </label>
        <Button
          type="submit"
          size="md"
          className="w-full"
          disabled={status === "loading" || status === "sent" || !email.trim()}
        >
          {status === "loading" ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] text-zinc-600">or</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <GoogleSignInButton nextPath={nextPath} />
        </>
      ) : (
        <p className="text-center text-[11px] text-zinc-600">
          Google sign-in will appear here once the provider is enabled in Supabase.
        </p>
      )}

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-400/90" : "text-emerald-400/90"
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        No password required. Summarize without an account anytime from the{" "}
        <a href="/upload" className="text-violet-400/80 hover:text-violet-300">
          workspace
        </a>
        .
      </p>
    </div>
  );
}
