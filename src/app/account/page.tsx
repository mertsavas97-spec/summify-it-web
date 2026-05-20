import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getOptionalUser,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { pageSeo } from "@/lib/page-metadata";
import { Button } from "@/components/ui/Button";
import { PortalButton } from "@/components/billing/PortalButton";
import { getBillingProvider, getBillingStatusCopy, isBillingEnabled } from "@/lib/billing/provider";
import { formatStableDate } from "@/lib/format-date";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { TEAM_ACCOUNT_PLACEHOLDER } from "@/lib/billing/plan-availability";
import { hasActivePaidEntitlement } from "@/lib/billing/entitlements";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { getUserAnalyses } from "@/server/analyses/getUserAnalyses";

export const metadata = pageSeo.account;

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-zinc-950/40 px-4 py-3">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-sm font-medium tabular-nums text-zinc-100">{value}</p>
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

  await ensureProfileForUser();

  const [profile, limits, savedCount, recentAnalyses] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
    getUserAnalyses(user.id, 3),
  ]);

  const email = profile?.email ?? user.email ?? "—";
  const planLabel = formatPlanLabel(profile?.plan ?? "free", profile);
  const paidActive = hasActivePaidEntitlement(profile);
  const daily = limits?.daily_analysis_count ?? 0;
  const monthly = limits?.monthly_analysis_count ?? 0;
  const renewalDate = profile?.current_period_end ? formatStableDate(profile.current_period_end) : "—";
  const billingInterval = profile?.billing_interval
    ? profile.billing_interval.charAt(0).toUpperCase() + profile.billing_interval.slice(1)
    : "—";
  const billing = getBillingStatusCopy();
  const billingProvider = getBillingProvider();
  const polarBillingActive = billingProvider === "polar" && isBillingEnabled();
  const showManageBilling =
    polarBillingActive &&
    Boolean(profile?.polar_customer_id || profile?.polar_subscription_id);
  const isTeamPlan = profile?.plan === "team";

  return (
    <article className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Your account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Usage, plan access, and billing status for your Summify workspace.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button href="/dashboard" size="sm">
          Open dashboard
        </Button>
        <Button href="/upload" size="sm" variant="secondary">
          New summary
        </Button>
      </div>

      <section className="mt-8 space-y-3 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5">
        <StatRow label="Email" value={email} />
        <StatRow label="Plan" value={planLabel} />
        <StatRow label="Daily analyses" value={daily} />
        <StatRow label="Monthly analyses" value={monthly} />
        <StatRow label="Saved analyses" value={savedCount} />

        <div className="pt-2">
          <SignOutButton />
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-400/80">
              Billing
            </p>
            <h2 className="mt-1 text-base font-semibold text-white">{planLabel}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {billing.accountNote}
            </p>
          </div>
          {showManageBilling ? (
            <PortalButton />
          ) : (
            <Button href="/pricing" size="sm" variant="secondary">
              View plans
            </Button>
          )}
        </div>
        {!paidActive ? (
          <p className="mt-3 rounded-lg border border-white/[0.06] bg-zinc-950/50 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
            Free includes 3 analyses per day, max 20MB uploads, PDF/DOCX/PPTX/TXT/YouTube/Web,
            5 intelligence modes, 5 Learn cards per run, and your last 3 saved analyses.
          </p>
        ) : null}
        <div className="mt-4 grid gap-2">
          <StatRow label="Billing provider" value={billing.provider === "none" ? "Pending" : billing.provider} />
          <StatRow label="Subscription status" value={profile?.subscription_status ?? "No paid subscription"} />
          <StatRow label="Billing interval" value={billingInterval} />
          <StatRow label="Renewal date" value={renewalDate} />
        </div>
        {isTeamPlan ? (
          <p className="mt-4 rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2.5 text-xs leading-relaxed text-violet-200/90">
            {TEAM_ACCOUNT_PLACEHOLDER}
          </p>
        ) : null}
      </section>

      {recentAnalyses.length > 0 && (
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">Recent saved</h2>
          <ul className="space-y-2">
            {recentAnalyses.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/dashboard/${item.id}`}
                  className="block rounded-lg border border-white/[0.06] bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-violet-500/20 hover:text-violet-200"
                >
                  {item.title ?? item.summary?.title ?? "Untitled analysis"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
        <Button href="/dashboard" size="sm" variant="secondary">
          Dashboard
        </Button>
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
