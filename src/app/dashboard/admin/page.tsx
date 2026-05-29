import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { SendTestNotificationButton } from "@/components/admin/SendTestNotificationButton";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import {
  ensureProfileForUser,
  formatPlanLabel,
  getProfile,
  getUserLimits,
} from "@/lib/auth";
import { createPageMetadata } from "@/lib/metadata";
import { getAdminMetrics } from "@/server/admin/getAdminMetrics";
import { countUserAnalyses } from "@/server/analyses/countUserAnalyses";
import { DEFAULT_PAID_PREVIEW_PLAN } from "@/types/plan";

export const metadata: Metadata = createPageMetadata({
  title: "Admin Dashboard",
  description: "Internal product metrics for Summify.",
  path: "/dashboard/admin",
  noIndex: true,
});

export default async function AdminDashboardPage() {
  const user = await requireAdminPage();

  await ensureProfileForUser();

  const [profile, limits, savedCount, metrics] = await Promise.all([
    getProfile(user.id),
    getUserLimits(user.id),
    countUserAnalyses(user.id),
    getAdminMetrics(),
  ]);

  const planLabel = formatPlanLabel(profile?.plan ?? DEFAULT_PAID_PREVIEW_PLAN, profile);
  const daily = limits?.daily_analysis_count ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar
        savedCount={savedCount}
        dailyCount={daily}
        planLabel={planLabel}
      />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-zinc-900/50 to-zinc-950/80 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="accent" className="mb-2">
                  Internal
                </Badge>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Admin Dashboard
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                  Live product usage, users, and subscription metrics.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href="/dashboard/admin/api-health" size="sm" variant="secondary">
                  API Health
                </Button>
                <Button href="/dashboard/admin/analytics" size="sm" variant="secondary">
                  Analytics
                </Button>
                <Button href="/dashboard/admin/blog" size="sm" variant="secondary">
                  Blog CMS
                </Button>
                <SendTestNotificationButton />
                <Button href="/dashboard" size="sm" variant="secondary">
                  Back to workspace
                </Button>
              </div>
            </div>
          </header>

          <div className="mt-8">
            <AdminDashboardView metrics={metrics} />
          </div>

          <p className="mt-8 text-center text-[11px] text-zinc-600">
            <Link href="/dashboard" className="hover:text-zinc-400">
              Return to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
