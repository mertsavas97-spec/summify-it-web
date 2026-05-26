"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback";
import {
  clearAuthReturnTo,
  readAuthReturnTo,
  readPendingAnalysis,
  resolveAuthReturnTo,
  saveAuthReturnTo,
} from "@/lib/auth/return-to";
import { trackEvent } from "@/lib/analytics/events";
import { trackMetaEvent } from "@/lib/metaPixel";
import { mapAuthError } from "@/lib/auth-errors";
import { isGoogleAuthEnabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LocalAuthDevNote } from "@/components/auth/LocalAuthDevNote";
import { Button } from "@/components/ui/Button";

type LoginFormProps = {
  nextPath?: string;
  returnTo?: string;
  errorMessage?: string | null;
  /** Set on the server from the request host for localhost checkout testing layout. */
  isLocalDev?: boolean;
  envMismatch?: boolean;
};

type FormStatus = "idle" | "loading" | "sent" | "error";
type AuthTab = "signIn" | "createAccount";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50";

export function LoginForm({
  nextPath = "/account",
  returnTo,
  errorMessage,
  isLocalDev = false,
  envMismatch = false,
}: LoginFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string | null>(errorMessage ?? null);
  const [loadingAction, setLoadingAction] = useState<
    "signIn" | "signUp" | "magic" | null
  >(null);
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

  const isBusy = loadingAction !== null;
  const magicSent = status === "sent";

  function clearFeedback() {
    if (status !== "sent") setMessage(null);
  }

  async function completeSessionRedirect() {
    const pendingAnalysis = readPendingAnalysis();
    const resolved = resolveAuthReturnTo({
      query: returnTo ?? nextPath,
      sessionStorageValue: readAuthReturnTo(),
      fallback: pendingAnalysis?.returnTo ?? "/account",
    });
    clearAuthReturnTo();
    trackEvent("auth_signin_success_redirect" as never, {
      returnTo: resolved.returnTo,
      fallbackUsed: resolved.source === "fallback",
    } as never);
    if (pendingAnalysis?.analysisId && pendingAnalysis.returnTo === resolved.returnTo) {
      trackEvent("auth_return_to_restored_analysis" as never, {
        analysisId: pendingAnalysis.analysisId,
        route: resolved.returnTo,
      } as never);
    }
    router.refresh();
    router.push(resolved.returnTo);
  }

  async function handleSignInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatus("error");
      setMessage("Enter your email and password.");
      return;
    }

    setLoadingAction("signIn");
    setStatus("loading");
    saveAuthReturnTo(returnTo ?? nextPath);
    trackEvent("signup_started", { method: "password", intent: "sign_in" });

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    setLoadingAction(null);

    if (error) {
      setStatus("error");
      setMessage(mapAuthError(error));
      return;
    }

    if (!data.session) {
      setStatus("error");
      setMessage("Sign-in did not complete. Try again or use a magic link.");
      return;
    }

    setStatus("idle");
    trackEvent("signup_completed", { method: "password" });
    trackMetaEvent("CompleteRegistration");
    await completeSessionRedirect();
  }

  async function handleCreateAccount(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatus("error");
      setMessage("Enter your email and a password to create an account.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password is too weak. Use at least 6 characters.");
      return;
    }

    setLoadingAction("signUp");
    setStatus("loading");
    saveAuthReturnTo(returnTo ?? nextPath);
    trackEvent("signup_started", { method: "password", intent: "sign_up" });

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(
          returnTo ?? nextPath,
          typeof window !== "undefined" ? window.location.origin : undefined,
        ),
      },
    });

    setLoadingAction(null);

    if (error) {
      setStatus("error");
      setMessage(mapAuthError(error));
      return;
    }

    if (data.session) {
      setStatus("idle");
      trackEvent("signup_completed", { method: "password" });
      trackMetaEvent("CompleteRegistration");
      await completeSessionRedirect();
      return;
    }

    setStatus("sent");
    setMessage(
      "Account created. Check your email to confirm your address, then sign in with your password.",
    );
  }

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus("error");
      setMessage("Enter your email to receive a magic link.");
      return;
    }

    setLoadingAction("magic");
    setStatus("loading");
    saveAuthReturnTo(returnTo ?? nextPath);
    trackEvent("signup_started", { method: "magic_link", intent: "sign_in" });

    const supabase = createClient();
    const browserOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const redirectTo = getAuthCallbackUrl(returnTo ?? nextPath, browserOrigin);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoadingAction(null);

    if (error) {
      setStatus("error");
      setMessage(mapAuthError(error));
      return;
    }

    setStatus("sent");
    setMessage("Check your email for a sign-in link. You can close this tab.");
  }

  function handleGoogleError(googleMessage: string) {
    if (!googleMessage) return;
    setStatus("error");
    setMessage(googleMessage);
  }

  const googleEnabled = isGoogleAuthEnabled();

  const tabButtonClass = (active: boolean) =>
    `flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-500/30"
        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
    }`;

  const emailPasswordForm = (
    <form
      onSubmit={activeTab === "signIn" ? handleSignInWithPassword : handleCreateAccount}
      className="space-y-4"
    >
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFeedback();
            }}
            placeholder="you@university.edu"
            disabled={isBusy || magicSent}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFeedback();
            }}
            placeholder="At least 6 characters"
            disabled={isBusy || magicSent}
            className={inputClassName}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            size="md"
            className="w-full"
            disabled={isBusy || magicSent || !email.trim() || !password}
          >
            {activeTab === "signIn"
              ? loadingAction === "signIn"
                ? "Signing in…"
                : "Sign in"
              : loadingAction === "signUp"
                ? "Creating account…"
                : "Create account"}
          </Button>
        </div>
    </form>
  );

  const googleBlock = (
    <>
      <GoogleSignInButton
        nextPath={nextPath}
        returnTo={returnTo}
        onError={handleGoogleError}
        disabled={isBusy || magicSent}
      />
      {!googleEnabled && isSupabaseConfigured() && (
        <p className="text-[11px] text-zinc-600">
          Google sign-in requires{" "}
          <code className="text-zinc-500">NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true</code> in
          your environment after the Supabase Google provider is configured.
        </p>
      )}
    </>
  );

  const magicLinkBlock = !isLocalDev ? (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[11px] text-zinc-600">or</span>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <form onSubmit={handleMagicLink}>
        <Button
          type="submit"
          variant="secondary"
          size="md"
          className="w-full"
          disabled={isBusy || magicSent || !email.trim()}
        >
          {loadingAction === "magic" ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  ) : (
    <p className="text-center text-[11px] text-zinc-600">
      Magic links are disabled for local checkout testing — use password sign-in above.
    </p>
  );

  const divider = (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[11px] text-zinc-600">or</span>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <LocalAuthDevNote
        nextPath={nextPath}
        isLocalDev={isLocalDev}
        envMismatch={envMismatch}
      />

      {isLocalDev ? (
        <>
          <p className="text-xs font-medium text-violet-300/90">
            Recommended for local checkout testing
          </p>
          <div className="inline-flex w-full rounded-full border border-white/[0.08] bg-zinc-950/60 p-1">
            <button type="button" className={tabButtonClass(activeTab === "signIn")} onClick={() => setActiveTab("signIn")}>
              Sign in
            </button>
            <button type="button" className={tabButtonClass(activeTab === "createAccount")} onClick={() => setActiveTab("createAccount")}>
              Create account
            </button>
          </div>
          {emailPasswordForm}
          {divider}
          {googleBlock}
          {magicLinkBlock}
        </>
      ) : (
        <>
          <div className="inline-flex w-full rounded-full border border-white/[0.08] bg-zinc-950/60 p-1">
            <button type="button" className={tabButtonClass(activeTab === "signIn")} onClick={() => setActiveTab("signIn")}>
              Sign in
            </button>
            <button type="button" className={tabButtonClass(activeTab === "createAccount")} onClick={() => setActiveTab("createAccount")}>
              Create account
            </button>
          </div>
          {googleBlock}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] text-zinc-600">
              {activeTab === "signIn" ? "or sign in with email" : "or create with email"}
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          {emailPasswordForm}
          {magicLinkBlock}
        </>
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
        Analysis stays free without an account. Open the{" "}
        <a href="/upload" className="text-violet-400/80 hover:text-violet-300">
          workspace
        </a>{" "}
        anytime — sign in to save analyses to your dashboard.
      </p>
    </div>
  );
}
