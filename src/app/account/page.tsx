import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getOptionalUser } from "@/lib/auth";
import { pageSeo } from "@/lib/page-metadata";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = pageSeo.account;

function PlaceholderRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        <p className="mt-0.5 text-[11px] text-zinc-600">{hint}</p>
      </div>
      <Badge variant="muted">Coming soon</Badge>
    </div>
  );
}

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not_configured");
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const email = user.email ?? "—";

  return (
    <article className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Your account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Public beta — full workspace access with no usage caps yet.
      </p>

      <section className="mt-8 space-y-4 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">{email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Status</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            Beta account — active
          </p>
        </div>
        <div className="pt-2">
          <SignOutButton />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Coming later</h2>
        <PlaceholderRow label="Usage" hint="Monthly summaries and fair-use limits." />
        <PlaceholderRow
          label="Saved analyses"
          hint="Reopen past summaries from your library."
        />
        <PlaceholderRow label="Pro plan" hint="Paid tiers when checkout launches." />
      </section>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
        <Button href="/upload" size="sm">
          Open workspace
        </Button>
        <Link href="/" className="self-center text-xs text-zinc-500 hover:text-violet-300">
          ← Home
        </Link>
      </div>
    </article>
  );
}
