import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { oauthCallbackErrorMessage } from "@/lib/auth-errors";
import { getOptionalUser } from "@/lib/auth";
import { pageSeo } from "@/lib/page-metadata";
import Link from "next/link";

export const metadata = pageSeo.login;

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

function errorCopy(code: string | undefined): string | null {
  if (!code) return null;
  if (
    code === "oauth_cancelled" ||
    code === "redirect_mismatch" ||
    code === "google_disabled"
  ) {
    return oauthCallbackErrorMessage(code);
  }
  switch (code) {
    case "auth":
      return "Sign-in failed. Request a new link and try again.";
    case "missing_code":
      return "Invalid sign-in link. Request a new one.";
    case "not_configured":
      return "Authentication is not configured on this deployment.";
    default:
      return oauthCallbackErrorMessage(code);
  }
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/account";
  const user = await getOptionalUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <article className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Sign in to Summify
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Continue with Google, or sign in with email and password or a magic link. Analysis
        stays free without an account — sign in saves completed analyses to your dashboard.
      </p>
      <div className="mt-8">
        <LoginForm nextPath={nextPath} errorMessage={errorCopy(params.error)} />
      </div>
      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link href="/upload" className="text-violet-400/80 hover:text-violet-300">
          Continue without signing in →
        </Link>
      </p>
    </article>
  );
}
