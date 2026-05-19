import Link from "next/link";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function DashboardSignedOut() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Workspace
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Your intelligence library
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Sign in to save completed analyses, revisit Learn cards, and track usage during public
        beta. Analysis stays free without an account.
      </p>

      {isSupabaseConfigured() ? (
        <Button href="/login?next=/dashboard" size="md" className="mt-6">
          Sign in to your workspace
        </Button>
      ) : (
        <p className="mt-6 text-sm text-amber-200/80">Authentication is not configured.</p>
      )}

      <div className="mt-12">
        <DashboardEmptyState
          title="Try Summify without signing in"
          description="Run live analysis from the workspace — sign in when you want sessions saved to your dashboard."
          primaryAction={{ href: "/upload", label: "Continue to workspace" }}
        />
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600">
        <Link href="/upload" className="text-violet-400/80 hover:text-violet-300">
          Open workspace without signing in →
        </Link>
      </p>
    </article>
  );
}
